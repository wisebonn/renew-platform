"use client";
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function InventoryUploadPortal() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<string>('');
  const [fileObject, setFileObject] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFileName(e.target.files[0].name);
      setFileObject(e.target.files[0]);
      setUploadStatus('idle');
    }
  };

  const executeDatabaseSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileObject) return;

    setUploadStatus('parsing');
    setLogs('Reading uploaded spreadsheet matrix mapping columns...\n');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const records = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        setLogs((prev) => prev + `Found ${records.length} total rows inside document. Filtering headings...\n`);

        const inventoryToInsert: any[] = [];

        records.forEach((row: any[], idx: number) => {
          if (idx === 0 || !row || row.length < 2) return; 

          const itemCode = row[0] ? String(row[0]).trim() : '';
          const description = row[1] ? String(row[1]).trim() : '';
          const quantity = parseInt(row[2]) || 0;
          const branch = row[3] ? String(row[3]).trim() : 'Nairobi';

          if (!itemCode || !description || itemCode.toUpperCase() === 'CUSTOMER' || itemCode.toUpperCase() === 'ITEMS') return;

          let segment = 'Accessories';
          const descUpper = description.toUpperCase();

          if (descUpper.includes('MODULE') || descUpper.includes('SOLAR PANEL') || descUpper.includes('CRYSTALLINE')) segment = 'Solar Modules';
          else if (descUpper.includes('SUNVERTER') || descUpper.includes('INVERTER') || descUpper.includes('CONTROLLER')) segment = 'Solar Inverters';
          else if (descUpper.includes('PUMP') || descUpper.includes('SUNFLEX') || descUpper.includes('SUBMERSIBLE')) segment = 'Pumps';
          else if (descUpper.includes('MOTOR')) segment = 'Motors';
          else if (descUpper.includes('TANK')) segment = 'Tanks';
          else if (descUpper.includes('PIPE') || descUpper.includes('HDPE') || descUpper.includes('PVC')) segment = 'Pipes & Fittings';

          inventoryToInsert.push({
            netstock_code: itemCode,
            description: description,
            quantity_available: quantity,
            branch_location: branch,
            product_segment: segment,
            condition_status: 'Available'
          });
        });

        setLogs((prev) => prev + `Product Intelligence engine completed. Handing over ${inventoryToInsert.length} components to secure backend server pipeline...\n`);

        // 🚀 SECURE REDIRECTION FETCH CALL:
        // Hit our local server API endpoint instead of the direct cloud address
        const response = await fetch('/api/upload-inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inventoryData: inventoryToInsert }),
        });

        const outcome = await response.json();

        if (!response.ok) {
          throw new Error(outcome.error || 'Server pipeline processing failure');
        }

        setUploadStatus('success');
        setLogs((prev) => prev + `✅ Database Synchronization Complete. Stock Holding Active.`);
      } catch (err: any) {
        console.error(err);
        setUploadStatus('error');
        setLogs((prev) => prev + `❌ Sync Intercepted: ${err.message || err}`);
      }
    };
    reader.readAsBinaryString(fileObject);
  };

  return (
    <main className="flex-1 p-8 w-full h-full overflow-y-auto bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Portal 1: Inventory Refresh Portal</h2>
          <p className="text-sm text-slate-400 mt-1">Upload your master weekly Netstock export to parse engineering segments and sync live warehouse quantities.</p>
        </div>

        <form onSubmit={executeDatabaseSync} className="space-y-6">
          <div className="border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all bg-slate-900/40 border-slate-800 hover:border-slate-700">
            <div className="p-4 bg-slate-950 rounded-full border border-slate-800 text-teal-400 mb-4 shadow-xl">
              <UploadCloud size={32} />
            </div>
            {fileName ? (
              <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20">
                <FileSpreadsheet size={18} />
                <span className="text-sm font-semibold">{fileName}</span>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Drag or select your weekly Netstock export spreadsheet here</p>
                <p className="text-xs text-slate-500">Supports raw standard formatting sheets containing code, text rows, and quantity values.</p>
              </div>
            )}
            <input type="file" accept=".csv,.xlsx" className="hidden" id="fileRoot" onChange={handleFileChange} />
            {!fileName && (
              <label htmlFor="fileRoot" className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer transition-all">
                Browse Files
              </label>
            )}
          </div>

          {uploadStatus === 'parsing' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start space-x-4">
              <RefreshCw className="text-teal-400 animate-spin mt-1 shrink-0" size={20} />
              <div className="w-full">
                <p className="text-sm font-bold text-white">Product Intelligence Pipeline Running...</p>
                <pre className="text-[11px] font-mono text-slate-400 mt-2 bg-slate-950 p-3 rounded-lg max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">{logs}</pre>
              </div>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center space-x-4">
              <CheckCircle className="text-emerald-400" size={20} />
              <div>
                <p className="text-sm font-bold text-emerald-400">Cloud Storage Sync Complete!</p>
                <p className="text-xs text-slate-400">Netstock inventory rows are completely parsed and saved in your live Supabase cloud database.</p>
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start space-x-4">
              <AlertCircle className="text-rose-400 mt-0.5 shrink-0" size={20} />
              <div>
                <p className="text-sm font-bold text-rose-400">Database Connection Intercepted</p>
                <pre className="text-[11px] font-mono text-rose-300 mt-1 bg-slate-950 p-2 rounded-lg">{logs}</pre>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!fileName || uploadStatus === 'parsing'}
            className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg disabled:cursor-not-allowed shadow-teal-600/10"
          >
            Execute Inventory Overwrite &amp; Cloud Parse
          </button>
        </form>
      </div>
    </main>
  );
}
