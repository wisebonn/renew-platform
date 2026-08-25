import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { InventoryProvider } from "./Providers";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReNew Platform",
  description: "Inventory and Quote Screening",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <InventoryProvider>
          <div className="flex min-h-screen bg-slate-950">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </InventoryProvider>
      </body>
    </html>
  );
}