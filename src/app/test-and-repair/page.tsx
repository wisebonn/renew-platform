"use client";
import { useInventory } from "../Providers";

export default function TestAndRepair() {
  const { reservations, updateReservation } = useInventory();
  // FIXED: Added : any to filter
  const repairItems = reservations.filter((res: any) => res.status === "in_repair");

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateReservation(index, { reportAttachment: base64, reportName: file.name });
      alert(`Attachment "${file.name}" stored successfully!`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="w-full text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-white">Testing & Repair</h2>
        
        {repairItems.length === 0 ? (
          <p className="text-blue-300">No items currently in repair.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {repairItems.map((repair: any, idx: number) => (
              <div key={idx} className="bg-blue-900 border border-blue-800 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-blue-100">{repair.description}</h3>
                <p className="text-sm text-blue-300 mb-4">Status: {repair.status}</p>
                
                {repair.reportName ? (
                  <p className="text-sm text-green-400 mb-4">📎 {repair.reportName} attached.</p>
                ) : (
                  <p className="text-sm text-blue-400 mb-4">No report attached yet.</p>
                )}

                <label className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded cursor-pointer inline-block">
                  Attach Report
                  <input type="file" className="hidden" onChange={(e) => handleAttachment(e, idx)} />
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}