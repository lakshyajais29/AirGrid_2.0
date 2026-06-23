"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartExportActions } from "@/components/ui/chart-export-actions";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function YearOnYearComparison() {
  const data = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((month) => {
      // Base AQI curve: higher in winter (Jan/Nov/Dec), lower in monsoon (Jul/Aug)
      const baseAqi = ["Jan","Nov","Dec"].includes(month) ? 250 : ["Jul","Aug"].includes(month) ? 80 : 150;
      
      return {
        month,
        "2022": Math.floor(baseAqi + Math.random() * 50),
        "2023": Math.floor(baseAqi - 10 + Math.random() * 40),
        "2024": Math.floor(baseAqi - 20 + Math.random() * 30),
        "2025": Math.floor(baseAqi - 30 + Math.random() * 20),
      };
    });
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Year-on-Year AQI Comparison</CardTitle>
        <ChartExportActions chartId="yoy-chart" data={data} filenamePrefix="yoy_comparison" />
      </CardHeader>
      <CardContent>
        <div id="yoy-chart" className="h-[300px] w-full bg-white p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontFamily: 'var(--font-sans)', fontSize: 12 }} />
              <YAxis tick={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '2px', fontFamily: 'var(--font-mono)' }} />
              <Legend />
              <Line type="monotone" dataKey="2022" stroke="#94a3b8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="2023" stroke="var(--gov-gold)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="2024" stroke="var(--mid-blue)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="2025" stroke="var(--navy)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
