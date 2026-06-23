"use client";

import React, { useMemo } from "react";
import { AQIForecastChart } from "@/components/forecast/AQIForecastChart";
import { TomorrowRiskGrid } from "@/components/forecast/TomorrowRiskGrid";
import { ScheduledFlightLoad } from "@/components/forecast/ScheduledFlightLoad";
import { AlertTriangle } from "lucide-react";

export default function ForecastPage() {
  const forecastData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i <= 72; i += 3) {
      const d = new Date(now.getTime() + i * 60 * 60 * 1000);
      const timeStr = `${d.getDate()} ${d.toLocaleString('en-US', { hour: 'numeric', hour12: true })}`;
      
      // Simulate diurnal pattern + general rising trend
      const base = 150 + (i * 1.5) + Math.sin(i / 24 * Math.PI * 2) * 40;
      
      data.push({
        time: timeStr,
        predictedAQI: Math.round(base),
        // [min, max] for confidence band area chart
        confidence: [Math.round(base - 30 - i * 0.5), Math.round(base + 30 + i * 0.5)],
        flights: Math.round(20 + Math.sin(i / 24 * Math.PI * 2) * 15 + Math.random() * 5),
      });
    }
    return data;
  }, []);

  const willExceed200 = forecastData.some(d => d.predictedAQI > 200);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-[var(--navy)] tracking-tight">Predictive Forecasting</h1>
        <p className="text-slate-600 mt-2 text-sm max-w-3xl">
          72-hour predictive models integrating planned aviation loads, meteorology, and current AQI trends.
        </p>
      </div>

      {willExceed200 && (
        <div className="bg-red-50 border-l-4 border-[var(--critical-red)] p-4 flex items-center gap-3 rounded-r-sm shadow-sm">
          <AlertTriangle className="text-[var(--critical-red)] w-6 h-6 shrink-0" />
          <div>
            <h3 className="text-[var(--critical-red)] font-bold">Early Warning: High Pollution Expected</h3>
            <p className="text-sm text-red-900 mt-1">
              Forecast models indicate AQI will exceed the POOR threshold (200) within the next 72 hours. 
              Review GRAP Stage II readiness protocols.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        <AQIForecastChart data={forecastData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ScheduledFlightLoad data={forecastData} />
        <div className="lg:col-span-1">
          {/* We only have 12 zones, the risk grid takes care of layout internally */}
          <TomorrowRiskGrid />
        </div>
      </div>
    </div>
  );
}
