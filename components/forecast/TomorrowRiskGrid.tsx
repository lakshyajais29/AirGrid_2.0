"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TomorrowRiskGrid() {
  const zones = [
    { name: "Palam", risk: "Extreme", aqi: 310 },
    { name: "Dwarka", risk: "High", aqi: 280 },
    { name: "RK Puram", risk: "Moderate", aqi: 190 },
    { name: "Vasant Kunj", risk: "High", aqi: 220 },
    { name: "Delhi Cantt", risk: "Moderate", aqi: 170 },
    { name: "Najafgarh", risk: "Extreme", aqi: 340 },
    { name: "Rohini", risk: "Low", aqi: 90 },
    { name: "Pitampura", risk: "Low", aqi: 95 },
    { name: "Janakpuri", risk: "Moderate", aqi: 160 },
    { name: "Lajpat Nagar", risk: "Low", aqi: 110 },
    { name: "Shahdara", risk: "Moderate", aqi: 140 },
    { name: "Okhla", risk: "High", aqi: 250 },
  ];

  const getStyle = (risk: string) => {
    switch(risk) {
      case "Extreme": return "bg-red-100 border-[var(--critical-red)] text-[var(--critical-red)]";
      case "High": return "bg-orange-50 border-[var(--gov-gold)] text-[var(--gov-gold)]";
      case "Moderate": return "bg-blue-50 border-[var(--accent-teal)] text-[var(--accent-teal)]";
      case "Low": return "bg-green-50 border-[var(--safe-green)] text-[var(--safe-green)]";
      default: return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tomorrow's Zone Risk Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {zones.map(z => (
            <div key={z.name} className={`border-l-4 p-4 rounded-sm shadow-sm bg-white ${getStyle(z.risk)}`}>
              <p className="font-semibold text-slate-800">{z.name}</p>
              <div className="flex justify-between items-end mt-2">
                <span className="text-2xl font-mono font-bold leading-none">{z.aqi}</span>
                <span className="text-xs uppercase font-bold tracking-wider">{z.risk}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
