"use client";
import { useState } from "react";
import * as XLSX from "xlsx";
import { classifyAndExtractSpecs, getValue, calculateCommercialGrade } from "@/lib/matcher-utils";
import { useInventory } from "../Providers";

export default function InventoryUpload() {
  const { replaceInventory, inventory, getAvailableQuantity, refreshAll } = useInventory();
  const [activeTab, setActiveTab] = useState<"upload" | "sync">("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [syncUrl, setSyncUrl] = useState("");
  const [syncStatus, setSyncStatus] = useState("");

  // ---------- MANUAL UPLOAD ----------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    if (!confirm("Uploading will REPLACE the current inventory. Continue?")) return;
    setIsLoading(true);
    const file = e.target.files[0];
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);

    const cleaned = rows.map((r: any) => {
      const description = String(getValue(r, "Description"));
      const { grade, label } = calculateCommercialGrade(r);
      return {
        product_code: String(getValue(r, "Product code") || "N/A"),
        description: description || "Unknown",
        classification: String(getValue(r, "Classification") || ""),
        status: String(getValue(r, "Status") || ""),
        demand_type: String(getValue(r, "Demand type") || ""),
        age: parseInt(String(getValue(r, "Age"))) || 0,
        on_hand: parseInt(String(getValue(r, "On hand"))) || 0,
        cost_price: parseFloat(String(getValue(r, "Cost price"))) || 0,
        selling_price: parseFloat(String(getValue(r, "Selling price"))) || 0,
        commercial_grade: grade,
        commercial_label: label,
      };
    });

    const result = await replaceInventory(cleaned);
    setIsLoading(false);
    if (result?.error) alert("Error: " + result.error);
    else alert(`✅ Uploaded ${cleaned.length} items successfully!`);
  };

  // ---------- NETSTOCK SYNC ----------
  const handleSync = async () => {
    if (!syncUrl) return alert("Enter the Netstock file URL first.");
    setIsLoading(true);
    setSyncStatus("Fetching file...");
    localStorage.setItem("netstock_url", syncUrl);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: syncUrl }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setSyncStatus("Parsing Excel...");
      const buffer = Uint8Array.from(atob(json.data), c => c.charCodeAt(0));
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);

      setSyncStatus(`Processing ${rows.length} items...`);
      const cleaned = rows.map((r: any) => {
        const description = String(getValue(r, "Description"));
        const { grade, label } = calculateCommercialGrade(r);
        return {
          product_code: String(getValue(r, "Product code") || "N/A"),
          description: description || "Unknown",
          classification: String(getValue(r, "Classification") || ""),
          status: String(getValue(r, "Status") || ""),
          demand_type: String(getValue(r, "Demand type") || ""),
          age: parseInt(String(getValue(r, "Age"))) || 0,
          on_hand: parseInt(String(getValue(r, "On hand"))) || 0,
          cost_price: parseFloat(String(getValue(r, "Cost price"))) || 0,
          selling_price: parseFloat(String(getValue(r, "Selling price"))) || 0,
          commercial_grade: grade,
          commercial_label: label,
        };
      });

      setSyncStatus("Uploading...");
      const result = await replaceInventory(cleaned);
      if (result?.error) throw new Error(result.error);
      setSyncStatus(`✅ Synced ${cleaned.length} items at ${new Date().toLocaleTimeString()}`);
    } catch (err: any) {
      setSyncStatus(`❌ Sync failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- CATEGORIZE ----------
  const categorized: any = {};
  inventory.forEach((item: any) => {
    const desc = item.description || item["Description"] || "";
    const { category } = classifyAndExtractSpecs(String(desc));
    if (!categorized[category]) categorized[category] = [];
    categorized[category].push(item);
  });
  const categoriesList = Object.keys(categorized);

  const gradeCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as any;
  inventory.forEach((i: any) => { if (i.commercial_grade) gradeCounts[i.commercial_grade]++; });

  return (
    <main className="w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Inventory Portal</h2>
        </div>

        {/* TABS */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === "upload" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-800"}`}
          >
            📁 Upload File (Manual)
          </button>
          <button
            onClick={() => setActiveTab("sync")}
            className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === "sync" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-800"}`}
          >
            🔄 Netstock Sync (Auto)
          </button>
        </div>

        {/* TAB 1: MANUAL UPLOAD */}
        {activeTab === "upload" && (
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold text-blue-600 mb-3">Upload Netstock Excel File</h3>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {isLoading && <p className="mt-4 text-blue-600">Processing...</p>}
            <p className="mt-2 text-xs text-gray-500">*Uploading replaces the current inventory.</p>
          </div>
        )}

        {/* TAB 2: NETSTOCK SYNC */}
        {activeTab === "sync" && (
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-blue-600 mb-3">Netstock Auto-Sync</h3>
            <p className="text-sm text-gray-600">
              Paste a direct download link to your Netstock export file (SharePoint/OneDrive direct link).
            </p>
            <input
              type="text"
              value={syncUrl}
              onChange={(e) => setSyncUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm"
            />
            <button
              onClick={handleSync}
              disabled={isLoading || !syncUrl}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-8 rounded-lg"
            >
              {isLoading ? "Syncing..." : "Sync Now"}
            </button>
            {syncStatus && (
              <div className={`p-3 rounded-lg text-sm ${syncStatus.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : syncStatus.startsWith("❌") ? "bg-red-50 text-red-700 border border-red-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                {syncStatus}
              </div>
            )}
          </div>
        )}

        {/* GRADE DISTRIBUTION */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-blue-600 mb-4">Commercial Grade Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center"><p className="text-xs text-green-700 font-semibold">N5 - Prime</p><p className="text-2xl font-bold text-green-800">{gradeCounts[5]}</p></div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center"><p className="text-xs text-blue-700 font-semibold">N4 - Good</p><p className="text-2xl font-bold text-blue-800">{gradeCounts[4]}</p></div>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center"><p className="text-xs text-yellow-700 font-semibold">N3 - Fair</p><p className="text-2xl font-bold text-yellow-800">{gradeCounts[3]}</p></div>
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center"><p className="text-xs text-orange-700 font-semibold">N2 - Poor</p><p className="text-2xl font-bold text-orange-800">{gradeCounts[2]}</p></div>
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center"><p className="text-xs text-red-700 font-semibold">N1 - Dead</p><p className="text-2xl font-bold text-red-800">{gradeCounts[1]}</p></div>
          </div>
        </div>

        {/* CLICKABLE CATEGORIES */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-blue-600 mb-4">Click a Category to See Items & Live Quantities</h3>
          {categoriesList.length === 0 ? (
            <p className="text-gray-500 text-sm">No inventory loaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className={`p-4 rounded-lg text-center border-2 transition-all ${selectedCategory === cat ? "bg-blue-600 text-white border-blue-700" : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-blue-50"}`}
                >
                  <p className="text-xs font-semibold">{cat.replace("_", " ")}</p>
                  <p className="text-2xl font-bold">{categorized[cat].length}</p>
                  <p className="text-xs opacity-70">items</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ITEM TABLE */}
        {selectedCategory && categorized[selectedCategory] && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-blue-600 mb-4">
              {selectedCategory.replace("_", " ")} — {categorized[selectedCategory].length} items
            </h3>
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700 sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="p-2">Code</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Grade</th>
                    <th className="p-2 text-right">On Hand</th>
                    <th className="p-2 text-right">Reserved</th>
                    <th className="p-2 text-right">Available</th>
                    <th className="p-2 text-right">Cost (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categorized[selectedCategory].map((item: any, idx: number) => {
                    const onHand = parseInt(item.on_hand) || 0;
                    const available = getAvailableQuantity(item);
                    const reserved = onHand - available;
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2 font-mono text-xs">{item.product_code}</td>
                        <td className="p-2">{item.description}</td>
                        <td className="p-2"><span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-bold">N{item.commercial_grade}</span></td>
                        <td className="p-2 text-right">{onHand}</td>
                        <td className="p-2 text-right text-orange-600 font-semibold">{reserved}</td>
                        <td className={`p-2 text-right font-bold ${available > 0 ? "text-green-600" : "text-red-600"}`}>{available}</td>
                        <td className="p-2 text-right">{parseFloat(item.cost_price || 0).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}