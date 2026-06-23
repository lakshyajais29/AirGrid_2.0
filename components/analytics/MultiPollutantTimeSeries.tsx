"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartExportActions } from "@/components/ui/chart-export-actions";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, ReferenceLine, Legend } from "recharts";

export function MultiPollutantTimeSeries() {
  // Generate 90 days of mock data
  const data = useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = 90; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      
      const isDiwali = i === 45; // Mock Diwali around 45 days ago
      const isHoli = i === 15;   // Mock Holi

      arr.push({
        date: d.toISOString().split('T')[0],
        AQI: isDiwali ? 450 : isHoli ? 300 : Math.floor(100 + Math.random() * 100),
        PM25: isDiwali ? 350 : Math.floor(50 + Math.random() * 50),
        NO2: Math.floor(20 + Math.random() * 30),
        isDiwali,
        isHoli
      });
    }
    return arr;
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Multi-Pollutant Time Series</CardTitle>
        <ChartExportActions chartId="multi-pollutant-chart" data={data} filenamePrefix="time_series_data" />
      </CardHeader>
      <CardContent>
        <div id="multi-pollutant-chart" className="h-[400px] w-full bg-white p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} />
              <YAxis tick={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '2px', fontFamily: 'var(--font-mono)' }}
                labelStyle={{ fontWeight: 'bold', color: 'var(--navy)', marginBottom: '5px' }}
              />
              <Legend />

              {/* NAAQS Reference Lines */}
              <ReferenceLine y={100} label={{ position: 'insideTopLeft', value: 'NAAQS Safe (100)', fill: 'var(--safe-green)', fontSize: 10 }} stroke="var(--safe-green)" strokeDasharray="3 3" />
              <ReferenceLine y={300} label={{ position: 'insideTopLeft', value: 'Hazardous (300)', fill: 'var(--critical-red)', fontSize: 10 }} stroke="var(--critical-red)" strokeDasharray="3 3" />

              {/* Festival Markers */}
              <ReferenceLine x={data[45].date} stroke="var(--gov-gold)" label={{ position: 'top', value: 'Diwali', fill: 'var(--gov-gold)' }} />
              <ReferenceLine x={data[15].date} stroke="var(--mid-blue)" label={{ position: 'top', value: 'Holi', fill: 'var(--mid-blue)' }} />

              <Line type="monotone" dataKey="AQI" stroke="var(--navy)" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="PM25" stroke="var(--critical-red)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="NO2" stroke="var(--gov-gold)" strokeWidth={2} dot={false} />

              <Brush dataKey="date" height={30} stroke="var(--navy)" fill="#f1f5f9" travellerWidth={10} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
