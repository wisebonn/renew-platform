import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileSearch, 
  BookmarkCheck, 
  Wrench, 
  Award, 
  BarChart3, 
  History 
} from 'lucide-react';
import Link from 'next/link';

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "ReNew – Circular Economy Platform",
  description: "Circular Asset Recovery & CSR Optimization Platform for Davis & Shirtliff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Global sidebar links configuration mapping to routes
  const navigationLinks = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'Inventory Upload', icon: <UploadCloud size={20} />, path: '/inventory-upload' },
    { name: 'Quote Screening', icon: <FileSearch size={20} />, path: '/quote-screening' },
    { name: 'Reservation Engine', icon: <BookmarkCheck size={20} />, path: '#' },
    { name: 'Testing & Repair', icon: <Wrench size={20} />, path: '#' },
    { name: 'CSR Workflow', icon: <Award size={20} />, path: '#' },
    { name: 'Analytics', icon: <BarChart3 size={20} />, path: '#' },
    { name: 'Activity Log', icon: <History size={20} />, path: '#' },
  ];

  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-100">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full flex font-sans overflow-hidden`}>
        
        {/* GLOBAL PERSISTENT SIDEBAR NAVIGATION PANEL */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-full">
          <div>
            {/* Branding Header */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800">
              <span className="text-2xl font-black tracking-wider text-teal-400">Re<span className="text-white">New</span></span>
              <span className="ml-2 text-[10px] font-semibold uppercase bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded border border-teal-500/20">D&S</span>
            </div>
            
            {/* Clickable Sidebar Routes */}
            <nav className="mt-6 px-4 space-y-1">
              {navigationLinks.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.path}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* User Profile Footer */}
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

        {/* ACTIVE CANVAS DISPLAY PANEL (Where our sub-pages render) */}
        <div className="flex-1 h-full overflow-hidden">
          {children}
        </div>

      </body>
    </html>
  );
}
