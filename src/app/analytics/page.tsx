"use client";
import { useState, useEffect } from "react";
import { useInventory } from "../Providers";
import { supabase } from "@/lib/supabase";
import { commercialGradeLabel, physicalGradeLabel } from "@/lib/matcher-utils";

export default function Analytics() {
  const { reservations, savingsData, replaceSavingsEntry, removeSavingsEntry, clearSavings } = useInventory();

  // Only items with physical grade AND final price are eligible
  const assessedItems = reservations.filter((r: any) =>
    r.physical_grade && parseFloat(r.final_shop_price || 0) > 0
  );

  const [workshopData, setWorkshopData] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [savings, setSavings] = useState<number | null>(null);

  // Fetch workshop data once on load
  useEffect(() => {
    const fetchWorkshopData = async () => {
      const { data } = await supabase.from("repairs").select("*");
      if (data) setWorkshopData(data);
    };
    fetchWorkshopData();
  }, []);

  const selected = assessedItems.find((i: any) => i.description === selectedItem);

  // Reset input when item selection changes
  useEffect(() => {
    setRetailPrice("");
    setSavings(null);
  }, [selectedItem]);

  const calculate = async () => {
    if (!selected) return alert("Select an assessed item first.");
    const rp = parseFloat(retailPrice);
    if (isNaN(rp) || rp <= 0) return alert("Enter the retail price of the new equipment.");

    const qty = parseInt(selected.quantity) || 1;
    const shopsoiled = parseFloat(selected.final_shop_price) || 0;
    const totalSavings = (rp - shopsoiled) * qty;

    // If entry already exists, confirm replace
    const existing = savingsData.find((s: any) => s.item_id === selected.id);
    if (existing) {
      const proceed = confirm(
        `Savings already calculated for "${selected.description}".\n\nCurrent retail price: KES ${parseFloat(existing.new_cost || 0).toLocaleString()}\nNew retail price: KES ${rp.toLocaleString()}\n\nReplace with new value?`
      );
      if (!proceed) {
        setRetailPrice("");
        return;
      }
    }

    const ok = await replaceSavingsEntry({
      item_name: selectedItem,
      item_id: selected.id,
      new_cost: rp,
      old_cost: shopsoiled,
      quantity: qty,
      savings: totalSavings,
      date_created: new Date().toISOString(),
    });

    if (ok) {
      setSavings(totalSavings);
      setRetailPrice("");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Delete ALL savings entries? This cannot be undone.")) return;
    await clearSavings();
    setSavings(null);
  };

  const handleDeleteEntry = async (index: number) => {
    if (!confirm("Delete this savings entry?")) return;
    await removeSavingsEntry(index);
  };

  const getSeasonDisplay = (s: string) => {
    if (s === "Long Rains") return "Mar - May";
    if (s === "Short Rains") return "Oct - Dec";
    if (s === "Dry") return "Jan - Feb, Jun - Sep";
    return s;
  };

  // Workshop summaries
  const topFault = workshopData.length > 0
    ? Object.entries(workshopData.reduce((a: any, c: any) => { a[c.fault_type] = (a[c.fault_type] || 0) + 1; return a; }, {})).sort((a: any, b: any) => b[1] - a[1])[0]?.[0]
    : "N/A";
  const peakSeasonRaw = workshopData.length > 0
    ? Object.entries(workshopData.reduce((a: any, c: any) => { a[c.season] = (a[c.season] || 0) + 1; return a; }, {})).sort((a: any, b: any) => b[1] - a[1])[0]?.[0]
    : "N/A";
  const avgRepairCost = workshopData.length > 0
    ? Math.round(workshopData.reduce((a: number, c: any) => a + (parseFloat(c.repair_cost) || 0), 0) / workshopData.length)
    : 0;

  return (
    <main className="w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Analytics & Savings Calculator</h2>

        {/* WORKSHOP FLOW */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-blue-600 mb-4">Workshop Flow Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
              <p className="text-sm font-semibold text-gray-500">Most Common Fault</p>
              <p className="text-xl font-bold text-gray-900">{topFault as string}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
              <p className="text-sm font-semibold text-gray-500">Peak Fault Season</p>
              <p className="text-base font-bold text-gray-900">{getSeasonDisplay(peakSeasonRaw as string)}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
              <p className="text-sm font-semibold text-gray-500">Repairs Logged</p>
              <p className="text-xl font-bold text-gray-900">{workshopData.length}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
              <p className="text-sm font-semibold text-gray-500">Avg Repair Cost</p>
              <p className="text-xl font-bold text-gray-900">KES {avgRepairCost.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* CALCULATOR */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-blue-600 mb-4">Savings Calculator</h3>

          {assessedItems.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <p className="text-gray-500">No assessed items found.</p>
              <p className="text-xs text-gray-400 mt-1">Items appear after being assessed via Manual Report OR Business Central.</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assessed Item</label>
                <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2 text-gray-900">
                  <option value="">Select Item...</option>
                  {assessedItems.map((item: any, idx: number) => (
                    <option key={idx} value={item.description}>{item.description} — {item.customer || "Unknown"}</option>
                  ))}
                </select>
              </div>

              {selected && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div><p className="text-xs text-blue-600 font-semibold">Customer</p><p className="text-sm font-bold text-blue-900">{selected.customer || "—"}</p></div>
                    <div><p className="text-xs text-blue-600 font-semibold">Quantity</p><p className="text-sm font-bold text-blue-900">{selected.quantity || 1}</p></div>
                    <div><p className="text-xs text-blue-600 font-semibold">Cost Price</p><p className="text-sm font-bold text-blue-900">KES {parseFloat(selected.cost_price || 0).toLocaleString()}</p></div>
                    <div><p className="text-xs text-blue-600 font-semibold">Commercial Grade</p><p className="text-sm font-bold text-blue-900">N{selected.commercial_grade} — {commercialGradeLabel(selected.commercial_grade)}</p></div>
                    <div><p className="text-xs text-blue-600 font-semibold">Physical Grade</p><p className="text-sm font-bold text-blue-900">P{selected.physical_grade} — {physicalGradeLabel(selected.physical_grade)}</p></div>
                    <div><p className="text-xs text-blue-600 font-semibold">Repair Cost</p><p className="text-sm font-bold text-blue-900">KES {parseFloat(selected.repair_cost || 0).toLocaleString()}</p></div>
                    <div className="md:col-span-2"><p className="text-xs text-blue-600 font-semibold">Final Shopsoiled Price (per unit)</p><p className="text-lg font-bold text-green-700">KES {parseFloat(selected.final_shop_price || 0).toLocaleString()}</p></div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price of ONE New Equipment — Retail (KES)</label>
                    <input
                      type="number"
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(e.target.value)}
                      className="w-full max-w-md bg-white border border-gray-300 rounded-lg p-2 text-gray-900"
                      placeholder="Enter retail price manually"
                    />
                  </div>

                  <button onClick={calculate} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg">
                    Calculate & Save Savings
                  </button>
                </>
              )}
            </>
          )}

          {savings !== null && selected && (
            <div className="mt-6 bg-green-50 border border-green-200 p-6 rounded-lg text-center">
              <h4 className="text-lg font-semibold text-green-800 mb-2">Savings for {selectedItem}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white p-4 rounded border border-green-100 text-center">
                  <p className="text-xs text-gray-500">Shopsoiled × Qty</p>
                  <p className="text-lg font-bold text-gray-900">KES {((parseFloat(selected.final_shop_price) || 0) * (parseInt(selected.quantity) || 1)).toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded border border-green-100 text-center">
                  <p className="text-xs text-gray-500">Retail × Qty</p>
                  <p className="text-lg font-bold text-gray-900">KES {((parseFloat(selected.final_shop_price) || 0) + parseFloat(String(savings)) / (parseInt(selected.quantity) || 1) + parseFloat(String(savings)) * 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded border border-green-100 text-center">
                  <p className="text-xs text-gray-500">Total Savings</p>
                  <p className={`text-2xl font-bold ${savings >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {savings >= 0 ? "KES " : "-KES "}{Math.abs(savings).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SAVINGS TRACKER */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-blue-600">Savings Entries ({savingsData.length})</h3>
            {savingsData.length > 0 && (
              <button onClick={handleClearAll} className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded-lg">
                Clear All Savings
              </button>
            )}
          </div>
          {savingsData.length === 0 ? (
            <p className="text-sm text-gray-500">No savings entries yet.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Shopsoiled</th>
                    <th className="p-2 text-right">Retail</th>
                    <th className="p-2 text-right">Savings</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {savingsData.map((s: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2 font-semibold">{s.item_name}</td>
                      <td className="p-2 text-center">{s.quantity}</td>
                      <td className="p-2 text-right">KES {parseFloat(s.old_cost || 0).toLocaleString()}</td>
                      <td className="p-2 text-right">KES {parseFloat(s.new_cost || 0).toLocaleString()}</td>
                      <td className={`p-2 text-right font-bold ${s.savings >= 0 ? "text-green-600" : "text-red-600"}`}>
                        KES {parseFloat(s.savings || 0).toLocaleString()}
                      </td>
                      <td className="p-2 text-center">
                        <button onClick={() => handleDeleteEntry(idx)} className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-2 py-1 rounded text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}