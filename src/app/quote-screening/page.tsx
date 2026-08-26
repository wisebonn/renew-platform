"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { matchQuoteToInventory } from "@/lib/matcher-utils";
import { useInventory } from "../Providers";
import { supabase } from "@/lib/supabase";

export default function QuoteScreening() {
  const { inventory } = useInventory();
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuoteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setQuoteFile(e.target.files[0]);
  };

  const handleAnalyzeSizing = async () => {
    if (!quoteFile) return alert("Upload Quote");
    if (!inventory.length) return alert("Upload Inventory first");

    setIsLoading(true);
    try {
      const data = await quoteFile.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const quoteItems = XLSX.utils.sheet_to_json(ws, { defval: "" });
      setMatches(matchQuoteToInventory(quoteItems, inventory));
    } catch (e) {
      alert("Error reading file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReserve = async (match: any) => {
    const { data: invItem, error: invError } = await supabase
      .from('inventory')
      .upsert({
        netstock_code: match.inventoryItem["Product code"] || "N/A",
        description: match.inventoryItem["Description"],
        category: match.matchType,
        on_hand: match.inventoryItem["On hand"] || 0
      })
      .select()
      .single();

    if (invError) return alert("Error saving inventory: " + invError.message);

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    const { error: resError } = await supabase
      .from('reservations')
      .insert([{ 
        inventory_id: invItem.id, 
        status: 'reserved',
        expires_at: expiry.toISOString()
      }]);

    if (resError) return alert("Error reserving: " + resError.message);
    
    alert("Successfully reserved for 30 days!");
    setMatches(matches.filter(m => m !== match));
  };

  const handleDecline = (match: any) => {
    setMatches(matches.filter(m => m !== match));
  };

  return (
    <main className="w-full text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-blue-800 pb-4">
          <h2 className="text-xl font-bold text-white">Quote Screening Engine</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="bg-blue-900 border border-blue-800 p-6 rounded-lg shadow-xl sticky top-8 space-y-4">
            <h3 className="text-lg font-bold text-cyan-400 uppercase">Upload Quote</h3>
            <input type="file" accept=".xlsx,.xls" onChange={handleQuoteUpload} className="block w-full text-xs text-blue-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-700 file:text-white hover:file:bg-blue-600 cursor-pointer" />
            <button onClick={handleAnalyzeSizing} disabled={!quoteFile || isLoading} className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg border border-blue-700">
              {isLoading ? "Analyzing..." : "Analyze Quote"}
            </button>
          </div>

          <div className="lg:col-span-2 bg-blue-900 border border-blue-800 rounded-lg p-6 shadow-xl">
            <h3 className="text-lg font-bold text-cyan-400 uppercase mb-4">Matches</h3>
            {matches.length === 0 ? (
              <p className="text-blue-300 text-sm">Upload Quote and Analyze.</p>
            ) : (
              <div className="overflow-y-auto h-[600px] border border-blue-800 rounded">
                <table className="w-full text-left text-sm">
                  <thead className="bg-blue-800 text-white sticky top-0">
                    <tr><th className="p-3">Quote Item</th><th className="p-3">Type</th><th className="p-3">Inventory</th><th className="p-3">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-blue-800">
                    {matches.map((match, idx) => (
                      <tr key={idx}>
                        <td className="p-3">{match.quoteItem["ITEMS"] || "N/A"}</td>
                        <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${match.matchType === 'exact' ? 'bg-blue-600 text-white' : 'bg-cyan-600 text-white'}`}>{match.matchType}</span></td>
                        <td className="p-3">{match.inventoryItem["Description"] || "N/A"}</td>
                        <td className="p-3 space-x-2">
                          <button onClick={() => handleReserve(match)} className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-xs text-white">Reserve</button>
                          <button onClick={() => handleDecline(match)} className="bg-red-700 hover:bg-red-600 px-3 py-1 rounded text-xs text-white">Decline</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}