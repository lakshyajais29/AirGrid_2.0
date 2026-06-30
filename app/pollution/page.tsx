"use client";

import React from "react";
import dynamic from "next/dynamic";

/* Leaflet must be loaded client-side only (no SSR) */
const PollutionMap = dynamic(
  () => import("@/components/modules/pollution/PollutionMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div
            className="inline-block w-8 h-8 border-3 rounded-full animate-spin mb-3"
            style={{
              borderColor: "var(--mid-blue)",
              borderTopColor: "transparent",
            }}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Loading map…
          </p>
        </div>
      </div>
    ),
  }
);

export default function PollutionPage() {
  return (
    <div className="min-h-screen bg-light-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-1 h-8 rounded-full"
              style={{ background: "var(--mid-blue)" }}
            />
            <h1
              className="text-2xl font-bold tracking-tight text-slate-900"
            >
              Pollution Grid — Delhi NCR
            </h1>
          </div>
          <p
            className="text-sm ml-4 pl-1"
            style={{ color: "var(--text-muted)" }}
          >
            Live air quality monitoring across 8 CPCB / DPCC stations · WAQI
            Network
          </p>
        </div>

        {/* Map Component */}
        <PollutionMap />
      </div>
    </div>
  );
}
