"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ReportBuilderForm({ onGenerate }: { onGenerate: () => void }) {
  const handleBulkExport = () => {
    window.location.href = "/api/export/csv";
  };

  return (
    <Card className="no-print border-t-4 border-t-[var(--navy)]">
      <CardHeader>
        <CardTitle>Report Builder Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Template Type</label>
            <select className="w-full p-2 border border-slate-300 rounded-sm focus:outline-none focus:border-[var(--navy)]">
              <option>Daily Situation Report</option>
              <option>Weekly Analysis</option>
              <option>Monthly Executive Brief</option>
              <option>Incident Investigation</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Date Range</label>
            <select className="w-full p-2 border border-slate-300 rounded-sm focus:outline-none focus:border-[var(--navy)]">
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Custom Range...</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Target Wards/Zones</label>
            <select className="w-full p-2 border border-slate-300 rounded-sm focus:outline-none focus:border-[var(--navy)]">
              <option>All 12 Zones</option>
              <option>Palam (IGI Proximity)</option>
              <option>Dwarka</option>
              <option>RK Puram</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Include Sections</label>
            <div className="flex flex-col gap-2 mt-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="accent-[var(--navy)]" /> AI Executive Summary</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="accent-[var(--navy)]" /> Aviation Load Data</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="accent-[var(--navy)]" /> Plume Dispersion Model</label>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <Button onClick={onGenerate} className="flex-1 bg-[var(--navy)] text-white hover:bg-slate-800">
            Preview & Print PDF Report
          </Button>
          <Button variant="outline" onClick={handleBulkExport} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Bulk CSV Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
