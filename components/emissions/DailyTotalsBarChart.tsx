"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const hourlyData = Array.from({ length: 24 }).map((_, i) => {
  // Bimodal curve peaking at 9 AM and 7 PM
  const hour = i;
  let multiplier = 0.3;
  if (hour >= 6 && hour <= 11) multiplier = 0.8 + Math.random() * 0.4;
  else if (hour >= 17 && hour <= 22) multiplier = 0.9 + Math.random() * 0.4;
  else multiplier = 0.2 + Math.random() * 0.3;

  return {
    hour: `${hour.toString().padStart(2, "0")}:00`,
    nox: Math.round(multiplier * 45), // random scaling for NOx in kg
  };
});

export const DailyTotalsBarChart: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6 h-[380px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-navy">Hourly NOx Emissions (Estimated)</h2>
        <span className="text-sm text-muted">24 Hour Window</span>
      </div>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#8A9BB0" }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#8A9BB0" }} />
            <Tooltip
              cursor={{ fill: "#F1F5F9" }}
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              formatter={(value: any) => [`${value} kg`, "NOx"]}
              labelStyle={{ color: "#1C2B3A", fontWeight: "bold", marginBottom: "4px" }}
            />
            <Bar dataKey="nox" fill="var(--critical-red)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
