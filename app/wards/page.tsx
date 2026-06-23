"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { WardSidePanel } from "@/components/wards/WardSidePanel";
import { ZoneSummaryTable } from "@/components/wards/ZoneSummaryTable";

// Dynamically import Leaflet map because it uses window object
const WardMap = dynamic(() => import("@/components/wards/WardMap"), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-slate-100 flex items-center justify-center border rounded-sm">Loading map...</div>
});

export default function WardsPage() {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [selectedWard, setSelectedWard] = useState<any>(null);

  useEffect(() => {
    async function loadGeoJson() {
      try {
        const res = await fetch("/data/zones.geojson");
        const data = await res.json();
        setGeoJsonData(data);
      } catch (e) {
        console.error("Failed to load zones GeoJSON", e);
      }
    }
    loadGeoJson();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-[var(--navy)] tracking-tight">Wards & Zones Analysis</h1>
        <p className="text-slate-600 mt-2 text-sm max-w-3xl">
          Geospatial visualization of air quality across 12 primary zones. 
          Click on a zone to view aviation exposure impact, dominant pollutants, and generate a ward-level PDF report.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <WardMap geoJsonData={geoJsonData} onWardClick={setSelectedWard} />
        </div>
        <div className="lg:col-span-1">
          <WardSidePanel ward={selectedWard} />
        </div>
      </div>

      <ZoneSummaryTable geoJsonData={geoJsonData} />

      {/* Print utility */}
      <div className="flex justify-end no-print pt-4 border-t mt-8">
        <button 
          onClick={() => window.print()} 
          className="px-4 py-2 bg-[var(--navy)] text-white rounded-sm text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Print Zone Overview
        </button>
      </div>
    </div>
  );
}
