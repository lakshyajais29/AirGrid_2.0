"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartExportActions } from "@/components/ui/chart-export-actions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function WeekdayVsWeekendChart() {
  const data = [
    { type: "Weekday Average", AQI: 185 },
    { type: "Weekend Average", AQI: 140 }
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Weekday vs Weekend AQI</CardTitle>
        <ChartExportActions chartId="weekday-weekend-chart" data={data} filenamePrefix="weekday_weekend" />
      </CardHeader>
      <CardContent>
        <div id="weekday-weekend-chart" className="h-[300px] w-full bg-white p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={60}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="type" tick={{ fontFamily: 'var(--font-sans)', fontSize: 12 }} />
              <YAxis tick={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-faint)', color: 'var(--text-primary)', borderRadius: '2px', fontFamily: 'var(--font-mono)' }} />
              <Bar dataKey="AQI" fill="var(--navy)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
