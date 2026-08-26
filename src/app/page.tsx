"use client";
import { useInventory } from "./Providers";

export default function Dashboard() {
  const { inventory, reservations, savingsData } = useInventory();

  const totalSavings = savingsData.reduce((acc: number, curr: any) => acc + curr.savings, 0);
  const maxSaving = Math.max(...savingsData.map((d: any) => d.savings), 1);

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
              ${totalSavings.toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-900 border border-blue-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold text-cyan-400">Deployed</h3>
            <p className="text-4xl font-bold">{reservations.filter((r: any) => r.status === 'deployed').length}</p>
          </div>
        </div>

        {/* Graph */}
        <div className="bg-blue-900 border border-blue-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-cyan-400 mb-4">Savings Graph (by Entry)</h3>
          {savingsData.length === 0 ? (
            <p className="text-blue-300">No savings data yet. Go to Analytics to add your first cost comparison.</p>
          ) : (
            <div className="flex items-end space-x-4 h-40">
              {savingsData.map((entry, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div className="w-full bg-green-500 rounded-t-md" style={{ height: `${(entry.savings / maxSaving) * 100}%` }}></div>
                  <p className="text-xs text-blue-300 mt-2">${entry.savings}</p>
                  <p className="text-xs text-blue-400">{entry.date}</p>
                </div>
              ))}
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