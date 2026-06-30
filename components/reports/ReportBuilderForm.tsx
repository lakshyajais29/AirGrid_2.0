"use client";

import React, { useState, useRef, useCallback } from "react";
import { ReportDocument } from "./ReportDocument";
import { FileText, Download } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportPeriod = "24h" | "7d" | "30d";

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  "24h": "Last 24 Hours",
  "7d":  "Last 7 Days",
  "30d": "Last 30 Days",
};

// ─── Helper: generate Report ID ──────────────────────────────────────────────

function makeReportId(): string {
  const now   = new Date();
  const ymd   = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand  = Math.floor(1000 + Math.random() * 9000);
  return `RPT-${ymd}-${rand}`;
}

// ─── Main export component ────────────────────────────────────────────────────

export function ReportBuilderForm({ onGenerate }: { onGenerate?: () => void }) {
  const [showModal,   setShowModal]   = useState(false);
  const [period,      setPeriod]      = useState<ReportPeriod>("24h");
  const [exporting,   setExporting]   = useState(false);
  const [reportId]                    = useState(makeReportId);
  const reportRef = useRef<HTMLDivElement>(null);

  const openModal = () => {
    setShowModal(true);
    onGenerate?.();
  };

  const handleExportPDF = useCallback(async () => {
    if (!reportRef.current) return;
    setExporting(true);

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const el = reportRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: 794,
        logging: false,
      });

      const imgData  = canvas.toDataURL("image/png");
      const pdf      = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW    = pdf.internal.pageSize.getWidth();
      const pageH    = pdf.internal.pageSize.getHeight();
      const imgW     = pageW;
      const imgH     = (canvas.height * imgW) / canvas.width;
      let   yOffset  = 0;

      // Paginate
      while (yOffset < imgH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -yOffset, imgW, imgH);
        yOffset += pageH;
      }

      pdf.save(`AirGrid_Report_${reportId}.pdf`);
    } finally {
      setExporting(false);
    }
  }, [reportId]);

  return (
    <>
      {/* ── Trigger button ──────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg,#ffffff,#f0f4ff)",
          border: "1px solid #e2e8f0",
          borderTop: "4px solid #0D1B2A",
          borderRadius: "14px",
          padding: "24px",
          boxShadow: "0 2px 12px rgba(13,27,42,0.07)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#0F8B8D",
              marginBottom: "6px",
            }}
          >
            Official Documentation
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0D1B2A", margin: 0 }}>
            Report Builder Configuration
          </h2>
          <p style={{ fontSize: "13px", color: "#8A9BB0", marginTop: "6px" }}>
            Generate a professional, multi-page Air Quality Intelligence Report for official distribution.
          </p>
        </div>

        {/* Config grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          {[
            { label: "Template Type",    value: "Daily Situation Report" },
            { label: "Target Zones",     value: "All 12 Zones — Delhi NCR" },
            { label: "Data Sources",     value: "WAQI · OpenWeatherMap · Sentinel-5P" },
            { label: "Classification",   value: "CONFIDENTIAL — Official Use" },
          ].map((item) => (
            <div key={item.label}>
              <div
                style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#8A9BB0", marginBottom: "4px" }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#1C2B3A" }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Section checkboxes */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A9BB0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
            Included Sections
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {[
              "Cover Page",
              "Executive Summary",
              "Active Alert Log",
              "Source Attribution",
              "Mitigation Actions",
              "Sign-off & Footer",
            ].map((s) => (
              <label key={s} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#1C2B3A", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  defaultChecked
                  style={{ accentColor: "#0F8B8D", width: "14px", height: "14px" }}
                />
                {s}
              </label>
            ))}
          </div>
        </div>

        {/* Action row */}
        <div style={{ display: "flex", gap: "12px", borderTop: "1px solid #E2E8F0", paddingTop: "18px" }}>
          <button
            onClick={openModal}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #0D1B2A, #1A3A5C)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 14px rgba(13,27,42,0.25)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(13,27,42,0.35)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(13,27,42,0.25)"; }}
          >
            <FileText size={18} />
            Generate Report &amp; Preview
          </button>

          <button
            onClick={() => { window.location.href = "/api/export/csv"; }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "white",
              color: "#1C2B3A",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "12px 18px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#0F8B8D"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E2E8F0"; }}
          >
            <Download size={16} /> Bulk CSV Export
          </button>
        </div>
      </div>

      {/* ── Preview Modal ────────────────────────────────────────────── */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(13,27,42,0.72)",
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "24px",
            backdropFilter: "blur(4px)",
            overflowY: "auto",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              width: "min(880px, 100%)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 24px 64px rgba(13,27,42,0.35)",
              maxHeight: "95vh",
              overflow: "hidden",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 24px",
                borderBottom: "1px solid #E2E8F0",
                background: "linear-gradient(135deg, #0D1B2A, #1A3A5C)",
                borderRadius: "16px 16px 0 0",
                flexShrink: 0,
              }}
            >
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", color: "rgba(15,139,141,0.9)", textTransform: "uppercase", marginBottom: "3px" }}>
                  AirGrid OS · Report Preview
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "white" }}>
                  Air Quality Intelligence Report
                </div>
              </div>

              {/* Period selector removed */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>


                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    borderRadius: "8px",
                    width: "34px",
                    height: "34px",
                    cursor: "pointer",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable report preview */}
            <div
              style={{
                overflowY: "auto",
                flex: 1,
                background: "#E8EAF0",
                padding: "20px",
              }}
            >
              <div ref={reportRef} style={{ width: "794px", margin: "0 auto" }}>
                <ReportDocument period={period} reportId={reportId} />
              </div>
            </div>

            {/* Modal footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderTop: "1px solid #E2E8F0",
                background: "#F8FAFF",
                borderRadius: "0 0 16px 16px",
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: "12px", color: "#8A9BB0", fontFamily: "monospace" }}>
                Report ID: <strong style={{ color: "#1C2B3A" }}>{reportId}</strong>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "9px 20px",
                    borderRadius: "9px",
                    border: "1px solid #E2E8F0",
                    background: "white",
                    color: "#4A6080",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  ✕ Close
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  style={{
                    padding: "9px 22px",
                    borderRadius: "9px",
                    border: "none",
                    background: exporting
                      ? "rgba(15,139,141,0.5)"
                      : "linear-gradient(135deg, #0F8B8D, #0a7678)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: exporting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s",
                    boxShadow: exporting ? "none" : "0 4px 12px rgba(15,139,141,0.35)",
                  }}
                >
                  {exporting ? (
                    <>
                      <span
                        style={{
                          display: "inline-block",
                          width: "14px",
                          height: "14px",
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "white",
                          borderRadius: "50%",
                          animation: "spin 0.9s linear infinite",
                        }}
                      />
                      Generating report...
                    </>
                  ) : (
                    <>⬇ Export as PDF</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
