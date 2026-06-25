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
  title: "AIRGRID OS | Delhi Air Quality Command Centre",
  description: "Ward-level air quality monitoring for Delhi — live data across 272 wards, 46 CPCB stations.",
};

export const viewport: Viewport = {
  themeColor: "#0D1B2A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full min-h-full flex flex-col antialiased">
        <Suspense fallback={null}>
          <DemoModeBanner />
        </Suspense>
        <LoadingScreen />
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto p-4 ml-2">{children}</main>
        </div>
        <Footer />
      </body>
    </html>
  );
}
