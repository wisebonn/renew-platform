import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
  return (
    <html lang="en" className="h-full bg-slate-900 text-slate-100">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full flex font-sans`}>
        {/* Main Application Container */}
        <div className="flex h-full w-full overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
