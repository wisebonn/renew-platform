"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { matchQuoteToInventory, getValue } from "@/lib/matcher-utils";
import { useInventory } from "../Providers";
import { supabase } from "@/lib/supabase";

export default function QuoteScreening() {
  const { inventory, addReservation, reservations } = useInventory();
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [customer, setCustomer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [savedQuotes, setSavedQuotes] = useState<any[]>([]);
  const [showQuoteList, setShowQuoteList] = useState(false);
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);

  useEffect(() => { fetchSavedQuotes(); }, []);

  const fetchSavedQuotes = async () => {
    const { data } = await supabase.from("quotes").select("id, file_name, uploaded_at").order("uploaded_at", { ascending: false });
    if (data) setSavedQuotes(data);
  };

  const handleQuoteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setQuoteFile(e.target.files[0]);
  };

  const handleAnalyzeSizing = async () => {
    if (!quoteFile) return alert("Upload a Quote file.");
    if (!inventory.length) return alert("Upload Inventory first.");
    setIsLoading(true);
    try {
      const data = await quoteFile.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const quoteItems: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      let cust = "";
      for (const item of quoteItems) {
        const c = getValue(item, "CUSTOMER");
        if (c) { cust = c; break; }
      }
      setCustomer(cust);
      setMatches(matchQuoteToInventory(quoteItems, inventory));

      await supabase.from("quotes").insert([{ file_name: quoteFile.name, raw_data: quoteItems }]);
      await fetchSavedQuotes();
      alert(`✅ Quote analyzed & saved.\nCustomer: ${cust || "Unknown"}`);
    } catch (err: any) { alert("Error: " + err.message); }
    finally { setIsLoading(false); }
  };

  const loadSavedQuote = async (id: string) => {
    setIsLoading(true);
    const { data } = await supabase.from("quotes").select("raw_data").eq("id", id).single();
    if (data?.raw_data) {
      let cust = "";
      for (const item of data.raw_data) {
        const c = getValue(item, "CUSTOMER");
        if (c) { cust = c; break; }
      }
      setCustomer(cust);
      setMatches(matchQuoteToInventory(data.raw_data, inventory));
    }
    setIsLoading(false);
    setShowQuoteList(false);
  };

  const deleteSavedQuote = async (id: string) => {
    if (!confirm("Delete this saved quote?")) return;
    await supabase.from("quotes").delete().eq("id", id);
    setSavedQuotes(savedQuotes.filter((q) => q.id !== id));
  };

  const handleReserve = async (match: any) => {
    const invItem = match.inventoryItem;
    const onHand = parseInt(invItem.on_hand) || 0;
    const qtyStr = prompt(`Reserve how many units?\n\nItem: ${invItem.description}\nCustomer: ${customer || "Unknown"}\nOn Hand: ${onHand}`, "1");
    if (!qtyStr) return;
    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) return alert("Enter a valid number.");

    await addReservation({
      description: invItem.description,
      commercial_grade: invItem.commercial_grade,
      commercial_label: invItem.commercial_label,
      cost_price: invItem.cost_price || 0,
      selling_price: invItem.selling_price || 0,
      inventory_id: invItem.id,
      quantity: qty,
      customer: customer,
    });
    alert(`Reserved ${qty} x ${invItem.description}\nFor: ${customer || "Unknown"}`);
    setMatches(matches.filter((m) => m !== match));
  };

  const handleDecline = (match: any) => setMatches(matches.filter((m) => m !== match));

  const getGradeBadge = (grade: number) => {
    if (grade === 5) return "bg-green-100 text-green-700";
    if (grade === 4) return "bg-blue-100 text-blue-700";
    if (grade === 3) return "bg-yellow-100 text-yellow-700";
    if (grade === 2) return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };

  const estimatePrice = (cost: number, grade: number) => {
    if (!cost || cost === 0) return "N/A";
    const m: any = { 5: 0.80, 4: 0.70, 3: 0.60, 2: 0.50, 1: 0.40 };
    return `KES ${Math.round(cost * (m[grade] || 0.60)).toLocaleString()}`;
  };

  // Get reservations related to a specific quote (matched by customer)
  const getQuoteReservations = (file_name: string) => {
    // Match reservations by customer name across all saved quotes
    // Since we don't store quote_id on reservations, match by customer
    return reservations.filter((r: any) => r.customer);
  };

  return (
    <main className="w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quote Screening Engine</h2>
            {customer && <p className="text-sm text-blue-600 font-semibold mt-1">Customer: {customer}</p>}
          </div>
          <button onClick={() => setShowQuoteList(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg">
            📁 Saved Quotes ({savedQuotes.length})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-blue-600 uppercase">Upload Quote</h3>
            <input type="file" accept=".xlsx,.xls" onChange={handleQuoteUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            <button onClick={handleAnalyzeSizing} disabled={!quoteFile || isLoading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg">
              {isLoading ? "Analyzing..." : "Analyze & Save Quote"}
            </button>
          </div>

          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold text-blue-600 uppercase mb-4">Matched Results ({matches.length})</h3>
            {matches.length === 0 ? (
              <p className="text-gray-500 text-sm">Upload a Quote and click Analyze.</p>
            ) : (
              <div className="overflow-auto max-h-[700px] border border-gray-200 rounded">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-700 sticky top-0 border-b border-gray-200">
                    <tr><th className="p-3">Quote Item</th><th className="p-3">Match</th><th className="p-3">Inventory</th><th className="p-3">Grade</th><th className="p-3">Est. Price</th><th className="p-3">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {matches.map((match, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3">{match.quoteItem["ITEMS"] || "N/A"}</td>
                        <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${match.matchType === "exact" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{match.matchType} ({match.similarity}%)</span></td>
                        <td className="p-3">{match.inventoryItem.description}</td>
                        <td className="p-3"><span className={`px-2 py-1 text-xs font-bold rounded-full ${getGradeBadge(match.inventoryItem.commercial_grade || 3)}`}>N{match.inventoryItem.commercial_grade || 3}</span></td>
                        <td className="p-3 font-semibold">{estimatePrice(parseFloat(match.inventoryItem.cost_price) || 0, match.inventoryItem.commercial_grade || 3)}</td>
                        <td className="p-3 space-x-2">
                          <button onClick={() => handleReserve(match)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs">Reserve</button>
                          <button onClick={() => handleDecline(match)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs">Decline</button>
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

      {showQuoteList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Saved Quotes ({savedQuotes.length})</h3>
              <button onClick={() => setShowQuoteList(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-4 overflow-auto max-h-[70vh]">
              {savedQuotes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No saved quotes yet.</p>
              ) : (
                <div className="space-y-2">
                  {savedQuotes.map((q) => {
                    const reservedForQuote = reservations.filter((r: any) => r.status !== 'returned');
                    return (
                      <div key={q.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{q.file_name}</p>
                            <p className="text-xs text-gray-500">Uploaded: {new Date(q.uploaded_at).toLocaleString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setExpandedQuote(expandedQuote === q.id ? null : q.id)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-xs">
                              {expandedQuote === q.id ? "Hide Reserved" : "Show Reserved"}
                            </button>
                            <button onClick={() => loadSavedQuote(q.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">Open</button>
                            <button onClick={() => deleteSavedQuote(q.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs">Delete</button>
                          </div>
                        </div>
                        {expandedQuote === q.id && (
                          <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3">
                            <p className="text-xs font-bold text-blue-600 uppercase mb-2">Reserved Items</p>
                            {reservedForQuote.length === 0 ? (
                              <p className="text-xs text-gray-500">No reservations yet.</p>
                            ) : (
                              <table className="w-full text-xs">
                                <thead className="text-gray-500 border-b border-gray-200">
                                  <tr><th className="text-left p-1">Item</th><th className="text-left p-1">Customer</th><th className="text-center p-1">Qty</th><th className="text-left p-1">Status</th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {reservedForQuote.map((r: any, i: number) => (
                                    <tr key={i}>
                                      <td className="p-1">{r.description}</td>
                                      <td className="p-1 text-blue-600">{r.customer || "—"}</td>
                                      <td className="p-1 text-center font-bold">{r.quantity || 1}</td>
                                      <td className="p-1"><span className="px-1 py-0.5 rounded bg-green-100 text-green-700 text-xs">{r.status}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}