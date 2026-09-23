import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { InventoryProvider } from "./Providers";
import Sidebar from "@/components/Sidebar";
import AIAssistant from "@/components/AIAssistant";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReNew Platform",
  description: "Shop Soiled Inventory Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <InventoryProvider>
          <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
              {children}
            </main>
          </div>
          <AIAssistant />
        </InventoryProvider>
      </body>
    </html>
  );
}