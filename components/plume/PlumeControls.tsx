"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

interface PlumeControlsProps {
  windDir: number;
  setWindDir: (val: number) => void;
  windSpeed: number;
  setWindSpeed: (val: number) => void;
  stability: string;
  setStability: (val: string) => void;
  emitRate: number;
  setEmitRate: (val: number) => void;
}

export function PlumeControls({
  windDir, setWindDir,
  windSpeed, setWindSpeed,
  stability, setStability,
  emitRate, setEmitRate
}: PlumeControlsProps) {

  // Mock wind rose data
  const windRoseData = [
    { subject: 'N', A: windDir >= 315 || windDir < 45 ? windSpeed : 2, fullMark: 20 },
    { subject: 'NE', A: windDir >= 45 && windDir < 90 ? windSpeed : 1, fullMark: 20 },
    { subject: 'E', A: windDir >= 90 && windDir < 135 ? windSpeed : 3, fullMark: 20 },
    { subject: 'SE', A: windDir >= 135 && windDir < 180 ? windSpeed : 1, fullMark: 20 },
    { subject: 'S', A: windDir >= 180 && windDir < 225 ? windSpeed : 5, fullMark: 20 },
    { subject: 'SW', A: windDir >= 225 && windDir < 270 ? windSpeed : 4, fullMark: 20 },
    { subject: 'W', A: windDir >= 270 && windDir < 315 ? windSpeed : 2, fullMark: 20 },
    { subject: 'NW', A: windDir >= 315 ? windSpeed : 1, fullMark: 20 },
  ];

  return (
    <div className="space-y-4 h-full">
      <Card>
        <CardHeader>
          <CardTitle>Atmospheric Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-semibold text-slate-700">Wind Direction (°)</label>
              <span className="text-sm font-mono">{windDir}°</span>
            </div>
            <input 
              type="range" min="0" max="359" value={windDir} 
              onChange={(e) => setWindDir(Number(e.target.value))}
              className="w-full accent-[var(--navy)]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-semibold text-slate-700">Wind Speed (m/s)</label>
              <span className="text-sm font-mono">{windSpeed}</span>
            </div>
            <input 
              type="range" min="0" max="20" step="0.5" value={windSpeed} 
              onChange={(e) => setWindSpeed(Number(e.target.value))}
              className="w-full accent-[var(--navy)]"
            />
          </div>

          <div className="h-[200px] w-full border border-slate-100 rounded-sm mt-4 bg-slate-50">
             <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={windRoseData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontFamily: 'var(--font-sans)' }} />
                  <Radar name="Wind Speed" dataKey="A" stroke="var(--navy)" fill="var(--mid-blue)" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Source Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Pasquill-Gifford Stability Class</label>
            <select 
              value={stability} 
              onChange={(e) => setStability(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-[var(--navy)]"
            >
              <option value="A">A - Extremely Unstable</option>
              <option value="B">B - Moderately Unstable</option>
              <option value="C">C - Slightly Unstable</option>
              <option value="D">D - Neutral</option>
              <option value="E">E - Slightly Stable</option>
              <option value="F">F - Moderately Stable</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-semibold text-slate-700">Emission Rate (g/s)</label>
              <span className="text-sm font-mono">{emitRate}</span>
            </div>
            <input 
              type="range" min="10" max="1000" step="10" value={emitRate} 
              onChange={(e) => setEmitRate(Number(e.target.value))}
              className="w-full accent-[var(--critical-red)]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
