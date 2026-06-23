"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartExportActions } from "@/components/ui/chart-export-actions";

export function WardDoseTable({ 
  windDir, 
  emitRate 
}: { 
  windDir: number; 
  emitRate: number; 
}) {
  // Mock ward impact calculation based on wind direction
  // E.g., if wind is blowing east (270deg), eastern wards get higher dose
  
  const mockWards = [
    { name: "Palam (IGI)", bearing: 0, distance: 0 },
    { name: "Dwarka", bearing: 270, distance: 5 }, // West
    { name: "Vasant Kunj", bearing: 135, distance: 8 }, // SE
    { name: "RK Puram", bearing: 90, distance: 10 }, // East
    { name: "Delhi Cantt", bearing: 45, distance: 6 }, // NE
  ];

  const calculateDose = (ward: any) => {
    // Diff between wind direction and ward bearing
    // windDir is where wind is coming from. So if wind is 270 (West), it blows TO 90 (East).
    const blowTo = (windDir + 180) % 360;
    
    // Angular difference
    let diff = Math.abs(blowTo - ward.bearing);
    if (diff > 180) diff = 360 - diff;

    if (ward.distance === 0) return emitRate * 0.8; // Source location

    // If within 45 degrees of plume path, gets dose
    if (diff < 45) {
      return (emitRate / (ward.distance * 0.5)) * (1 - diff / 45);
    }
    return Math.random() * 2; // background noise
  };

  const data = mockWards.map(w => ({
    "Ward Name": w.name,
    "Bearing from IGI": `${w.bearing}°`,
    "Est. Ground Conc (µg/m³)": calculateDose(w).toFixed(2)
  })).sort((a, b) => Number(b["Est. Ground Conc (µg/m³)"]) - Number(a["Est. Ground Conc (µg/m³)"]));

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Modeled Ground-Level Concentration per Ward</CardTitle>
        <ChartExportActions chartId="ward-dose-table" data={data} filenamePrefix="ward_dose_model" />
      </CardHeader>
      <CardContent>
        <div id="ward-dose-table" className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="p-3 font-semibold text-slate-700">Ward Name</th>
                <th className="p-3 font-semibold text-slate-700">Bearing from Source</th>
                <th className="p-3 font-semibold text-slate-700">Est. Ground Conc. (µg/m³)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-medium">{row["Ward Name"]}</td>
                  <td className="p-3 font-mono text-slate-500">{row["Bearing from IGI"]}</td>
                  <td className="p-3 font-mono font-bold" style={{ color: Number(row["Est. Ground Conc (µg/m³)"]) > 100 ? 'var(--critical-red)' : 'var(--navy)' }}>
                    {row["Est. Ground Conc (µg/m³)"]}
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
