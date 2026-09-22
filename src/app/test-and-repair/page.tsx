"use client";
import { useState } from "react";
import { useInventory } from "../Providers";

export default function TestAndRepair() {
  const { reservations, updateReservation } = useInventory();
  const repairItems = reservations.filter((res: any) => res.status === "in_repair");

  const handleAssessment = (index: number, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rating = formData.get("rating");
    const faultType = formData.get("faultType");
    const repairCost = formData.get("repairCost");

    // Auto-calculate Season
    const month = new Date().getMonth();
    let season = "Dry";
    if (month >= 2 && month <= 4) season = "Long Rains";
    if (month >= 9 && month <= 11) season = "Short Rains";

    updateReservation(index, { 
      rating: Number(rating), 
      fault_type: faultType, 
      repair_cost: Number(repairCost),
      season: season,
      status: 'assessed'
    });
    alert("Assessment saved! Item graded successfully.");
  };

  return (
    <main className="w-full text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-white">Testing, Repair & Grading</h2>
        
        {repairItems.length === 0 ? (
          <p className="text-blue-300">No items currently in repair.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {repairItems.map((repair: any, idx: number) => (
              <div key={idx} className="bg-blue-900 border border-blue-800 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-blue-100 mb-2">{repair.description}</h3>
                <p className="text-sm text-blue-300 mb-4">Current Status: {repair.status}</p>
                
                {repair.rating ? (
                  <div className="bg-blue-800 p-4 rounded border border-blue-700">
                    <p className="text-green-400 font-bold">✅ Assessed: Grade {repair.rating}/5</p>
                    <p className="text-sm text-blue-300">Fault: {repair.fault_type} | Repair Cost: ${repair.repair_cost}</p>
                    <p className="text-sm text-blue-300">Season: {repair.season}</p>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleAssessment(idx, e)} className="space-y-3 bg-blue-800 p-4 rounded border border-blue-700">
                    <h4 className="font-bold text-cyan-400 text-sm mb-2">Workshop Assessment Form</h4>
                    
                    <div>
                      <label className="block text-xs text-blue-200 mb-1">Fault Type</label>
                      <select name="faultType" required className="w-full bg-blue-900 border border-blue-600 rounded p-2 text-white text-sm">
                        <option value="">Select Fault...</option>
                        <option value="Winding Burn">Winding Burn</option>
                        <option value="Seal Leak">Seal Leak</option>
                        <option value="Bearing Failure">Bearing Failure</option>
                        <option value="Impeller Damage">Impeller Damage</option>
                        <option value="Electrical Fault">Electrical Fault</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-blue-200 mb-1">Condition Rating (1-5)</label>
                      <select name="rating" required className="w-full bg-blue-900 border border-blue-600 rounded p-2 text-white text-sm">
                        <option value="">Select Grade...</option>
                        <option value="5">5 - Near New (80% value)</option>
                        <option value="4">4 - Good (70% value)</option>
                        <option value="3">3 - Fair (60% value)</option>
                        <option value="2">2 - Poor (50% value)</option>
                        <option value="1">1 - Scrap/Donate (40% value)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-blue-200 mb-1">Estimated Repair Cost ($)</label>
                      <input type="number" name="repairCost" required className="w-full bg-blue-900 border border-blue-600 rounded p-2 text-white text-sm" placeholder="e.g. 150" />
                    </div>

                    <button type="submit" className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2 rounded text-sm mt-2">
                      Save Assessment & Grade
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}