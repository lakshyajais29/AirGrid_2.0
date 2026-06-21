"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { calculateLTOEmissions, AIRCRAFT_DATA } from "@/lib/emission-calculator";

const comparisonData = Object.keys(AIRCRAFT_DATA).map((type) => {
  const emissions = calculateLTOEmissions(type);
  return {
    name: type,
    nox: parseFloat(emissions.nox_kg.toFixed(2)),
  };
}).sort((a, b) => b.nox - a.nox);

export const AircraftTypeComparison: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6 h-[380px] flex flex-col">
      <h2 className="text-xl font-semibold mb-4 text-navy">NOx per LTO by Aircraft Type</h2>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#8A9BB0" }} />
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#1C2B3A", fontWeight: 500 }} />
            <Tooltip
              cursor={{ fill: "#F1F5F9" }}
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              formatter={(value: any) => [`${value} kg`, "NOx per LTO"]}
            />
            <Bar dataKey="nox" fill="var(--mid-blue)" radius={[0, 4, 4, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
