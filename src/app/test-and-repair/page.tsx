"use client";
import { useEffect, useState } from "react";
import { useInventory } from "../Providers";
import { supabase } from "@/lib/supabase";
import { calculateShopsoiledPrice, physicalGradeLabel } from "@/lib/matcher-utils";

export default function TestAndRepair() {
  const { reservations, updateReservation } = useInventory();
  const [role, setRole] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"manual" | "bc">("manual");
  const [showReports, setShowReports] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const repairItems = reservations.filter((res: any) => res.status === "in_repair");

  useEffect(() => {
    setRole(localStorage.getItem("role"));
  }, []);

  const fetchReports = async () => {
    const { data } = await supabase.from('repairs').select('*').order('created_at', { ascending: false });
    if (data) setReports(data);
  };

  useEffect(() => { if (role) fetchReports(); }, [showReports, role]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin2024") {
      localStorage.setItem("role", "super_admin");
      setRole("super_admin");
      setError("");
    } else if (password === "workshop2024") {
      localStorage.setItem("role", "workshop");
      setRole("workshop");
      setError("");
    } else {
      setError("Incorrect password. Contact your administrator.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("role");
    setRole(null);
  };

  // ---------- ACCESS GATE ----------
  if (!role) {
    return (
      <main className="w-full min-h-screen flex items-center justify-center">
        <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm w-96">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Workshop Access</h2>
          <p className="text-xs text-gray-500 mb-6 text-center">Super Admin or Workshop Technician only.</p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full border border-gray-300 rounded-lg p-3 text-sm" />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">Unlock</button>
          </form>
          <div className="mt-4 text-xs text-gray-400 text-center">
            Admin: admin2024<br />Workshop: workshop2024
          </div>
        </div>
      </main>
    );
  }

  // ---------- MANUAL REPORT ----------
  const handleAssessment = async (index: number, e: React.FormEvent<HTMLFormElement>, item: any) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const physicalGrade = parseInt(formData.get("physicalGrade") as string);
    const faultType = formData.get("faultType") as string;
    const repairCost = parseFloat(formData.get("repairCost") as string);

    const month = new Date().getMonth();
    let season = "Dry";
    if (month >= 2 && month <= 4) season = "Long Rains";
    if (month >= 9 && month <= 11) season = "Short Rains";

    const costPrice = parseFloat(item.cost_price) || 0;
    const commercialGrade = parseInt(item.commercial_grade) || 3;
    const finalPrice = calculateShopsoiledPrice(costPrice, commercialGrade, physicalGrade, repairCost);

    const payload: any = {
      reservation_id: item.id,
      inventory_id: item.inventory_id,
      description: item.description,
      fault_type: faultType,
      rating: physicalGrade,
      repair_cost: repairCost,
      location: item.location || "Unknown",
      season: season,
    };

    let current = { ...payload };
    for (let i = 0; i < 10; i++) {
      const { error } = await supabase.from('repairs').insert([current]);
      if (!error) break;
      const m = error.message.match(/Could not find the '([^']+)' column/);
      if (m && m[1]) { delete current[m[1]]; continue; }
      alert("Error saving repair: " + error.message);
      break;
    }

    updateReservation(index, {
      physical_grade: physicalGrade,
      repair_cost: repairCost,
      final_shop_price: finalPrice,
      fault_type: faultType,
      season: season,
      status: 'assessed',
    });

    alert(`✅ Manual report saved.\n\nGrade: P${physicalGrade} — ${physicalGradeLabel(physicalGrade)}\nFinal Shopsoiled Price: KES ${finalPrice.toLocaleString()}`);
    fetchReports();
  };

  // ---------- BUSINESS CENTRAL BOOKING ----------
  const handleBookBC = async (index: number, item: any) => {
    if (!confirm(`Book this item on Business Central?\n\n${item.description}\nCustomer: ${item.customer || "—"}`)) return;

    try {
      const res = await fetch("/api/bc-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "BC booking failed");

      updateReservation(index, {
        bc_work_order_id: data.bc_work_order_id,
        bc_status: data.bc_status,
        bc_report_url: data.bc_report_url,
        bc_booked_at: new Date().toISOString(),
      });

      alert(`✅ Booked on Business Central.\n\nWork Order ID: ${data.bc_work_order_id}\nStatus: ${data.bc_status}`);
    } catch (err: any) {
      alert("BC booking error: " + err.message);
    }
  };

  // ---------- UI HELPERS ----------
  const getGradeBadge = (rating: number) => {
    if (rating === 5) return "bg-green-500 text-white";
    if (rating === 4) return "bg-blue-500 text-white";
    if (rating === 3) return "bg-yellow-500 text-white";
    if (rating === 2) return "bg-orange-500 text-white";
    return "bg-red-500 text-white";
  };

  return (
    <main className="w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Testing, Repair & Physical Grading</h2>
            <p className="text-xs text-blue-600 font-semibold mt-1">
              Logged in as: {role === "super_admin" ? "Super Admin" : "Workshop Technician"}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowReports(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg">
              📄 All Reports ({reports.length})
            </button>
            <button onClick={handleLogout} className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold py-2 px-4 rounded-lg">
              Logout
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === "manual" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-800"}`}
          >
            📝 Manual Report (On-Site Workshop)
          </button>
          <button
            onClick={() => setActiveTab("bc")}
            className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === "bc" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-800"}`}
          >
            🏢 Book on Business Central
          </button>
        </div>

        {repairItems.length === 0 ? (
          <p className="text-gray-500">No items currently in repair.</p>
        ) : activeTab === "manual" ? (
          /* ============ MANUAL TAB ============ */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {repairItems.map((repair: any, idx: number) => (
              <div key={idx} className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{repair.description}</h3>
                  {repair.physical_grade && (
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${getGradeBadge(repair.physical_grade)}`}>
                      P{repair.physical_grade}
                    </span>
                  )}
                </div>

                <div className="mb-4 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-xs text-blue-700 font-semibold">Commercial Grade</p>
                  <p className="text-lg font-bold text-blue-900">N{repair.commercial_grade || "?"} — {repair.commercial_label || "N/A"}</p>
                  <p className="text-xs text-blue-600 mt-1">Cost: KES {parseFloat(repair.cost_price || 0).toLocaleString()}</p>
                  {repair.customer && <p className="text-xs text-blue-600 font-semibold">Customer: {repair.customer}</p>}
                </div>

                {repair.physical_grade ? (
                  <div className="bg-green-50 p-4 rounded border border-green-200 text-sm">
                    <p className="text-green-700 font-bold mb-1">✅ Report Submitted</p>
                    <p className="text-gray-700"><strong>Grade:</strong> P{repair.physical_grade} — {physicalGradeLabel(repair.physical_grade)}</p>
                    <p className="text-gray-700"><strong>Fault:</strong> {repair.fault_type}</p>
                    <p className="text-gray-700"><strong>Repair Cost:</strong> KES {parseFloat(repair.repair_cost || 0).toLocaleString()}</p>
                    <p className="text-lg font-bold text-green-700 mt-2">Final Shopsoiled Price: KES {parseFloat(repair.final_shop_price || 0).toLocaleString()}</p>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleAssessment(idx, e, repair)} className="space-y-3 bg-gray-50 p-4 rounded border border-gray-200">
                    <h4 className="font-bold text-blue-600 text-sm">Workshop Report Form</h4>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fault Type</label>
                      <select name="faultType" required className="w-full bg-white border border-gray-300 rounded p-2 text-sm">
                        <option value="">Select Fault...</option>
                        <option value="Winding Burn">Winding Burn</option>
                        <option value="Seal Leak">Seal Leak</option>
                        <option value="Bearing Failure">Bearing Failure</option>
                        <option value="Impeller Damage">Impeller Damage</option>
                        <option value="Electrical Fault">Electrical Fault</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Physical Condition</label>
                      <select name="physicalGrade" required className="w-full bg-white border border-gray-300 rounded p-2 text-sm">
                        <option value="">Select Grade...</option>
                        <option value="5">P5 — Near New (100% value)</option>
                        <option value="4">P4 — Good (90% value)</option>
                        <option value="3">P3 — Fair (80% value)</option>
                        <option value="2">P2 — Poor (70% value)</option>
                        <option value="1">P1 — Scrap / Donate (50% value)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Repair Cost (KES)</label>
                      <input type="number" name="repairCost" required className="w-full bg-white border border-gray-300 rounded p-2 text-sm" placeholder="e.g. 5000" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-sm mt-2">Submit Report & Calculate Price</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* ============ BUSINESS CENTRAL TAB ============ */
          <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold text-blue-600 mb-3">Book Workshop Jobs on Business Central</h3>
            <p className="text-sm text-gray-600 mb-6">
              Send items in repair to Business Central. BC will generate a Work Order ID that this platform tracks automatically.
            </p>

            {repairItems.length === 0 ? (
              <p className="text-gray-500 text-sm">No items in repair queue.</p>
            ) : (
              <div className="space-y-3">
                {repairItems.map((repair: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{repair.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Customer: <strong>{repair.customer || "—"}</strong> | Cost: KES {parseFloat(repair.cost_price || 0).toLocaleString()} | Grade: N{repair.commercial_grade || "?"}
                        </p>

                        {repair.bc_work_order_id && (
                          <div className="mt-3 bg-orange-50 border border-orange-200 p-3 rounded">
                            <p className="text-xs"><strong>BC Work Order:</strong> {repair.bc_work_order_id}</p>
                            <p className="text-xs"><strong>Status:</strong> {repair.bc_status}</p>
                            <p className="text-xs"><strong>Booked:</strong> {repair.bc_booked_at ? new Date(repair.bc_booked_at).toLocaleString() : "—"}</p>
                            {repair.bc_report_url && (
                              <a href={repair.bc_report_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs font-semibold">
                                📄 View BC Report
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        {!repair.bc_work_order_id ? (
                          <button onClick={() => handleBookBC(idx, repair)} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded text-sm">
                            🏢 Book on BC
                          </button>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">Booked</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* REPORTS MODAL */}
      {showReports && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Workshop Reports ({reports.length})</h3>
              <button onClick={() => setShowReports(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-4 overflow-auto max-h-[60vh]">
              {reports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reports yet.</p>
              ) : (
                <div className="space-y-2">
                  {reports.map((r) => (
                    <div key={r.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="font-semibold text-gray-800">{r.description || "—"}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Fault: <strong>{r.fault_type}</strong> | Grade: <strong>P{r.rating} — {physicalGradeLabel(r.rating)}</strong> | Repair: <strong>KES {parseFloat(r.repair_cost || 0).toLocaleString()}</strong> | Season: <strong>{r.season}</strong>
                      </p>
                      {r.bc_work_order_id && <p className="text-xs text-orange-600 mt-1">BC Work Order: {r.bc_work_order_id}</p>}
                      <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}