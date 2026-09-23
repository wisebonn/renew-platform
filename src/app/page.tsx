"use client";
import { useInventory } from "./Providers";

export default function Dashboard() {
  const { inventory, reservations, savingsData } = useInventory();

  const totalOnHand = inventory.reduce((sum: number, i: any) => sum + (parseInt(i.on_hand) || 0), 0);
  const uniqueSKUs = inventory.length;

  // Only count savings tied to items currently DEPLOYED
  const deployedIds = new Set(
    reservations.filter((r: any) => r.status === "deployed").map((r: any) => r.id)
  );
  const deployedSavings = savingsData.filter((s: any) => s.item_id && deployedIds.has(s.item_id));
  const totalSavings = deployedSavings.reduce((acc: number, curr: any) => acc + (parseFloat(curr.savings) || 0), 0);

  const activeReservations = reservations.filter((r: any) =>
    r.status === "reserved" || r.status === "in_repair" || r.status === "assessed"
  ).length;
  const deployedCount = reservations.filter((r: any) => r.status === "deployed").length;

  const gradeCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as any;
  inventory.forEach((i: any) => { if (i.commercial_grade) gradeCounts[i.commercial_grade]++; });

  const seasonCounts: any = {};
  reservations.forEach((r: any) => {
    if (r.season) seasonCounts[r.season] = (seasonCounts[r.season] || 0) + 1;
  });
  const peakSeasonRaw = Object.entries(seasonCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "N/A";
  const seasonDisplay = (s: string) => {
    if (s === "Long Rains") return "Mar - May";
    if (s === "Short Rains") return "Oct - Dec";
    if (s === "Dry") return "Jan - Feb, Jun - Sep";
    return s;
  };

  return (
    <main className="w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase">Total Units On Hand</h3>
            <p className="text-3xl font-bold text-gray-900">{totalOnHand.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{uniqueSKUs} unique SKUs</p>
          </div>
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase">Active Reservations</h3>
            <p className="text-3xl font-bold text-gray-900">{activeReservations}</p>
          </div>
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase">Deployed</h3>
            <p className="text-3xl font-bold text-gray-900">{deployedCount}</p>
          </div>
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase">Deployed Savings</h3>
            <p className={`text-3xl font-bold ${totalSavings >= 0 ? "text-green-600" : "text-red-600"}`}>
              KES {totalSavings.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">{deployedSavings.length} deployed items tracked</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-blue-600 mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 uppercase">Peak Workshop Season</p>
              <p className="text-lg font-bold text-gray-900">{seasonDisplay(peakSeasonRaw as string)}</p>
              <p className="text-xs text-gray-500 mt-1">{peakSeasonRaw as string}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 uppercase">Total Reservations Ever</p>
              <p className="text-lg font-bold text-gray-900">{reservations.length}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 uppercase">Deployed Savings Items</p>
              <p className="text-lg font-bold text-gray-900">{deployedSavings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-blue-600 mb-4">Inventory by Commercial Grade</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center"><p className="text-xs text-green-700 font-semibold">N5 Prime</p><p className="text-2xl font-bold text-green-800">{gradeCounts[5]}</p></div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center"><p className="text-xs text-blue-700 font-semibold">N4 Good</p><p className="text-2xl font-bold text-blue-800">{gradeCounts[4]}</p></div>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center"><p className="text-xs text-yellow-700 font-semibold">N3 Fair</p><p className="text-2xl font-bold text-yellow-800">{gradeCounts[3]}</p></div>
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center"><p className="text-xs text-orange-700 font-semibold">N2 Poor</p><p className="text-2xl font-bold text-orange-800">{gradeCounts[2]}</p></div>
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center"><p className="text-xs text-red-700 font-semibold">N1 Dead</p><p className="text-2xl font-bold text-red-800">{gradeCounts[1]}</p></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-blue-600 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="/inventory-upload" className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg text-center font-semibold text-sm">Upload Inventory</a>
            <a href="/quote-screening" className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg text-center font-semibold text-sm">Screen Quotes</a>
            <a href="/reservations" className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg text-center font-semibold text-sm">Reservations</a>
            <a href="/analytics" className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg text-center font-semibold text-sm">Analytics</a>
          </div>
        </div>
      </div>
    </main>
  );
}