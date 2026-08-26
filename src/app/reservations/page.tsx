"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Reservations() {
  const [reservations, setReservations] = useState<any[]>([]);

  const fetchReservations = async () => {
    const { data } = await supabase
      .from('reservations')
      .select('*, inventory(*)')
      .order('reserved_at', { ascending: false });

    if (data) setReservations(data);
  };

  useEffect(() => {
    const checkExpiry = async () => {
      const now = new Date().toISOString();
      const { data: expired } = await supabase
        .from('reservations')
        .update({ status: 'expired' })
        .lt('expires_at', now)
        .eq('status', 'reserved')
        .select();

      if (expired && expired.length > 0) {
        console.log("Moved expired reservations back to pool");
      }
    };

    checkExpiry();
    fetchReservations();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('reservations').update({ status }).eq('id', id);
    fetchReservations();
  };

  return (
    <main className="w-full text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-white">Reservation Engine</h2>
        
        {reservations.length === 0 ? (
          <p className="text-blue-300">No active reservations.</p>
        ) : (
          <div className="bg-blue-900 border border-blue-800 rounded-lg p-6">
            <table className="w-full text-left text-sm">
              <thead className="text-blue-200 border-b border-blue-800">
                <tr>
                  <th className="p-3">Item</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Reserved At</th>
                  <th className="p-3">Expires At</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-800">
                {reservations.map((res) => (
                  <tr key={res.id}>
                    <td className="p-3 text-blue-100">{res.inventory?.description || "N/A"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${res.status === 'expired' ? 'bg-red-700 text-white' : res.status === 'in_repair' ? 'bg-cyan-600 text-white' : 'bg-green-600 text-white'}`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="p-3 text-blue-300">{new Date(res.reserved_at).toLocaleDateString()}</td>
                    <td className="p-3 text-blue-300">
                      {res.expires_at ? new Date(res.expires_at).toLocaleDateString() : res.expiry_date ? new Date(res.expiry_date).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="p-3 space-x-2">
                      <button onClick={() => updateStatus(res.id, 'in_repair')} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded">Test & Repair</button>
                      <button onClick={() => updateStatus(res.id, 'deployed')} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded">Deploy</button>
                      <button onClick={() => updateStatus(res.id, 'returned')} className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded">Return</button>
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