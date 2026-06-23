"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartExportActions } from "@/components/ui/chart-export-actions";
import { ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Simple linear regression to get a line
function getLinearRegressionLine(data: any[], xKey: string, yKey: string) {
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  const n = data.length;
  if (n === 0) return [];
  
  data.forEach(d => {
    sumX += d[xKey];
    sumY += d[yKey];
    sumXY += d[xKey] * d[yKey];
    sumXX += d[xKey] * d[xKey];
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const minX = Math.min(...data.map(d => d[xKey]));
  const maxX = Math.max(...data.map(d => d[xKey]));
  
  return [
    { [xKey]: minX, [yKey]: slope * minX + intercept },
    { [xKey]: maxX, [yKey]: slope * maxX + intercept }
  ];
}

export function ScatterPlots({ scatterData, emissionData, stats }: { scatterData: any[], emissionData: any[], stats: any }) {
  const flightVsAqiRegLine = React.useMemo(() => getLinearRegressionLine(scatterData, "flights", "aqi"), [scatterData]);
  const noxVsNo2RegLine = React.useMemo(() => getLinearRegressionLine(emissionData, "estimatedNOx", "measuredNO2"), [emissionData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Chart 1: Flights vs AQI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Flights vs AQI</CardTitle>
            <p className="text-sm text-slate-500 font-mono mt-1">R² = {stats.r2} | p = {stats.pVal}</p>
          </div>
          <ChartExportActions chartId="flights-aqi-scatter" data={scatterData} filenamePrefix="flights_vs_aqi" />
        </CardHeader>
        <CardContent>
          <div id="flights-aqi-scatter" className="h-[300px] w-full bg-white p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="flights" name="Flights" label={{ value: "Hourly Flights", position: "insideBottom", offset: -5 }} tick={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                <YAxis type="number" dataKey="aqi" name="AQI" label={{ value: "AQI", angle: -90, position: "insideLeft" }} tick={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={scatterData} fill="var(--navy)" opacity={0.6} />
                <Line data={flightVsAqiRegLine} type="linear" dataKey="aqi" stroke="var(--critical-red)" dot={false} activeDot={false} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Chart 2: Estimated NOx vs Measured NO2 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>NOx (Estimated) vs NO₂ (Measured)</CardTitle>
          <ChartExportActions chartId="nox-no2-scatter" data={emissionData} filenamePrefix="nox_vs_no2" />
        </CardHeader>
        <CardContent>
          <div id="nox-no2-scatter" className="h-[300px] w-full bg-white p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="estimatedNOx" name="Estimated NOx" label={{ value: "Estimated NOx (kg)", position: "insideBottom", offset: -5 }} tick={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                <YAxis type="number" dataKey="measuredNO2" name="Measured NO2" label={{ value: "Measured NO₂ (µg/m³)", angle: -90, position: "insideLeft" }} tick={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={emissionData} fill="var(--gov-gold)" opacity={0.8} />
                <Line data={noxVsNo2RegLine} type="linear" dataKey="measuredNO2" stroke="var(--critical-red)" dot={false} activeDot={false} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
