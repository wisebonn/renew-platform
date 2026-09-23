"use client";
import { useState, useEffect } from "react";
import { useInventory } from "../Providers";
import { supabase } from "@/lib/supabase";
import { calculateShopsoiledPrice, commercialGradeLabel, physicalGradeLabel } from "@/lib/matcher-utils";

export default function Analytics() {
  const { reservations, savingsData } = useInventory();
  // Only items with physical grade (from either manual or BC) are calculator-eligible
  const assessedItems = reservations.filter((r: any) => r.physical_grade && parseFloat(r.final_shop_price || 0) > 0);
  const [workshopData, setWorkshopData] = useState<any[]>([]);

  const [selectedItem, setSelectedItem] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [savings, setSavings] = useState<number | null>(null);

  useEffect(() => {
    const fetchWorkshopData = async () => {
      const { data } = await supabase.from("repairs").select("*");
      if (data) setWorkshopData(data);
    };
    fetchWorkshopData();
  }, []);

  const selected = assessedItems.find((i: any) => i.description === selectedItem);

  const getShopsoiled = (item: any): number => {
    if (!item) return 0;
    if (item.final_shop_price && parseFloat(item.final_shop_price) > 0) return parseFloat(item.final_shop_price);
    const cost = parseFloat(item.cost_price) || 0;
    const cg = parseInt(item.commercial_grade) || 3;
    const pg = parseInt(item.physical_grade) || 3;
    const rc = parseFloat(item.repair_cost) || 0;
    return calculateShopsoiledPrice(cost, cg, pg, rc);
  };

  useEffect(() => {
    setNewPrice("");
    setSavings(null);
  }, [selectedItem]);

  const calculate = () => {
    if (!selected) return alert("Select an assessed item.");
    const np = parseFloat(newPrice);
    if (isNaN(np) || np <= 0) return alert("Enter the price of one new item.");
    const qty = parseInt(selected.quantity) || 1;
    const shopsoiled = getShopsoiled(selected);
    const total = (np - shopsoiled) * qty;
    setSavings(total);

    // Save to savings log
    supabase.from("savings").insert([{
      item_name: selectedItem,
      item_id: selected.id,
      new_cost: np,
      old_cost: shopsoiled,
      quantity: qty,
      savings: total,
      date_created: new Date().toISOString(),
    }]).then(() => {});
  };

  const getSeasonDisplay = (s: string) => {
    if (s === "Long Rains") return "Mar - May";
    if (s === "Short Rains") return "Oct - Dec";
    if (s === "Dry") return "Jan - Feb, Jun - Sep";
    return s;
  };

  // ---------- WORKSHOP FLOW ----------
  const topFault = workshopData.length > 0
    ? Object.entries(workshopData.reduce((a: any, c: any) => { a[c.fault_type] = (a[c.fault_type] || 0) + 1; return a; }, {})).sort((a: any, b: any) => b[1] - a[1])[0]?.[0]
    : "N/A";
  const peakSeasonRaw = workshopData.length > 0
    ? Object.entries(workshopData.reduce((a: any, c: any) => { a[c.season] = (a[c.season] || 0) + 1; return a; }, {})).sort((a: any, b: any) => b[1] - a[1])[0]?.[0]
    : "N/A";
  const avgRepairCost = workshopData.length > 0
    ? Math.round(workshopData.reduce((a: number, c: any) => a + (parseFloat(c.repair_cost) || 0), 0) / workshopData.length)
    : 0;

  // ---------- CHART DATA ----------
  // Savings per item (potential) — use retail price - shopsoiled
  const itemsWithPotential = assessedItems.map((r: any) => {
    const retail = parseFloat(r.selling_price) || 0;
    const shopsoiled = getShopsoiled(r);
    const qty = parseInt(r.quantity) || 1;
    const potential = retail > 0 ? (retail - shopsoiled) * qty : 0;
    return { ...r, retail, shopsoiled, potential };
  });

  // Savings by fault type
  const savingsByFault: any = {};
  itemsWithPotential.forEach((i: any) => {
    const fault = i.fault_type || "Unknown";
    savingsByFault[fault] = (savingsByFault[fault] || 0) + i.potential;
  });

  // Savings by season
  const savingsBySeason: any = {};
  itemsWithPotential.forEach((i: any) => {
    const season = i.season || "Unknown";
    savingsBySeason[season] = (savingsBySeason[season] || 0) + i.potential;
  });

  // Savings by location/customer
  const savingsByLocation: any = {};
  itemsWithPotential.forEach((i: any) => {
    const loc = i.customer || "Unknown";
    savingsByLocation[loc] = (savingsByLocation[loc] || 0) + i.potential;
  });

  const maxFault = Math.max(...Object.values(savingsByFault).map((v: any) => Math.abs(v)), 1);
  const maxSeason = Math.max(...Object.values(savingsBySeason).map((v: any) => Math.abs(v)), 1);
  const maxLoc = Math.max(...Object.values(savingsByLocation).map((v: any) => Math.abs(v)), 1);

  const BarChart = ({ title, data, max }: { title: string, data: any, max: number }) => (
    <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
      <h3 className="text-sm font-bold text-blue-600 uppercase mb-4">{title}</h3>
      {Object.keys(data).length === 0 ? (
        <p className="text-xs text-gray-500">No data yet.</p>
      ) : (
        <div className="space-y-3">
          {Object.entries(data).map(([label, value]: any) => {
            const width = max > 0 ? (Math.abs(value) / max) * 100 : 0;
            const isPositive = value >= 0;
            return (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700 font-medium truncate">{label}</span>
                  <span className={`font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                    KES {value.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${isPositive ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

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

        {/* SAVINGS CALCULATOR */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-blue-600 mb-4">Savings Calculator</h3>
          {assessedItems.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <p className="text-gray-500">No assessed items found.</p>
              <p className="text-xs text-gray-400 mt-1">Items appear after being assessed via Manual Report OR Business Central booking.</p>
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
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">Customer</p>
                      <p className="text-sm font-bold text-blue-900">{selected.customer || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">Quantity</p>
                      <p className="text-sm font-bold text-blue-900">{selected.quantity || 1}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">Cost Price</p>
                      <p className="text-sm font-bold text-blue-900">KES {parseFloat(selected.cost_price || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">Retail Price</p>
                      <p className="text-sm font-bold text-blue-900">KES {parseFloat(selected.selling_price || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">Commercial</p>
                      <p className="text-sm font-bold text-blue-900">N{selected.commercial_grade} — {commercialGradeLabel(selected.commercial_grade)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">Physical</p>
                      <p className="text-sm font-bold text-blue-900">P{selected.physical_grade} — {physicalGradeLabel(selected.physical_grade)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">Repair Cost</p>
                      <p className="text-sm font-bold text-blue-900">KES {parseFloat(selected.repair_cost || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">Shopsoiled Price</p>
                      <p className="text-lg font-bold text-green-700">KES {getShopsoiled(selected).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price of ONE New Equipment (KES)</label>
                    <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-full max-w-md bg-white border border-gray-300 rounded-lg p-2 text-gray-900" placeholder="e.g. 250000" />
                  </div>

                  <button onClick={calculate} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg">Calculate & Save</button>
                </>
              )}
            </>
          )}

          {savings !== null && selected && (
            <div className="mt-6 bg-green-50 border border-green-200 p-6 rounded-lg text-center">
              <h4 className="text-lg font-semibold text-green-800 mb-2">Savings for {selectedItem}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white p-4 rounded border border-green-100 text-center">
                  <p className="text-xs text-gray-500">Shopsoiled Total × Qty</p>
                  <p className="text-lg font-bold text-gray-900">KES {(getShopsoiled(selected) * (parseInt(selected.quantity) || 1)).toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded border border-green-100 text-center">
                  <p className="text-xs text-gray-500">New Equipment × Qty</p>
                  <p className="text-lg font-bold text-gray-900">KES {(parseFloat(newPrice) * (parseInt(selected.quantity) || 1)).toLocaleString()}</p>
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

        {/* SAVINGS TRACKER — Potential only */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-blue-600 mb-4">Potential Savings — Assessed Items</h3>
          {itemsWithPotential.length === 0 ? (
            <p className="text-sm text-gray-500">No assessed items yet.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2">Customer</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Shopsoiled</th>
                    <th className="p-2 text-right">Retail</th>
                    <th className="p-2 text-right">Potential</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {itemsWithPotential.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2 font-semibold">{item.description}</td>
                      <td className="p-2 text-blue-700">{item.customer || "—"}</td>
                      <td className="p-2 text-center">{item.quantity || 1}</td>
                      <td className="p-2 text-right">KES {item.shopsoiled.toLocaleString()}</td>
                      <td className="p-2 text-right">
                        {item.retail > 0 ? `KES ${item.retail.toLocaleString()}` : <span className="text-gray-400 italic">Awaiting retail price</span>}
                      </td>
                      <td className={`p-2 text-right font-bold ${item.potential >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {item.retail > 0 ? `KES ${item.potential.toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BarChart title="Savings by Fault Type" data={savingsByFault} max={maxFault} />
          <BarChart title="Savings by Season" data={savingsBySeason} max={maxSeason} />
          <BarChart title="Savings by Customer" data={savingsByLocation} max={maxLoc} />
        </div>
      </div>
    </main>
  );
}