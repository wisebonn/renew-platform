"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { matchQuoteToInventory } from "@/lib/matcher-utils";
import { useInventory } from "../Providers";

export default function QuoteScreening() {
  const { inventory } = useInventory();
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuoteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setQuoteFile(e.target.files[0]);
  };

  const handleAnalyzeSizing = async () => {
    if (!quoteFile) {
      alert("Please upload the Quote file.");
      return;
    }
    if (!inventory || inventory.length === 0) {
      alert("No inventory found. Please go to the Inventory Upload page and upload the Stock Holding file first.");
      return;
    }

    setIsLoading(true);

    try {
      const quoteData = await quoteFile.arrayBuffer();
      const quoteWorkbook = XLSX.read(quoteData);
      const quoteSheet = quoteWorkbook.Sheets[quoteWorkbook.SheetNames[0]];
      const quoteItems = XLSX.utils.sheet_to_json(quoteSheet, { defval: "" });

      const result = matchQuoteToInventory(quoteItems, inventory);
      setMatches(result);
      
      if (result.length === 0) {
        alert("No matches found based on your rules.");
      }
    } catch (error) {
      console.error("Error parsing files", error);
      alert("There was an error reading the quote file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReserve = (match: any) => {
    console.log("Reserving item:", match.inventoryItem);
    alert(`Reserved: ${match.inventoryItem["Description"]}`);
  };

  const handleDecline = (match: any) => {
    setMatches(matches.filter(m => m !== match));
  };

  return (
    <main className="w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Quote Screening Engine
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-xl sticky top-8 space-y-4">
            <h3 className="text-lg font-bold text-slate-400 uppercase tracking-wider">
              Upload Quote
            </h3>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">1. Quote File</label>
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                onChange={handleQuoteUpload}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            <button
              onClick={handleAnalyzeSizing}
              disabled={!quoteFile || isLoading}
              className="w-full mt-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg border border-slate-700 transition-colors"
            >
              {isLoading ? "Analyzing..." : "Analyze Quote"}
            </button>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-400 uppercase tracking-wider mb-4">
              Matched Results
            </h3>

            {matches.length === 0 ? (
              <p className="text-slate-500 text-sm">
                Please upload a Quote and click Analyze to see the matches.
              </p>
            ) : (
              <div className="overflow-y-auto h-[600px] border border-slate-800 rounded">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800 text-slate-300 sticky top-0">
                    <tr>
                      <th className="p-3">Quote Item</th>
                      <th className="p-3">Match Type</th>
                      <th className="p-3">Inventory Item</th>
                      <th className="p-3">Available</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {matches.map((match, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50">
                        <td className="p-3 text-slate-300">{match.quoteItem["ITEMS"] || match.quoteItem["Items"] || "N/A"}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${match.matchType === 'exact' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                            {match.matchType}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{match.inventoryItem["Description"] || "N/A"}</td>
                        <td className="p-3 text-slate-300">{match.inventoryItem["On hand"] || match.inventoryItem["On hand?"]}</td>
                        <td className="p-3 space-x-2">
                          <button 
                            onClick={() => handleReserve(match)}
                            className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                          >
                            Reserve
                          </button>
                          <button 
                            onClick={() => handleDecline(match)}
                            className="bg-red-900 hover:bg-red-800 text-white px-3 py-1 rounded text-xs"
                          >
                            Decline
                          </button>
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