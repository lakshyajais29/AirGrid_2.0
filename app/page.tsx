import React from "react";
import { AQIGauge } from "@/components/shared/AQIGauge";
import { AQIBadge } from "@/components/shared/AQIBadge";
import { GRAPBanner } from "@/components/shared/GRAPBanner";
import { LiveFlightCounter } from "@/components/dashboard/LiveFlightCounter";
import { AlertCommandStrip } from "@/components/dashboard/AlertCommandStrip";
import { EmissionTodayCard } from "@/components/dashboard/EmissionTodayCard";
import { WorstWardsTable } from "@/components/dashboard/WorstWardsTable";
import { DataFreshness } from "@/components/dashboard/DataFreshness";
import { AQITrendSparkline } from "@/components/dashboard/AQITrendSparkline";

export default function CommandCentre() {
  // mock data for sparkline – could be fetched later
  const sparklineData = [172, 178, 182, 185, 187, 189, 187];

  return (
    <div className="min-h-screen bg-light-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-navy mb-4">
          SKYVIGIL Command Centre
        </h1>
        <p className="text-lg text-muted mb-8">
          Real‑time environmental situation report – {new Date().toLocaleDateString()}
        </p>
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 – Gauges & Counters */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6 h-[340px] flex flex-col items-center">
              <h2 className="text-xl font-semibold mb-4 text-navy">Current AQI Situation</h2>
              <AQIGauge value={187} size={200} />
            </div>
            <LiveFlightCounter />
            <EmissionTodayCard />
          </div>
          {/* Column 2 – Alerts & Analytics */}
          <div className="space-y-6 lg:col-span-2">
            <AlertCommandStrip />
            <GRAPBanner level={3} />
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-navy">AQI Trend (24 h)</h2>
              <AQITrendSparkline data={sparklineData} />
            </div>
            <WorstWardsTable />
            <DataFreshness />
          </div>
        </div>
      </div>
    </div>
  );
}
