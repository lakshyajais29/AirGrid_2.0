"use client";

import React from "react";
import { Button } from "./button";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

interface ChartExportActionsProps {
  chartId: string;
  data: any[];
  filenamePrefix: string;
}

export function ChartExportActions({ chartId, data, filenamePrefix }: ChartExportActionsProps) {
  const handleExportPNG = async () => {
    const chartElement = document.getElementById(chartId);
    if (chartElement) {
      try {
        const canvas = await html2canvas(chartElement, { backgroundColor: "#ffffff" });
        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `${filenamePrefix}.png`;
        link.href = url;
        link.click();
      } catch (error) {
        console.error("Failed to export PNG", error);
      }
    }
  };

  const handleExportExcel = () => {
    if (!data || data.length === 0) return;
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    
    // Generate buffer and trigger download
    XLSX.writeFile(workbook, `${filenamePrefix}.xlsx`);
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const csvContent = [
      headers,
      ...data.map((row) =>
        Object.values(row)
          .map((value) => `"${value}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filenamePrefix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex gap-2 no-print">
      <Button variant="outline" className="h-8 px-2 text-xs border-slate-300 text-slate-600 hover:bg-slate-50" onClick={handleExportPNG}>
        Export PNG
      </Button>
      <Button variant="outline" className="h-8 px-2 text-xs border-slate-300 text-slate-600 hover:bg-slate-50" onClick={handleExportCSV}>
        Export CSV
      </Button>
      <Button variant="outline" className="h-8 px-2 text-xs border-[var(--safe-green)] text-[var(--safe-green)] hover:bg-[#eaf5eb]" onClick={handleExportExcel}>
        Export Excel
      </Button>
    </div>
  );
}
