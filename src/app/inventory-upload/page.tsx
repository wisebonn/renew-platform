"use client";
import { useState } from "react";
import * as XLSX from "xlsx";
import { classifyAndExtractSpecs } from "@/lib/matcher-utils";
import { useInventory } from "../Providers";

export default function InventoryUpload() {
  const { replaceInventory } = useInventory(); // Changed to cloud upload
  const [categoryCounts, setCategoryCounts] = useState({
    PUMP_END: 0, MOTOR: 0, PUMP_CW_MOTO: 0, INVERTER: 0, SOLAR_MODULE: 0, PIPE: 0, CABLE: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const proceed = confirm("Uploading a new file will DELETE the current cloud inventory and REPLACE it with this one. Continue?");
      if (!proceed) return;

      setIsLoading(true);
      const file = e.target.files[0];
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const counts = { PUMP_END: 0, MOTOR: 0, PUMP_CW_MOTO: 0, INVERTER: 0, SOLAR_MODULE: 0, PIPE: 0, CABLE: 0 };

      rows.forEach((r: any) => {
        const description = r["Description"] || ""; 
        const specs = classifyAndExtractSpecs(description);
        if (counts[specs.category as keyof typeof counts] !== undefined) {
          counts[specs.category as keyof typeof counts]++;
        }
      });

      setCategoryCounts(counts);
      await replaceInventory(rows); // Sends the full Excel list to the cloud!

      setIsLoading(false);
      alert(`Successfully uploaded ${rows.length} items to the cloud!`);
    }
  };

  return (
    <main className="w-full text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-blue-800 pb-4">
          <h2 className="text-xl font-bold text-white">Inventory Upload Portal</h2>
        </div>
        
        <div className="bg-blue-900 border border-blue-800 p-6 rounded-lg shadow-xl">
          <h3 className="text-lg font-bold text-cyan-400 uppercase tracking-wider mb-4">Upload Master Netstock Spreadsheet</h3>
          <input 
            type="file" 
            accept=".xlsx,.xls" 
            onChange={handleFileUpload}
            className="block w-full text-xs text-blue-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-700 file:text-white hover:file:bg-blue-600 cursor-pointer"
          />
          {isLoading && <p className="mt-4 text-blue-300">Uploading to cloud...</p>}
          <p className="mt-4 text-xs text-blue-300">*Uploading a new file replaces the old cloud inventory.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-900 border border-blue-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold text-cyan-400">Pump Ends</h3>
            <p className="text-4xl font-bold">{categoryCounts.PUMP_END} Models</p>
          </div>
          <div className="bg-blue-900 border border-blue-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold text-cyan-400">Motors</h3>
            <p className="text-4xl font-bold">{categoryCounts.MOTOR} Models</p>
          </div>
          <div className="bg-blue-900 border border-blue-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold text-cyan-400">Pump C/W Motor</h3>
            <p className="text-4xl font-bold">{categoryCounts.PUMP_CW_MOTO} Models</p>
          </div>
          <div className="bg-blue-900 border border-blue-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold text-cyan-400">Inverters/Sunverters</h3>
            <p className="text-4xl font-bold">{categoryCounts.INVERTER} Models</p>
          </div>
          <div className="bg-blue-900 border border-blue-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold text-cyan-400">Solar Panels</h3>
            <p className="text-4xl font-bold">{categoryCounts.SOLAR_MODULE} Models</p>
          </div>
          <div className="bg-blue-900 border border-blue-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold text-cyan-400">Piping Arrays</h3>
            <p className="text-4xl font-bold">{categoryCounts.PIPE} Models</p>
          </div>
          <div className="bg-blue-900 border border-blue-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold text-cyan-400">Cables</h3>
            <p className="text-4xl font-bold">{categoryCounts.CABLE} Models</p>
          </div>
        </div>
      </div>
    </main>
  );
}