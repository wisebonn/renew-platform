"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UploadCloud, FileSearch, CalendarClock, Wrench, Users, BarChart3, Activity } from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Inventory Upload", href: "/inventory-upload", icon: UploadCloud },
  { name: "Quote Screening", href: "/quote-screening", icon: FileSearch },
  { name: "Reservation Engine", href: "/reservations", icon: CalendarClock },
  { name: "Testing & Repair", href: "/test-and-repair", icon: Wrench },
  { name: "CSR Workflow", href: "/csr-workflow", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Activity Log", href: "/activity-log", icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-blue-900 border-r border-blue-800 h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-blue-800">
        <h1 className="text-2xl font-bold text-cyan-400">ReNew <span className="text-blue-200 text-sm">D&S</span></h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-700 text-white"
                  : "text-blue-200 hover:bg-blue-800/50 hover:text-white"
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center">
            <span className="text-cyan-400 font-bold">N</span>
          </div>
          <div>
            <p className="text-sm text-white">Bonventure Gor</p>
            <p className="text-xs text-blue-300">CSR Coordinator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}