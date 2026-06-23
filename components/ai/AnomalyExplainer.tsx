"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export function AnomalyExplainer() {
  return (
    <Card className="border-l-4 border-l-[var(--critical-red)] bg-red-50/30">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <AlertTriangle className="w-5 h-5 text-[var(--critical-red)]" />
        <CardTitle className="text-[var(--critical-red)] text-lg">Anomaly Detected: NO2 Spike at 08:00 IST</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-slate-700 space-y-3">
          <p>
            <strong className="text-slate-900">AI Analysis:</strong> The sensor network at Sector 8 Dwarka recorded a 40 µg/m³ spike in Nitrogen Dioxide. 
          </p>
          <p>
            <strong className="text-slate-900">Evidence:</strong> Flight telemetry confirms a cluster of 14 wide-body international departures from Runway 29 between 07:45 and 08:15. Meteorological data indicates an inversion layer trapped emissions at ground level (Wind: 1.2m/s, Stability Class F).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
