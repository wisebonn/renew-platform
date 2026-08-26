"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestAndRepair() {
  const [repairs, setRepairs] = useState<any[]>([]);

  useEffect(() => {
    const fetchRepairs = async () => {
      const { data } = await supabase
        .from('reservations')
        .select('*, inventory(*)')
        .eq('status', 'in_repair');

      if (data) setRepairs(data);
    };
    fetchRepairs();
  }, []);

  const attachReport = async (id: string) => {
    const reportUrl = prompt("Paste report URL or enter notes:");
    if (reportUrl) {
      await supabase.from('repairs').insert({ 
        reservation_id: id, 
        inventory_id: repairs.find(r => r.id === id)?.inventory_id,
        report_attachment: reportUrl
      });
      alert("Report attached!");
    }
  };

  return (
    <main className="w-full text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-white">Testing & Repair</h2>
        
        {repairs.length === 0 ? (
          <p className="text-blue-300">No items currently in repair.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {repairs.map((repair) => (
              <div key={repair.id} className="bg-blue-900 border border-blue-800 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-blue-100">{repair.inventory?.description}</h3>
                <p className="text-sm text-blue-300 mb-4">Status: {repair.status}</p>
                <button onClick={() => attachReport(repair.id)} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded">Attach Report</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}