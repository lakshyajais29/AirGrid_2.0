"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartExportActions } from "@/components/ui/chart-export-actions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function LaggedCorrelationChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lagged Correlation (r-value vs lag)</CardTitle>
        <ChartExportActions chartId="lagged-correlation-chart" data={data} filenamePrefix="lagged_correlation" />
      </CardHeader>
      <CardContent>
        <div id="lagged-correlation-chart" className="h-[300px] w-full bg-white p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="lag" tick={{ fontFamily: 'var(--font-sans)', fontSize: 12 }} />
              <YAxis domain={[0, 1]} tick={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '2px', border: '1px solid #ccc' }} />
              <Bar dataKey="r" fill="var(--mid-blue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
