"use client";
import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function InventoryUploadPortal() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string | null>(null);

  const handleSimulatedUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) return;
    setUploadStatus('parsing');
    
    // Simulating ReNew's Product Intelligence & Parsing Engine matching rows
    setTimeout(() => {
      setUploadStatus('success');
    }, 2500);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* (Your layout automatically embeds into your structural system shell) */}
      <div className="flex-1 p-8 max-w-4xl mx-auto space-y-8 overflow-y-auto">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Portal 1: Inventory Refresh Portal</h2>
          <p className="text-sm text-slate-400 mt-1">Upload the weekly Netstock spreadsheet snapshot to flush and sync current stock records.</p>
        </div>

        <form onSubmit={handleSimulatedUpload} className="space-y-6">
          {/* INTERACTIVE DRAG & DROP AREA */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files.length) {
                setFileName(e.dataTransfer.files[0].name);
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              isDragging ? 'border-teal-500 bg-teal-500/5' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
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
                <p className="text-sm font-bold text-white">Drag and drop your weekly Netstock export here</p>
                <p className="text-xs text-slate-500">Supports standard standard engineering format .xlsx or .csv layouts</p>
              </div>
            )}
            <input 
              type="file" 
              accept=".csv,.xlsx" 
              className="hidden" 
              id="fileRoot"
              onChange={(e) => {
                if (e.target.files?.length) setFileName(e.target.files[0].name);
              }}
            />
            {!fileName && (
              <label htmlFor="fileRoot" className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 transition-all">
                Browse Files
              </label>
            )}
          </div>

          {/* ENGINE STATUS PROCESSING PANEL */}
          {uploadStatus === 'parsing' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-4 animate-pulse">
              <RefreshCw className="text-teal-400 animate-spin" size={20} />
              <div>
                <p className="text-sm font-bold text-white">Product Intelligence Engine Active...</p>
                <p className="text-xs text-slate-400">Tokenizing text lines, isolating electrical phases, and matching categories.</p>
              </div>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center space-x-4">
              <CheckCircle className="text-emerald-400" size={20} />
              <div>
                <p className="text-sm font-bold text-emerald-400">Inventory Synced Successfully!</p>
                <p className="text-xs text-slate-400">Netstock records parsed into discrete fields inside your Supabase cluster.</p>
              </div>
            </div>
          )}

          {/* SUBMIT REFRESH BUTTON */}
          <button
            type="submit"
            disabled={!fileName || uploadStatus === 'parsing'}
            className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg disabled:cursor-not-allowed shadow-teal-600/10"
          >
            Execute Inventory Overwrite &amp; Parse
          </button>
        </form>
      </div>
    </div>
  );
}
