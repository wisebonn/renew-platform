"use client";
import { useState } from "react";
import { useInventory } from "../Providers";

export default function Analytics() {
  const { addSavingsEntry } = useInventory();
  const [newCost, setNewCost] = useState("");
  const [replacementCost, setReplacementCost] = useState("");
  const [quantity, setQuantity] = useState("");
  const [savings, setSavings] = useState<number | null>(null);

  const calculateSavings = () => {
    const nc = parseFloat(newCost);
    const rc = parseFloat(replacementCost);
    const q = parseInt(quantity);

    if (isNaN(nc) || isNaN(rc) || isNaN(q) || q <= 0) {
      alert("Please enter valid numbers for all fields.");
      return;
    }

    const totalSavings = (rc - nc) * q;
    setSavings(totalSavings);
    
    // Save to global state so Dashboard can see it!
    addSavingsEntry({ itemName: "Manual Entry", newCost: nc, replacementCost: rc, quantity: q, savings: totalSavings, date: new Date().toLocaleDateString() });
    alert("Savings calculated and saved to Dashboard!");
  };

  return (
    <main className="w-full text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-white">Analytics & Savings Calculator</h2>
        
        <div className="bg-blue-900 border border-blue-800 p-6 rounded-lg shadow-xl">
          <h3 className="text-lg font-bold text-cyan-400 uppercase mb-4">Manual Cost Entry</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm text-blue-200 mb-1">Cost of New Item ($)</label>
              <input type="number" value={newCost} onChange={(e) => setNewCost(e.target.value)} className="w-full bg-blue-800 border border-blue-700 rounded p-2 text-white" placeholder="e.g. 1500" />
            </div>
            <div>
              <label className="block text-sm text-blue-200 mb-1">Cost of Replacement ($)</label>
              <input type="number" value={replacementCost} onChange={(e) => setReplacementCost(e.target.value)} className="w-full bg-blue-800 border border-blue-700 rounded p-2 text-white" placeholder="e.g. 2500" />
            </div>
            <div>
              <label className="block text-sm text-blue-200 mb-1">Quantity</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full bg-blue-800 border border-blue-700 rounded p-2 text-white" placeholder="e.g. 10" />
            </div>
          </div>

          <button onClick={calculateSavings} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg">
            Calculate & Save Savings
          </button>

          {savings !== null && (
            <div className="mt-6 bg-blue-800 border border-blue-600 p-6 rounded-lg text-center">
              <h4 className="text-lg text-blue-200">Total Savings</h4>
              <p className={`text-5xl font-bold ${savings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${savings.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}