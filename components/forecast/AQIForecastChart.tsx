"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartExportActions } from "@/components/ui/chart-export-actions";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export function AQIForecastChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>72h AQI Forecast (95% Confidence Interval)</CardTitle>
        <ChartExportActions chartId="aqi-forecast-chart" data={data} filenamePrefix="aqi_72h_forecast" />
      </CardHeader>
      <CardContent>
        <div id="aqi-forecast-chart" className="h-[400px] w-full bg-white p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} />
              <YAxis tick={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} />
              
              <Tooltip 
                contentStyle={{ borderRadius: '2px', fontFamily: 'var(--font-mono)' }}
                formatter={(value: any, name: any) => {
                  if (name === "confidence") return [`${value[0]} - ${value[1]}`, "95% Confidence Band"];
                  return [value, "Predicted AQI"];
                }}
              />

              <ReferenceLine y={200} label={{ position: 'insideTopLeft', value: 'Poor Threshold (200)', fill: 'var(--gov-gold)', fontSize: 10 }} stroke="var(--gov-gold)" strokeDasharray="3 3" />
              <ReferenceLine y={300} label={{ position: 'insideTopLeft', value: 'Hazardous (300)', fill: 'var(--critical-red)', fontSize: 10 }} stroke="var(--critical-red)" strokeDasharray="3 3" />

              {/* Confidence Band: using array [min, max] */}
              <Area type="monotone" dataKey="confidence" stroke="none" fill="var(--navy)" fillOpacity={0.1} />
              
              {/* Main Prediction Line */}
              <Area type="monotone" dataKey="predictedAQI" stroke="var(--navy)" strokeWidth={3} fill="none" activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
