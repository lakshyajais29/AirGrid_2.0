"use client";

import React from "react";
import { ReportBuilderForm } from "@/components/reports/ReportBuilderForm";
import { PrintableReportView } from "@/components/reports/PrintableReportView";

export default function ReportsPage() {
  const handleGeneratePDF = () => {
    // Standard browser print triggers the media print CSS which hides
    // the UI and shows the PrintableReportView.
    window.print();
  };

  return (
    <>
      <div className="p-8 max-w-5xl mx-auto space-y-8 bg-slate-50 min-h-screen no-print">
        <div>
          <h1 className="text-3xl font-bold text-[var(--navy)] tracking-tight">Report Builder</h1>
          <p className="text-slate-600 mt-2 text-sm max-w-3xl">
            Generate and export official DMC environmental reports. Configure your template below. 
            Generating the PDF will automatically apply the DMC letterhead and format the output for official distribution.
          </p>
        </div>

        <ReportBuilderForm onGenerate={handleGeneratePDF} />
      </div>

      {/* The PrintableReportView is hidden via 'hidden print:block' CSS */}
      <PrintableReportView />
    </>
  );
}
