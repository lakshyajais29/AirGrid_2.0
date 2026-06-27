import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LoadingScreen from "@/components/layout/LoadingScreen";
import { DemoModeBanner } from "@/components/layout/DemoModeBanner";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIRGRID OS | Environmental Intelligence & Enforcement",
  description: "Government-grade environmental intelligence and enforcement operating system for NCT Delhi.",
};

export const viewport: Viewport = {
  themeColor: "#0D1B2A",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      style={{ height: "100%" }}
    >
      <body style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        margin: 0,
        padding: 0,
      }}>
        <Suspense fallback={null}>
          <DemoModeBanner />
        </Suspense>
        <LoadingScreen />
        <Header />

        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
          {/* 64px sidebar spacer — nav is position:fixed, this reserves the space */}
          <div style={{ width: "64px", flexShrink: 0 }} />
          <Sidebar />

          <main style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            minWidth: 0,
          }}>
            {children}
          </main>
        </div>

        <Footer />
      </body>
    </html>
  );
}
