"use client";
import { useInventory } from "../Providers";

export default function Reservations() {
  const { reservations, updateReservation, removeReservation } = useInventory();

  const getDaysLeft = (expiresAt: string) => {
    if (!expiresAt) return "N/A";
    const diffTime = new Date(expiresAt).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleDeploy = (index: number) => {
    const projectName = prompt("Enter the Project Name for deployment:");
    if (!projectName) return;

    const location = prompt("Enter the Location for deployment:");
    if (!location) return;

    updateReservation(index, { status: 'deployed', projectName, location });
    alert("Item deployed successfully! Check CSR Workflow.");
  };

  const handleReturn = (index: number) => {
    if (confirm("Are you sure you want to return this item? It will be removed from the list.")) {
      removeReservation(index);
    }
  };

  const handleRepair = (index: number) => {
    updateReservation(index, { status: 'in_repair' });
    alert("Item sent to Testing & Repair.");
  };

  return (
    <main className="w-full text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-white">Reservation Engine</h2>
        
        {reservations.length === 0 ? (
          <p className="text-blue-300">No active reservations. Go to Quote Screening to reserve items.</p>
        ) : (
          <div className="bg-blue-900 border border-blue-800 rounded-lg p-6">
            <table className="w-full text-left text-sm">
              <thead className="text-blue-200 border-b border-blue-800">
                <tr>
                  <th className="p-3">Item</th>
                  <th className="p-3">Reserved Date</th>
                  <th className="p-3">Days Left</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-800">
                {reservations.map((res, idx) => {
                  const daysLeft = getDaysLeft(res.expiresAt);
                  
                  return (
                    <tr key={idx}>
                      <td className="p-3 text-blue-100">{res.description}</td>
                      <td className="p-3 text-blue-300">
                        {res.reservedAt ? new Date(res.reservedAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="p-3">
                        <span className={`font-bold ${daysLeft <= 7 ? 'text-red-400' : 'text-green-400'}`}>
                          {daysLeft} days
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${res.status === 'deployed' ? 'bg-purple-600 text-white' : res.status === 'in_repair' ? 'bg-cyan-600 text-white' : 'bg-green-600 text-white'}`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="p-3 space-x-2">
                        {/* Item can be sent to test & repair from reserved */}
                        {res.status === 'reserved' && (
                          <button onClick={() => handleRepair(idx)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded">Test & Repair</button>
                        )}
                        
                        {/* Deploy is available for Reserved AND In Repair */}
                        {(res.status === 'reserved' || res.status === 'in_repair') && (
                          <button onClick={() => handleDeploy(idx)} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded">Deploy</button>
                        )}

                        {/* Return is available for Reserved, In Repair, AND Deployed */}
                        {(res.status === 'reserved' || res.status === 'in_repair' || res.status === 'deployed') && (
                          <button onClick={() => handleReturn(idx)} className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded">Return</button>
                        )}

                        {/* Only Deployed or Returned removes the item; so Deployed has no Test&Repair */}
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