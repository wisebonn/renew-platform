"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useInventory } from "../Providers";
import { physicalGradeLabel } from "@/lib/matcher-utils";

export default function WorkshopLog() {
  const { reservations } = useInventory();
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase.from('repairs').select('*').order('created_at', { ascending: false });
      if (data) setLogs(data);
      setIsLoading(false);
    };
    fetchLogs();
  }, []);

  // Fallback: look up description from reservation if missing on repair
  const resolveDescription = (log: any) => {
    if (log.description && log.description !== "—") return log.description;
    const match = reservations.find((r: any) =>
      r.id === log.reservation_id || r.description === log.description
    );
    return match?.description || log.description || "—";
  };

  const filteredLogs = logs.filter(l =>
    !filter ||
    (l.fault_type || "").toLowerCase().includes(filter.toLowerCase()) ||
    (resolveDescription(l) || "").toLowerCase().includes(filter.toLowerCase()) ||
    (l.season || "").toLowerCase().includes(filter.toLowerCase())
  );

  const faultSummary = logs.reduce((acc: any, l: any) => { acc[l.fault_type || "Unknown"] = (acc[l.fault_type || "Unknown"] || 0) + 1; return acc; }, {});
  const seasonSummary = logs.reduce((acc: any, l: any) => { acc[l.season || "Unknown"] = (acc[l.season || "Unknown"] || 0) + 1; return acc; }, {});
  const totalRepairCost = logs.reduce((sum, l) => sum + (parseFloat(l.repair_cost) || 0), 0);

  return (
    <main className="w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Workshop Log Database</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-bold text-blue-600 uppercase">Total Repairs Logged</h3>
            <p className="text-3xl font-bold text-gray-900">{logs.length}</p>
          </div>
          <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-bold text-blue-600 uppercase">Total Repair Cost</h3>
            <p className="text-3xl font-bold text-gray-900">KES {totalRepairCost.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-bold text-blue-600 uppercase">Top Fault</h3>
            <p className="text-xl font-bold text-gray-900">
              {(Object.entries(faultSummary).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] as string) || "N/A"}
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-blue-600">Full Workshop Log</h3>
            <input type="text" placeholder="Search..." value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-gray-300 rounded-lg p-2 text-sm w-64" />
          </div>
          {isLoading ? <p className="text-gray-500 text-sm">Loading...</p> : filteredLogs.length === 0 ? <p className="text-gray-500 text-sm">No records.</p> : (
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700 sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Item Description</th>
                    <th className="p-2">Fault</th>
                    <th className="p-2">Season</th>
                    <th className="p-2 text-center">Physical</th>
                    <th className="p-2 text-right">Repair Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2 text-xs text-gray-500">{new Date(log.created_at).toLocaleDateString()}</td>
                      <td className="p-2 font-semibold text-gray-900">{resolveDescription(log)}</td>
                      <td className="p-2"><span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">{log.fault_type || "—"}</span></td>
                      <td className="p-2 text-xs">{log.season || "—"}</td>
                      <td className="p-2 text-center">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                          P{log.rating || "?"} — {physicalGradeLabel(log.rating)}
                        </span>
                      </td>
                      <td className="p-2 text-right">KES {parseFloat(log.repair_cost || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}