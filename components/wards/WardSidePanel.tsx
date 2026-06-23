"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WardSidePanelProps {
  ward: any;
}

export function WardSidePanel({ ward }: WardSidePanelProps) {
  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async () => {
    if (!ward) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/reports/ward", {
        method: "POST",
        body: JSON.stringify({ zoneId: ward.id, name: ward.name }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        alert("Report generated: " + data.message);
      } else {
        alert("Failed to generate report.");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating report.");
    } finally {
      setGenerating(false);
    }
  };

  if (!ward) {
    return (
      <Card className="h-full bg-slate-50 border-slate-200 flex items-center justify-center">
        <p className="text-slate-500">Select a zone on the map to view details.</p>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="bg-[var(--navy)] text-white p-4">
        <CardTitle className="text-xl">{ward.name}</CardTitle>
        <p className="text-sm opacity-80 font-mono">ID: {ward.id}</p>
      </CardHeader>
      <CardContent className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-sm border border-slate-100">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Current AQI</p>
            <p className="text-3xl font-mono mt-1" style={{ color: ward.aqi > 200 ? 'var(--critical-red)' : 'var(--navy)' }}>{ward.aqi}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-sm border border-slate-100">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Exposure Score</p>
            <p className="text-3xl font-mono mt-1 text-[var(--gov-gold)]">{ward.aviation_exposure}/10</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-600">Dominant Pollutant</span>
            <span className="font-semibold text-[var(--navy)]">{ward.dominant_pollutant}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-slate-600">Population</span>
            <span className="font-mono text-[var(--navy)]">{ward.population.toLocaleString()}</span>
          </div>
        </div>

        <div className="pt-6">
          <Button 
            className="w-full" 
            onClick={handleGenerateReport} 
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate Ward Report (PDF)"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
