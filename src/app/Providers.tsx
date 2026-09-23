"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

const AppContext = createContext<any>({
  inventory: [], setInventory: () => {},
  reservations: [], addReservation: () => {}, updateReservation: () => {}, removeReservation: () => {},
  savingsData: [], addSavingsEntry: () => {}, removeSavingsEntry: () => {}, clearSavings: () => {},
  replaceInventory: () => {}, refreshAll: () => {},
  getAvailableQuantity: () => 0,
});

export const useInventory = () => useContext(AppContext);

async function safeInsert(table: string, payload: any, retries = 15) {
  let current = { ...payload };
  for (let i = 0; i < retries; i++) {
    const { data, error } = await supabase.from(table).insert([current]).select().single();
    if (!error) return { data, error: null };
    const match = error.message.match(/Could not find the '([^']+)' column/);
    if (match && match[1]) { delete current[match[1]]; continue; }
    return { data: null, error };
  }
  return { data: null, error: new Error("Max retries exceeded") };
}

async function safeBulkInsert(table: string, items: any[], retries = 15) {
  let current = items.map(i => ({ ...i }));
  for (let i = 0; i < retries; i++) {
    const { error } = await supabase.from(table).insert(current);
    if (!error) return { error: null };
    const match = error.message.match(/Could not find the '([^']+)' column/);
    if (match && match[1]) {
      current = current.map(row => { const r = { ...row }; delete r[match[1]]; return r; });
      continue;
    }
    return { error };
  }
  return { error: new Error("Max retries exceeded") };
}

async function safeUpdate(table: string, id: string, updates: any, retries = 15) {
  let current = { ...updates };
  for (let i = 0; i < retries; i++) {
    const { data, error } = await supabase.from(table).update(current).eq('id', id).select().single();
    if (!error) return { data, error: null };
    const match = error.message.match(/Could not find the '([^']+)' column/);
    if (match && match[1]) { delete current[match[1]]; continue; }
    return { data: null, error };
  }
  return { data: null, error: new Error("Max retries exceeded") };
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [savingsData, setSavingsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAll = async () => {
    const [invRes, resRes, savRes] = await Promise.all([
      supabase.from('inventory').select('*'),
      supabase.from('reservations').select('*'),
      supabase.from('savings').select('*'),
    ]);
    if (invRes.data) setInventory(invRes.data);
    if (resRes.data) setReservations(resRes.data);
    if (savRes.data) setSavingsData(savRes.data);
    setIsLoading(false);
  };

  useEffect(() => { refreshAll(); }, []);

  const addReservation = async (item: any) => {
    const reservedAt = new Date().toISOString();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const payload = {
      description: item.description,
      status: 'reserved',
      reserved_at: reservedAt,
      expires_at: expiresAt.toISOString(),
      commercial_grade: item.commercial_grade || null,
      commercial_label: item.commercial_label || null,
      cost_price: item.cost_price || 0,
      inventory_id: item.inventory_id || null,
      quantity: item.quantity || 1,
      customer: item.customer || null,
      quote_name: item.quote_name || null,
    };

    const { data, error } = await safeInsert('reservations', payload);
    if (error) { alert("Error saving reservation: " + error.message); return; }
    if (data) setReservations((prev) => [...prev, data]);
  };

  const updateReservation = async (index: number, updates: any) => {
    const item = reservations[index];
    if (!item) return;
    const { data, error } = await safeUpdate('reservations', item.id, updates);
    if (error) { alert("Error updating: " + error.message); return; }
    if (data) setReservations((prev) => prev.map((r, i) => i === index ? data : r));
  };

  const removeReservation = async (index: number) => {
    const item = reservations[index];
    if (!item) return;
    await supabase.from('reservations').delete().eq('id', item.id);
    setReservations((prev) => prev.filter((_, i) => i !== index));
  };

  const addSavingsEntry = async (entry: any) => {
    const { data, error } = await safeInsert('savings', entry);
    if (data) setSavingsData((prev) => [...prev, data]);
    if (error) alert("Error saving savings: " + error.message);
  };

  const removeSavingsEntry = async (index: number) => {
    const item = savingsData[index];
    if (!item) return;
    await supabase.from('savings').delete().eq('id', item.id);
    setSavingsData((prev) => prev.filter((_, i) => i !== index));
  };

  const clearSavings = async () => {
    await supabase.from('savings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setSavingsData([]);
  };

  const replaceInventory = async (items: any[]) => {
    if (items.length === 0) return { error: "No items" };
    await supabase.from('inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error } = await safeBulkInsert('inventory', items);
    if (error) return { error: error.message };
    await refreshAll();
    return { error: null };
  };

  const getAvailableQuantity = (item: any) => {
    const onHand = parseInt(item.on_hand) || 0;
    const itemDesc = item.description;
    const reservedQty = reservations
      .filter((r: any) =>
        r.description === itemDesc &&
        (r.status === 'reserved' || r.status === 'in_repair' || r.status === 'assessed')
      )
      .reduce((sum: number, r: any) => sum + (parseInt(r.quantity) || 1), 0);
    return Math.max(0, onHand - reservedQty);
  };

  return (
    <AppContext.Provider value={{ inventory, setInventory, reservations, addReservation, updateReservation, removeReservation, savingsData, addSavingsEntry, removeSavingsEntry, clearSavings, replaceInventory, refreshAll, getAvailableQuantity }}>
      {children}
    </AppContext.Provider>
  );
}