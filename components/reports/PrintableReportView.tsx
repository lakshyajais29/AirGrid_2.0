"use client";

import React from "react";

export function PrintableReportView() {
  const date = new Date().toISOString().split('T')[0];
  const refNum = `DMC/ENV/AIRGRID/${date}/001`;

  return (
    <div className="hidden print:block w-full bg-white text-black p-8 font-serif leading-relaxed">
      {/* DMC Letterhead */}
      <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-8">
        <div className="w-24 h-24 flex items-center justify-center border-2 border-black rounded-full font-bold text-center text-xs">
          DMC<br/>EMBLEM
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase tracking-widest">Delhi Municipal Corporation</h1>
          <h2 className="text-lg font-semibold uppercase tracking-wider text-slate-700">Department of Environment</h2>
          <p className="text-sm">AIRGRID Operations Center</p>
        </div>
        <div className="w-24 text-right">
          <p className="text-xs font-mono font-semibold">Ref: {refNum}</p>
          <p className="text-xs font-mono">Date: {date}</p>
        </div>
      </div>

      <h3 className="text-xl font-bold text-center mb-6 underline">DAILY SITUATION REPORT: AVIATION EMISSION IMPACT</h3>

      {/* AI Executive Summary */}
      <div className="mb-8">
        <h4 className="font-bold text-lg mb-2">1. Executive Summary (AI Generated)</h4>
        <p className="mb-4 text-justify">
          Current Air Quality Index (AQI) stands at 245 (POOR) across the National Capital Region. The dominant pollutant remains PM2.5, primarily driven by localized meteorological stagnation and a 15% increase in aviation traffic at IGI Airport over the last 24 hours. The Graded Response Action Plan (GRAP) is currently active at Stage II.
        </p>
        <p className="mb-4 text-justify">
          Aviation emissions from LTO cycles contributed approximately 12.4% to the localized NOx inventory today. A minor anomaly was detected at 08:00 IST where NO2 levels spiked by 40 µg/m³; our models correlate this with a concentrated block of wide-body aircraft departures during low-dispersion wind conditions.
        </p>
      </div>

      {/* Mock Data Section */}
      <div className="mb-12">
        <h4 className="font-bold text-lg mb-2">2. Ward-Level Impact (Dwarka & Palam)</h4>
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-left">Ward</th>
              <th className="border border-black p-2 text-left">Avg AQI</th>
              <th className="border border-black p-2 text-left">Est. Aviation Contribution</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2">Palam (IGI)</td>
              <td className="border border-black p-2">260</td>
              <td className="border border-black p-2">35%</td>
            </tr>
            <tr>
              <td className="border border-black p-2">Sector 8 Dwarka</td>
              <td className="border border-black p-2">245</td>
              <td className="border border-black p-2">22%</td>
            </tr>
            <tr>
              <td className="border border-black p-2">RK Puram</td>
              <td className="border border-black p-2">210</td>
              <td className="border border-black p-2">8%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature Block */}
      <div className="mt-32 flex justify-between">
        <div className="text-center">
          <div className="w-48 border-b border-black mb-2"></div>
          <p className="font-bold text-sm">Automated by AIRGRID AI</p>
          <p className="text-xs text-slate-600">Generated on {new Date().toLocaleString()}</p>
        </div>
        <div className="text-center">
          <div className="w-48 border-b border-black mb-2"></div>
          <p className="font-bold text-sm">Chief Environmental Officer</p>
          <p className="text-xs text-slate-600">DMC</p>
        </div>
      </div>

      {/* Classification Footer */}
      <div className="fixed bottom-4 left-0 right-0 text-center font-bold tracking-widest text-red-700 opacity-50 uppercase text-xs">
        FOR OFFICIAL USE ONLY - DMC CONFIDENTIAL
      </div>
    </div>
  );
}
