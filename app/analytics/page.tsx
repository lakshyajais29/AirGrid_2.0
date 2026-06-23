"use client";

import React from "react";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { MultiPollutantTimeSeries } from "@/components/analytics/MultiPollutantTimeSeries";
import { YearOnYearComparison } from "@/components/analytics/YearOnYearComparison";
import { HourlyHeatmap } from "@/components/analytics/HourlyHeatmap";
import { WeekdayVsWeekendChart } from "@/components/analytics/WeekdayVsWeekendChart";

export default function AnalyticsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--navy)] tracking-tight">Advanced Analytics</h1>
          <p className="text-slate-600 mt-2 text-sm max-w-3xl">
            Deep dive into historical air quality trends, temporal patterns, and festival impacts.
            Use the date picker to filter the multi-pollutant views.
          </p>
        </div>
        <div>
          <DateRangePicker />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <MultiPollutantTimeSeries />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <YearOnYearComparison />
        <WeekdayVsWeekendChart />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <HourlyHeatmap />
      </div>

      {/* Print utility */}
      <div className="flex justify-end no-print pt-4 border-t mt-8">
        <button 
          onClick={() => window.print()} 
          className="px-4 py-2 bg-[var(--navy)] text-white rounded-sm text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Print Analytics Report
        </button>
      </div>
    </div>
  );
}
