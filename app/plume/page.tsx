"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { PlumeControls } from "@/components/plume/PlumeControls";
import { WardDoseTable } from "@/components/plume/WardDoseTable";

// Dynamically import map
const PlumeMap = dynamic(() => import("@/components/plume/PlumeMap"), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-slate-100 flex items-center justify-center border rounded-sm">Initializing Physics Engine...</div>
});

export default function PlumePage() {
  const [windDir, setWindDir] = useState<number>(270); // West wind (blows east)
  const [windSpeed, setWindSpeed] = useState<number>(5.5);
  const [stability, setStability] = useState<string>("D");
  const [emitRate, setEmitRate] = useState<number>(250);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-[var(--navy)] tracking-tight">Plume Dispersion Model</h1>
        <p className="text-slate-600 mt-2 text-sm max-w-3xl">
          Gaussian plume visualization simulating particle dispersion from the IGI Airport source.
          Adjust meteorological parameters to observe live impacts on surrounding wards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PlumeMap 
            windDir={windDir} 
            windSpeed={windSpeed} 
            stability={stability} 
            emitRate={emitRate} 
          />
        </div>
        <div className="lg:col-span-1">
          <PlumeControls 
            windDir={windDir} setWindDir={setWindDir}
            windSpeed={windSpeed} setWindSpeed={setWindSpeed}
            stability={stability} setStability={setStability}
            emitRate={emitRate} setEmitRate={setEmitRate}
          />
        </div>
      </div>

      <WardDoseTable windDir={windDir} emitRate={emitRate} />
    </div>
  );
}
