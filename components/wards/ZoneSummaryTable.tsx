"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ZoneSummaryTableProps {
  geoJsonData: any;
}

export function ZoneSummaryTable({ geoJsonData }: ZoneSummaryTableProps) {
  if (!geoJsonData || !geoJsonData.features) return null;

  // Rank zones by aviation contribution (aviation_exposure score)
  const sortedZones = [...geoJsonData.features]
    .map(f => f.properties)
    .sort((a, b) => b.aviation_exposure - a.aviation_exposure);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Zone Aviation Impact Rankings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="p-3 font-semibold text-slate-700">Rank</th>
                <th className="p-3 font-semibold text-slate-700">Zone Name</th>
                <th className="p-3 font-semibold text-slate-700">Aviation Exposure (1-10)</th>
                <th className="p-3 font-semibold text-slate-700">AQI</th>
                <th className="p-3 font-semibold text-slate-700">Dominant Pollutant</th>
              </tr>
            </thead>
            <tbody>
              {sortedZones.map((zone, index) => (
                <tr key={zone.id} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-semibold text-[var(--navy)]">#{index + 1}</td>
                  <td className="p-3 font-medium">{zone.name}</td>
                  <td className="p-3">
                    <div className="flex items-center">
                      <span className="font-mono w-6 text-right mr-2">{zone.aviation_exposure}</span>
                      <div className="h-2 flex-1 bg-slate-200 rounded-sm overflow-hidden">
                        <div 
                          className="h-full bg-[var(--gov-gold)]" 
                          style={{ width: `${(zone.aviation_exposure / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono">{zone.aqi}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-slate-100 text-xs rounded-sm text-slate-600 font-semibold tracking-wide">
                      {zone.dominant_pollutant}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
