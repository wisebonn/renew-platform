"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

const AppContext = createContext<any>({
  inventory: [], setInventory: () => {},
  reservations: [], addReservation: () => {}, updateReservation: () => {}, removeReservation: () => {},
  savingsData: [], addSavingsEntry: () => {}, removeSavingsEntry: () => {}, clearSavings: () => {},
  replaceInventory: () => {},
});

export const useInventory = () => useContext(AppContext);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [savingsData, setSavingsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [invRes, resRes, savRes] = await Promise.all([
        supabase.from('inventory').select('*'),
        supabase.from('reservations').select('*'),
        supabase.from('savings').select('*')
      ]);

      if (invRes.data) setInventory(invRes.data);
      if (resRes.data) setReservations(resRes.data);
      if (savRes.data) setSavingsData(savRes.data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoading) supabase.from('reservations').upsert(reservations).then(() => {});
  }, [reservations, isLoading]);

  useEffect(() => {
    if (!isLoading) supabase.from('savings').upsert(savingsData).then(() => {});
  }, [savingsData, isLoading]);

  const addReservation = async (item: any) => {
    const reservedAt = new Date().toISOString();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const { data, error } = await supabase
      .from('reservations')
      .insert([{ description: item.description, status: 'reserved', reserved_at: reservedAt, expires_at: expiresAt.toISOString() }])
      .select();
    if (data) setReservations((prev) => [...prev, data[0]]);
    if (error) alert("Error saving reservation: " + error.message);
  };

  const updateReservation = (index: number, updates: any) => {
    const itemToUpdate = reservations[index];
    setReservations((prev) => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
    supabase.from('reservations').update(updates).eq('id', itemToUpdate.id).then(() => {});
  };

  const removeReservation = (index: number) => {
    const itemToRemove = reservations[index];
    setReservations((prev) => prev.filter((_, i) => i !== index));
    supabase.from('reservations').delete().eq('id', itemToRemove.id).then(() => {});
  };

  const addSavingsEntry = async (entry: any) => {
    const { data, error } = await supabase.from('savings').insert([entry]).select();
    if (data) setSavingsData((prev) => [...prev, data[0]]);
    if (error) alert("Error saving savings: " + error.message);
  };

  const removeSavingsEntry = (index: number) => {
    const itemToRemove = savingsData[index];
    setSavingsData((prev) => prev.filter((_, i) => i !== index));
    supabase.from('savings').delete().eq('id', itemToRemove.id).then(() => {});
  };

  const clearSavings = () => {
    setSavingsData([]);
    supabase.from('savings').delete().neq('id', '00000000-0000-0000-0000-000000000000').then(() => {});
  };

  const replaceInventory = async (items: any[]) => {
    if (items.length === 0) return;
    await supabase.from('inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const cleanedItems = items.map((item: any) => ({
      "Product code": item["Product code"] || "N/A",
      "Description": item["Description"] || "Unknown",
      "Classification": item["Classification"] || "OTHER",
      "On hand": item["On hand"] || 0,
      "Cost price": item["Cost price"] || 0,
      "Selling price": item["Selling price"] || 0,
    }));
    const { error } = await supabase.from('inventory').insert(cleanedItems);
    if (error) alert("Error uploading inventory: " + error.message);
    else { setInventory(cleanedItems); alert(`Successfully uploaded ${cleanedItems.length} items!`); }
  };

  return (
    <AppContext.Provider value={{ inventory, setInventory, reservations, addReservation, updateReservation, removeReservation, savingsData, addSavingsEntry, removeSavingsEntry, clearSavings, replaceInventory }}>
      {children}
    </AppContext.Provider>
  );
}