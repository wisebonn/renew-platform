"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const AppContext = createContext<any>({
  inventory: [], setInventory: () => {},
  reservations: [], addReservation: () => {}, updateReservation: () => {}, removeReservation: () => {},
  savingsData: [], addSavingsEntry: () => {},
});

export const useInventory = () => useContext(AppContext);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [savingsData, setSavingsData] = useState<any[]>([]);

  // Safe LocalStorage loading on mount (prevents SSR errors and stale data)
  useEffect(() => {
    const inv = localStorage.getItem("inventory_data");
    const res = localStorage.getItem("reservation_data");
    const sav = localStorage.getItem("savings_data");
    if (inv) setInventory(JSON.parse(inv));
    if (res) setReservations(JSON.parse(res));
    if (sav) setSavingsData(JSON.parse(sav));
  }, []);

  // Save to LocalStorage on change
  useEffect(() => { localStorage.setItem("inventory_data", JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem("reservation_data", JSON.stringify(reservations)); }, [reservations]);
  useEffect(() => { localStorage.setItem("savings_data", JSON.stringify(savingsData)); }, [savingsData]);

  const addReservation = (item: any) => {
    setReservations((prev) => [...prev, item]);
  };

  const updateReservation = (index: number, updates: any) => {
    setReservations((prev) => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const removeReservation = (index: number) => {
    setReservations((prev) => prev.filter((_, i) => i !== index));
  };

  const addSavingsEntry = (entry: any) => setSavingsData((prev) => [...prev, entry]);

  return (
    <AppContext.Provider value={{ inventory, setInventory, reservations, addReservation, updateReservation, removeReservation, savingsData, addSavingsEntry }}>
      {children}
    </AppContext.Provider>
  );
}