"react";
import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileSearch, 
  BookmarkCheck, 
  Wrench, 
  Award, 
  BarChart3, 
  History, 
  Layers, 
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

export default function DashboardPage() {
  // Navigation Sidebar Links Configured to your exact Module Roadmaps
  const navigationLinks = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, active: true },
    { name: 'Inventory Upload', icon: <UploadCloud size={20} />, active: false },
    { name: 'Quote Screening', icon: <FileSearch size={20} />, active: false },
    { name: 'Reservation Engine', icon: <BookmarkCheck size={20} />, active: false },
    { name: 'Testing & Repair', icon: <Wrench size={20} />, active: false },
    { name: 'CSR Workflow', icon: <Award size={20} />, active: false },
    { name: 'Analytics', icon: <BarChart3 size={20} />, active: false },
    { name: 'Activity Log', icon: <History size={20} />, active: false },
  ];

  // Quick Snapshot Statistics Mock Data for Visual Layout Drafting
  const stats = [
    { title: 'Live Inventory Snapshot', value: '1,248 Items', subtext: 'Updated from Netstock', icon: <Layers className="text-teal-400" size={24} /> },
    { title: 'Active CSR Pipeline', value: '14 Projects', subtext: '4 in screening phase', icon: <TrendingUp className="text-blue-400" size={24} /> },
    { title: 'Reservation Queue', value: '38 Reserved', subtext: 'Pending technical approval', icon: <CheckCircle className="text-amber-400" size={24} /> },
    { title: 'Workshop Repairs', value: '12 Active', subtext: 'Undergoing band assessment', icon: <AlertCircle className="text-rose-400" size={24} /> },
  ];

  return (
    <div className="flex h-screen w-screen bg-slate-950 font-sans text-slate-100 overflow-hidden">
      
      {/* PERSISTENT SIDEBAR NAVIGATION PANEL */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Main D&S Branding Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <span className="text-2xl font-black tracking-wider text-teal-400">Re<span className="text-white">New</span></span>
            <span className="ml-2 text-xs font-semibold uppercase bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded border border-teal-500/20">D&S</span>
          </div>
          
          {/* Interactive Route Navigation Links */}
          <nav className="mt-6 px-4 space-y-1">
            {navigationLinks.map((item, idx) => (
              <button
                key={idx}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  item.active 
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* User Identity Footer Status */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center font-bold text-white shadow-md">
              BG
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Bonventure Gor</p>
              <p className="text-[10px] text-teal-400 font-medium">CSR Coordinator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ACTIVE DISPLAY CONTENT CANVAS VIEW */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-950">
        {/* Top Navbar Context Strip */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/20 backdrop-blur-sm sticky top-0 z-10">
          <h1 className="text-lg font-bold text-slate-100">Welcome back, Bonventure</h1>
          <div className="text-xs text-slate-400 font-medium bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
            Environment Status: <span className="text-emerald-400 font-semibold">Development Live</span>
          </div>
        </header>

        {/* Core View Content Grid */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">System Overview Dashboard</h2>
            <p className="text-sm text-slate-400 mt-1">Circular Asset Recovery &amp; CSR Optimization Overview</p>
          </div>

          {/* Quick Metrics Statistics Cards Grid Layout */}
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

          {/* Workspace Placeholder Announcement Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800 rounded-xl p-8 shadow-2xl flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
            <div className="h-12 w-12 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 shadow-xl">
              <LayoutDashboard size={24} />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-base font-bold text-white">Dashboard Canvas Frame Initialized</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The visual Shell layout is successfully mounted. Next, we will connect your live database tables from Supabase to feed real data rows into this control dashboard panel.
              </p>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
