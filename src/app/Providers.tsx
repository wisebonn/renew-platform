"use client";
import { createContext, useContext, useState, ReactNode } from "react";

const InventoryContext = createContext<any>({ inventory: [], setInventory: () => {} });
export const useInventory = () => useContext(InventoryContext);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<any[]>([]);

  return (
    <InventoryContext.Provider value={{ inventory, setInventory }}>
      {children}
    </InventoryContext.Provider>
  );
}