import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "MOIL Limited | Predictive Intelligence & Operations Center",
  description:
    "AI-powered predictive intelligence platform for MOIL Limited fusing satellite telemetry and heavy equipment data to predict manganese reserve shortfalls.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0F1D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#070B14] text-slate-100`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
