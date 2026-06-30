"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartExportActions } from "@/components/ui/chart-export-actions";

export function HourlyHeatmap() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Generate heatmap data
  const data = useMemo(() => {
    return days.map(day => {
      const isWeekend = day === "Sat" || day === "Sun";
      return {
        day,
        hours: hours.map(hour => {
          // Rush hours (8-10, 18-20) have higher pollution on weekdays
          const isRushHour = (hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20);
          let aqi = 100 + Math.random() * 50;
          if (!isWeekend && isRushHour) aqi += 100 + Math.random() * 50;
          if (isWeekend) aqi -= 30; // Generally lower on weekends
          return aqi;
        })
      };
    });
  }, [hours]);

  // Flatten for export
  const exportData = data.flatMap(d => d.hours.map((aqi, h) => ({ Day: d.day, Hour: h, AQI: Math.round(aqi) })));

  const getColor = (aqi: number) => {
    if (aqi > 200) return "var(--critical-red)";
    if (aqi > 150) return "var(--gov-gold)";
    if (aqi > 100) return "var(--accent-teal)";
    return "var(--safe-green)";
  };

  const getOpacity = (aqi: number) => {
    // Normalize roughly between 0.3 and 1.0 for visual variance within a color band
    return Math.min(1, Math.max(0.3, aqi / 300));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Hourly Air Quality Heatmap</CardTitle>
        <ChartExportActions chartId="hourly-heatmap" data={exportData} filenamePrefix="hourly_heatmap" />
      </CardHeader>
      <CardContent>
        <div id="hourly-heatmap" className="w-full overflow-x-auto bg-white p-4">
          <div className="min-w-[600px]">
            <div className="flex ml-12 mb-2">
              {hours.map(h => (
                <div key={h} className="flex-1 text-center text-xs font-mono text-slate-500">
                  {h}
                </div>
              ))}
            </div>
            
            {data.map((row) => (
              <div key={row.day} className="flex items-center mb-1">
                <div className="w-12 text-sm font-semibold text-slate-700">
                  {row.day}
                </div>
                <div className="flex flex-1 gap-1">
                  {row.hours.map((aqi, idx) => (
                    <div 
                      key={idx}
                      className="flex-1 h-8 rounded-sm relative group"
                      style={{ 
                        backgroundColor: getColor(aqi),
                        opacity: getOpacity(aqi)
                      }}
                    >
                      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-faint)] text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {row.day} {idx}:00 - AQI {Math.round(aqi)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-end mt-4 gap-4 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[var(--safe-green)] rounded-sm"></div> Safe</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[var(--accent-teal)] rounded-sm"></div> Moderate</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[var(--gov-gold)] rounded-sm"></div> Poor</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[var(--critical-red)] rounded-sm"></div> Hazardous</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
