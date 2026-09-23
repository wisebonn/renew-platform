"use client";
import { useInventory } from "../Providers";

export default function Reservations() {
  const { reservations, updateReservation, removeReservation } = useInventory();

  const getDaysLeft = (expiresAt: string): number => {
    if (!expiresAt) return 0;
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const handleDeploy = (index: number, customer: string) => {
    const location = prompt(`Deploy location for:\n\nItem: ${reservations[index].description}\nCustomer: ${customer || "Unknown"}`);
    if (!location) return;
    updateReservation(index, { status: 'deployed', location });
  };

  const handleReturn = (index: number) => {
    if (confirm("Return this item? It will be removed.")) removeReservation(index);
  };

  const handleRepair = (index: number) => {
    updateReservation(index, { status: 'in_repair' });
  };

  return (
    <main className="w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Reservation Engine</h2>

        {reservations.length === 0 ? (
          <p className="text-gray-500">No reservations yet.</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="p-3">Item</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3">Days Left</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reservations.map((res: any, idx: number) => {
                  const daysLeft = getDaysLeft(res.expires_at);
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-3">{res.description}</td>
                      <td className="p-3 text-blue-700 font-semibold">{res.customer || "—"}</td>
                      <td className="p-3 text-center font-bold text-blue-600">{res.quantity || 1}</td>
                      <td className="p-3"><span className={`font-bold ${daysLeft <= 7 ? 'text-red-600' : 'text-green-600'}`}>{daysLeft}d</span></td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs rounded-full text-white ${res.status === 'deployed' ? 'bg-purple-600' : res.status === 'in_repair' ? 'bg-cyan-600' : res.status === 'assessed' ? 'bg-orange-600' : 'bg-green-600'}`}>{res.status}</span>
                      </td>
                      <td className="p-3 space-x-1">
                        {res.status === 'reserved' && (
                          <>
                            <button onClick={() => handleRepair(idx)} className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs">Test</button>
                            <button onClick={() => handleDeploy(idx, res.customer)} className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs">Deploy</button>
                          </>
                        )}
                        {(res.status === 'in_repair' || res.status === 'assessed') && (
                          <button onClick={() => handleDeploy(idx, res.customer)} className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs">Deploy</button>
                        )}
                        <button onClick={() => handleReturn(idx)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs">Return</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}