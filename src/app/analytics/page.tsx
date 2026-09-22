"use client";
import { useState } from "react";
import { useInventory } from "../Providers";

export default function Analytics() {
  const { reservations, addSavingsEntry } = useInventory();
  // Only pull items that have been assessed by the workshop
  const assessedItems = reservations.filter((r: any) => r.rating && r.repair_cost);

  const [selectedItem, setSelectedItem] = useState("");
  const [newCost, setNewCost] = useState("");
  const [quantity, setQuantity] = useState("");
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [savings, setSavings] = useState<number | null>(null);

  const calculateSavings = () => {
    if (!selectedItem) return alert("Please select an assessed item.");
    const nc = parseFloat(newCost);
    const q = parseInt(quantity);
    if (isNaN(nc) || isNaN(q) || q <= 0) return alert("Please enter valid numbers.");

    // Find the selected item's details
    const item = assessedItems.find((i: any) => i.description === selectedItem);
    if (!item) return;

    // The Grading Formula
    const gradeMultipliers: any = { 5: 0.80, 4: 0.70, 3: 0.60, 2: 0.50, 1: 0.40 };
    const baseCostPrice = item["Cost price"] || nc; // Use inventory cost price if available
    const multiplier = gradeMultipliers[item.rating] || 0.50;
    
    // Calculate Shopsoiled Price: (Base Cost * Grade%) + Repair Cost
    const shopsoiledPrice = (baseCostPrice * multiplier) + item.repair_cost;
    
    // Calculate Total Savings per item
    const savingsPerItem = nc - shopsoiledPrice;
    const totalSavings = savingsPerItem * q;

    setCalculatedPrice(shopsoiledPrice);
    setSavings(totalSavings);

    addSavingsEntry({ 
      item_name: selectedItem, 
      new_cost: nc, 
      old_cost: shopsoiledPrice, 
      quantity: q, 
      savings: totalSavings, 
      date_created: new Date().toISOString()
    });
  };

  return (
    <main className="w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Analytics & Savings Calculator</h2>
        
        {/* Workshop Flow Summary */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-blue-600 mb-4">Workshop Flow Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
              <p className="text-sm font-semibold text-gray-500">Assessed Items</p>
              <p className="text-2xl font-bold text-gray-900">{assessedItems.length}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
              <p className="text-sm font-semibold text-gray-500">Average Repair Cost</p>
              <p className="text-2xl font-bold text-gray-900">
                ${assessedItems.length > 0 ? (assessedItems.reduce((acc: number, curr: any) => acc + curr.repair_cost, 0) / assessedItems.length).toFixed(2) : "0.00"}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
              <p className="text-sm font-semibold text-gray-500">Most Common Fault</p>
              <p className="text-2xl font-bold text-gray-900">Winding Burn</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-blue-600 mb-4">Pricing Calculator</h3>
          {assessedItems.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-4">
              <p className="text-gray-500">No assessed items found. Please go to Testing & Repair and grade an item first.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assessed Item</label>
                  <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select Item...</option>
                    {assessedItems.map((item: any, idx: number) => (
                      <option key={idx} value={item.description}>{item.description} (Grade {item.rating})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Equipment Cost ($)</label>
                  <input type="number" value={newCost} onChange={(e) => setNewCost(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 1500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 10" />
                </div>
              </div>
              <button onClick={calculateSavings} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                Calculate & Save Savings
              </button>
            </>
          )}

          {savings !== null && (
            <div className="mt-6 bg-blue-50 border border-blue-200 p-6 rounded-lg text-center">
              <h4 className="text-lg font-semibold text-blue-800">Pricing Breakdown for {selectedItem}</h4>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white p-4 rounded border border-blue-100">
                  <p className="text-sm text-gray-500">Calculated Shopsoiled Price</p>
                  <p className="text-2xl font-bold text-gray-900">${calculatedPrice?.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded border border-blue-100">
                  <p className="text-sm text-gray-500">Total Savings</p>
                  <p className={`text-2xl font-bold ${savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {savings >= 0 ? '$' : '-$'}{Math.abs(savings).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}