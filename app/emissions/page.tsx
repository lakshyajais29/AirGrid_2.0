import React from "react";
import { AircraftEmissionCards } from "@/components/emissions/AircraftEmissionCards";
import { FleetCompositionPie } from "@/components/emissions/FleetCompositionPie";
import { DailyTotalsBarChart } from "@/components/emissions/DailyTotalsBarChart";
import { AircraftTypeComparison } from "@/components/emissions/AircraftTypeComparison";
import { LTOPhaseBreakdown } from "@/components/emissions/LTOPhaseBreakdown";
import { AnnualProjectionCard } from "@/components/emissions/AnnualProjectionCard";

export default function EmissionsPage() {
  return (
    <div className="min-h-screen bg-light-bg p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-1 h-8 rounded-full"
              style={{ background: "var(--critical-red)" }}
            />
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--navy)" }}
            >
              Emission Estimator
            </h1>
          </div>
          <p
            className="text-sm ml-4 pl-1"
            style={{ color: "var(--text-muted)" }}
          >
            Aviation emissions based on ICAO Landing and Take-Off (LTO) cycle methodology
          </p>
        </div>

        {/* Top Section: Overview Cards */}
        <section>
          <h2 className="text-lg font-semibold text-navy mb-3">LTO Cycle Benchmarks</h2>
          <AircraftEmissionCards />
        </section>

        {/* Main Grid: Charts & Projections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <DailyTotalsBarChart />
            <LTOPhaseBreakdown />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <FleetCompositionPie />
            <AnnualProjectionCard />
          </div>
        </div>

        {/* Bottom Section: Type Comparison */}
        <section>
          <AircraftTypeComparison />
        </section>

      </div>
    </div>
  );
}
