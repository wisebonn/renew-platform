"use client";
import { useInventory } from "./Providers";
import { Trash2 } from "lucide-react";

export default function Dashboard() {
  const { inventory, reservations, savingsData, removeSavingsEntry, clearSavings } = useInventory();

  const totalSavings = savingsData.reduce((acc: number, curr: any) => acc + curr.savings, 0);
  const maxSaving = Math.max(...savingsData.map((d: any) => Math.abs(d.savings)), 1);

  return (
    <main className="w-full text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold text-white">Dashboard Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-900 border border-blue-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold text-cyan-400">Total Inventory</h3>
            <p className="text-4xl font-bold">{inventory.length}</p>
          </div>
          <div className="bg-blue-900 border border-blue-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold text-cyan-400">Reservations</h3>
            <p className="text-4xl font-bold">{reservations.length}</p>
          </div>
          <div className="bg-blue-900 border border-blue-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold text-cyan-400">Total Savings</h3>
            <p className={`text-4xl font-bold ${totalSavings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalSavings >= 0 ? '$' : '-$'}{Math.abs(totalSavings).toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-900 border border-blue-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold text-cyan-400">Deployed</h3>
            <p className="text-4xl font-bold">{reservations.filter((r: any) => r.status === 'deployed').length}</p>
          </div>
        </div>

        <div className="bg-blue-900 border border-blue-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-cyan-400">Savings Breakdown by Item</h3>
            {savingsData.length > 0 && (
              <button 
                onClick={() => {
                  if(confirm("Are you sure you want to clear ALL savings data?")) clearSavings();
                }}
                className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
              >
                Clear All Data
              </button>
            )}
          </div>

          {savingsData.length === 0 ? (
            <p className="text-blue-300">No savings data yet. Go to Analytics to add your first cost comparison.</p>
          ) : (
            <div className="space-y-4">
              {savingsData.map((entry, idx) => {
                 const isPositive = entry.savings >= 0;
                 const width = (Math.abs(entry.savings) / maxSaving) * 100;
                 return (
                   <div key={idx} className="flex items-center gap-4">
                     <div className="w-48 text-right text-sm text-blue-300 truncate" title={entry.itemName}>
                       {entry.itemName}
                     </div>
                     <div className="flex-1 bg-blue-800 rounded-full h-6 relative overflow-hidden">
                       <div
                         className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                         style={{ width: `${width}%` }}
                       ></div>
                     </div>
                     <div className={`w-32 text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                       {isPositive ? '$' : '-$'}{Math.abs(entry.savings).toLocaleString()}
                     </div>
                     <button 
                       onClick={() => {
                         if(confirm(`Delete savings entry for ${entry.itemName}?`)) removeSavingsEntry(idx);
                       }}
                       className="text-red-400 hover:text-red-300 p-1"
                       title="Delete this entry"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                 );
              })}
            </div>
          )}
        </div>

        <div className="bg-blue-900 border border-blue-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-cyan-400 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 gap-4">
            <a href="/inventory-upload" className="bg-blue-800 hover:bg-blue-700 p-4 rounded-lg text-center font-bold">Upload Inventory</a>
            <a href="/quote-screening" className="bg-blue-800 hover:bg-blue-700 p-4 rounded-lg text-center font-bold">Screen Quotes</a>
          </div>
        </div>
      </div>
    </main>
  );
}