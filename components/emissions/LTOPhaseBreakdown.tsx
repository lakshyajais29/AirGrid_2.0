"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { calculateLTOEmissions, AIRCRAFT_DATA } from "@/lib/emission-calculator";

const breakdownData = Object.keys(AIRCRAFT_DATA).map((type) => {
  const emissions = calculateLTOEmissions(type);
  const data: any = { name: type };
  emissions.breakdown.forEach((b) => {
    data[b.phase] = parseFloat(b.nox_kg.toFixed(2));
  });
  return data;
});

const PHASE_COLORS = {
  "Taxi-Out": "#C9A84C",
  "Takeoff": "#C0392B",
  "Climb": "#0F8B8D",
  "Approach": "#1E5FA8",
  "Taxi-In": "#1A3A5C",
};

export const LTOPhaseBreakdown: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6 h-[380px] flex flex-col">
      <h2 className="text-xl font-semibold mb-4 text-navy">LTO Phase Breakdown (NOx kg)</h2>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={breakdownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#8A9BB0" }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#8A9BB0" }} />
            <Tooltip
              cursor={{ fill: "#F1F5F9" }}
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            {Object.entries(PHASE_COLORS).map(([phase, color]) => (
              <Bar key={phase} dataKey={phase} stackId="a" fill={color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
