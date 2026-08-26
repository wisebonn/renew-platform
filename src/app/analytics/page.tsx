"use client";
import { useState } from "react";
import { useInventory } from "../Providers";

export default function Analytics() {
  const { reservations, addSavingsEntry } = useInventory();
  const deployedItems = reservations.filter((r: any) => r.status === "deployed");

  const [selectedItem, setSelectedItem] = useState("");
  const [newCost, setNewCost] = useState("");
  const [oldCost, setOldCost] = useState("");
  const [quantity, setQuantity] = useState("");
  const [savings, setSavings] = useState<number | null>(null);

  const calculateSavings = () => {
    if (!selectedItem) return alert("Please select a deployed item.");
    const nc = parseFloat(newCost);
    const oc = parseFloat(oldCost);
    const q = parseInt(quantity);
    if (isNaN(nc) || isNaN(oc) || isNaN(q) || q <= 0) return alert("Please enter valid numbers.");

    const totalSavings = (nc - oc) * q;
    setSavings(totalSavings);

    addSavingsEntry({ 
      item_name: selectedItem, 
      new_cost: nc, 
      old_cost: oc, 
      quantity: q, 
      savings: totalSavings, 
      date_created: new Date().toISOString()
    });
    alert("Savings calculated and saved to Dashboard!");
  };

  return (
    <main className="w-full text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-white">Analytics & Savings Calculator</h2>
        {deployedItems.length === 0 ? (
          <div className="bg-blue-900 p-6 rounded-lg">
            <p className="text-blue-300">No deployed items found. Please go to the Reservation Engine and click "Deploy" on an item first.</p>
          </div>
        ) : (
          <div className="bg-blue-900 border border-blue-800 p-6 rounded-lg shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm text-blue-200 mb-1">Deployed Item</label>
                <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} className="w-full bg-blue-800 border border-blue-700 rounded p-2 text-white">
                  <option value="">Select Item...</option>
                  {deployedItems.map((item: any, idx: number) => (
                    <option key={idx} value={item.description}>{item.description}</option>
                  ))}
                </select>
              </div>
              <div><label className="block text-sm text-blue-200 mb-1">New Cost ($)</label><input type="number" value={newCost} onChange={(e) => setNewCost(e.target.value)} className="w-full bg-blue-800 border border-blue-700 rounded p-2 text-white" /></div>
              <div><label className="block text-sm text-blue-200 mb-1">Shopsoiled Cost ($)</label><input type="number" value={oldCost} onChange={(e) => setOldCost(e.target.value)} className="w-full bg-blue-800 border border-blue-700 rounded p-2 text-white" /></div>
              <div><label className="block text-sm text-blue-200 mb-1">Quantity</label><input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full bg-blue-800 border border-blue-700 rounded p-2 text-white" /></div>
            </div>
            <button onClick={calculateSavings} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg">Calculate & Save Savings</button>
            {savings !== null && (
              <div className="mt-6 bg-blue-800 border border-blue-600 p-6 rounded-lg text-center">
                <h4 className="text-lg text-blue-200">Total Savings for {selectedItem}</h4>
                <p className={`text-5xl font-bold ${savings >= 0 ? 'text-green-400' : 'text-red-400'}`}>{savings >= 0 ? '$' : '-$'}{Math.abs(savings).toLocaleString()}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}