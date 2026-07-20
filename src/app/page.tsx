"use client";
import React from 'react';
import { Layers, TrendingUp, CheckCircle, AlertCircle, UploadCloud, FileSearch, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const stats = [
    { title: 'Live Inventory Snapshot', value: '1,248 Items', subtext: 'Updated from Netstock', icon: <Layers className="text-teal-400" size={24} /> },
    { title: 'Active CSR Pipeline', value: '14 Projects', subtext: '4 in screening phase', icon: <TrendingUp className="text-blue-400" size={24} /> },
    { title: 'Reservation Queue', value: '38 Reserved', subtext: 'Pending technical approval', icon: <CheckCircle className="text-amber-400" size={24} /> },
    { title: 'Workshop Repairs', value: '12 Active', subtext: 'Undergoing band assessment', icon: <AlertCircle className="text-rose-400" size={24} /> },
  ];

  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-950">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/20 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-lg font-bold text-slate-100">Welcome back, Bonventure</h1>
        <div className="text-xs text-slate-400 font-medium bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
          Environment Status: <span className="text-emerald-400 font-semibold">Development Live</span>
        </div>
      </header>

      <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">System Overview Dashboard</h2>
          <p className="text-sm text-slate-400 mt-1">Circular Asset Recovery &amp; CSR Optimization Overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800/80 rounded-xl p-6 shadow-xl hover:border-slate-700/50 transition-all flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{stat.title}</p>
                <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
                <p className="text-xs text-slate-500 font-medium">{stat.subtext}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/50 shadow-inner">
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/inventory-upload" className="group bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-teal-500/50 transition-all space-y-3">
            <div className="h-10 w-10 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg flex items-center justify-center">
              <UploadCloud size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">Launch Portal 1: Inventory Upload</h4>
              <p className="text-xs text-slate-400 mt-1">Flush and sync weekly raw Netstock asset sheets into Supabase tables.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 pt-2 opacity-60 group-hover:opacity-100 transition-opacity">
              Open Portal <ArrowRight size={14} />
            </div>
          </Link>

          <Link href="/quote-screening" className="group bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-teal-500/50 transition-all space-y-3">
            <div className="h-10 w-10 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg flex items-center justify-center">
              <FileSearch size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">Launch Portal 2: Quote Screening</h4>
              <p className="text-xs text-slate-400 mt-1">Parse engineering quotations line-by-line using rule-based algorithms.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 pt-2 opacity-60 group-hover:opacity-100 transition-opacity">
              Open Portal <ArrowRight size={14} />
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
