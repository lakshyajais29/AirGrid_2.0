"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartExportActions } from "@/components/ui/chart-export-actions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function ScheduledFlightLoad({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Scheduled IGI Flight Load (Next 72h)</CardTitle>
        <ChartExportActions chartId="flight-load-chart" data={data} filenamePrefix="flight_load_forecast" />
      </CardHeader>
      <CardContent>
        <div id="flight-load-chart" className="h-[300px] w-full bg-white p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} />
              <YAxis tick={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-faint)', color: 'var(--text-primary)', borderRadius: '2px', fontFamily: 'var(--font-mono)' }} />
              <Bar dataKey="flights" fill="var(--mid-blue)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
