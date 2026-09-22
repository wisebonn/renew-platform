"use client";
import { useInventory } from "./Providers";
import { Trash2 } from "lucide-react";

export default function Dashboard() {
  const { inventory, reservations, savingsData, removeSavingsEntry, clearSavings } = useInventory();

  const totalSavings = savingsData.reduce((acc: number, curr: any) => acc + curr.savings, 0);
  const maxSaving = Math.max(...savingsData.map((d: any) => Math.abs(d.savings)), 1);

  const activeReservations = reservations.filter((r: any) => r.status === 'reserved' || r.status === 'in_repair' || r.status === 'assessed').length;
  const deployedCount = reservations.filter((r: any) => r.status === 'deployed').length;

  return (
    <main className="w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Inventory</h3>
            <p className="text-4xl font-bold text-gray-900 mt-2">{inventory.length}</p>
          </div>
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Reservations</h3>
            <p className="text-4xl font-bold text-gray-900 mt-2">{activeReservations}</p>
          </div>
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Savings</h3>
            <p className={`text-4xl font-bold mt-2 ${totalSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalSavings >= 0 ? '$' : '-$'}{Math.abs(totalSavings).toLocaleString()}
            </p>
          </div>
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Deployed</h3>
            <p className="text-4xl font-bold text-gray-900 mt-2">{deployedCount}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Savings Breakdown by Item</h3>
            {savingsData.length > 0 && (
              <button 
                onClick={() => {
                  if(confirm("Are you sure you want to clear ALL savings data?")) clearSavings();
                }}
                className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Clear All Data
              </button>
            )}
          </div>

          {savingsData.length === 0 ? (
            <p className="text-gray-500 text-sm">No savings data yet. Go to Analytics to add your first cost comparison.</p>
          ) : (
            <div className="space-y-4">
              {savingsData.map((entry: any, idx: number) => {
                 const isPositive = entry.savings >= 0;
                 const width = (Math.abs(entry.savings) / maxSaving) * 100;
                 const itemName = entry.item_name || entry.itemName || "Unknown Item";
                 
                 return (
                   <div key={idx} className="flex items-center gap-4">
                     <div className="w-48 text-right text-sm font-medium text-gray-700 truncate" title={itemName}>
                       {itemName}
                     </div>
                     <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                       <div
                         className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                         style={{ width: `${width}%` }}
                       ></div>
                     </div>
                     <div className={`w-32 text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                       {isPositive ? '$' : '-$'}{Math.abs(entry.savings).toLocaleString()}
                     </div>
                     <button 
                       onClick={() => {
                         if(confirm(`Delete savings entry for ${itemName}?`)) removeSavingsEntry(idx);
                       }}
                       className="text-gray-400 hover:text-red-500 p-1 transition-colors"
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

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 gap-4">
            <a href="/inventory-upload" className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center font-semibold transition-colors">Upload Inventory</a>
            <a href="/quote-screening" className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center font-semibold transition-colors">Screen Quotes</a>
          </div>
        </div>
      </div>
    </main>
  );
}