"use client";

import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const fleetData = [
  { name: "B737-800", value: 80 },
  { name: "A320neo", value: 70 },
  { name: "A321", value: 20 },
  { name: "B777-300", value: 15 },
  { name: "ATR72", value: 15 },
];

const COLORS = ["#0D1B2A", "#1A3A5C", "#1E5FA8", "#0F8B8D", "#C9A84C"];

export const FleetCompositionPie: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col h-[380px]">
      <h2 className="text-xl font-semibold mb-4 text-navy">Today's Fleet Mix</h2>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={fleetData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {fleetData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [`${value} Flights`, "Count"]}
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted mt-2 text-center">Total tracked flights: 200</p>
    </div>
  );
};
