"use client";
import { useInventory } from "../Providers";

export default function CsrWorkflow() {
  const { reservations } = useInventory();
  const deployedItems = reservations.filter((res: any) => res.status === "deployed");

  return (
    <main className="w-full text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-white">CSR Workflow</h2>
        
        {deployedItems.length === 0 ? (
          <div className="bg-blue-900 border border-blue-800 p-6 rounded-lg">
            <p className="text-blue-300">No items have been deployed yet.</p>
          </div>
        ) : (
          <div className="bg-blue-900 border border-blue-800 rounded-lg p-6">
            <table className="w-full text-left text-sm">
              <thead className="text-blue-200 border-b border-blue-800">
                <tr>
                  <th className="p-3">Item</th>
                  <th className="p-3">Project Name</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-800">
                {deployedItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-3 text-blue-100">{item.description}</td>
                    <td className="p-3 text-blue-100">{item.projectName || "N/A"}</td>
                    <td className="p-3 text-blue-100">{item.location || "N/A"}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-600 text-white">deployed</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}