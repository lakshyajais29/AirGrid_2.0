"use client";

import React, { useEffect, useState } from "react";
import { CorrelationMatrix } from "@/components/correlation/CorrelationMatrix";
import { LaggedCorrelationChart } from "@/components/correlation/LaggedCorrelationChart";
import { ScatterPlots } from "@/components/correlation/ScatterPlots";

export default function CorrelationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/correlation");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Failed to fetch correlation data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading analysis data...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500">Failed to load data.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Correlation Analysis</h1>
        <p className="text-slate-600 mt-2 text-sm max-w-3xl">
          Analyzing the relationship between aviation metrics and local air quality pollutants.
          Data is generated via our statistical models incorporating Pearson correlation and lagged effects.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CorrelationMatrix data={data.correlationMatrix.data} labels={data.correlationMatrix.labels} />
        <LaggedCorrelationChart data={data.laggedCorrelation} />
      </div>

      <ScatterPlots scatterData={data.scatterData} emissionData={data.emissionData} stats={data.stats} />
      
      {/* For PDF export/print of the entire page */}
      <div className="flex justify-end no-print pt-4 border-t">
        <button 
          onClick={() => window.print()} 
          className="px-4 py-2 bg-[var(--navy)] text-white rounded-sm text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Print Full Report
        </button>
      </div>
    </div>
  );
}
