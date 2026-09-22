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
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">ReNew <span className="text-gray-400 text-sm">D&S</span></h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-bold">N</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Bonventure Gor</p>
            <p className="text-xs text-gray-500">CSR Coordinator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}