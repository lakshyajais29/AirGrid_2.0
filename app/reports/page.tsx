"use client";

import React from "react";
import { ReportBuilderForm } from "@/components/reports/ReportBuilderForm";

export default function ReportsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 min-h-screen no-print">
      {/* Page header */}
      <div>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--accent-teal)",
            marginBottom: "6px",
          }}
        >
          Official Documentation
        </div>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "var(--navy)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Report Builder
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            marginTop: "8px",
            fontSize: "13px",
            maxWidth: "640px",
            lineHeight: 1.7,
          }}
        >
          Generate and export professional, multi-page Air Quality Intelligence Reports with official
          DMC letterhead. Configure your template below, preview it in full, then export as a
          high-quality PDF for official distribution.
        </p>
      </div>

      {/* Info cards */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {[
          { icon: "📄", label: "6-Page Report",   desc: "Cover · Summary · Alerts · Sources · Actions · Sign-off" },
          { icon: "🔒", label: "Official Format",  desc: "DMC letterhead · Confidential classification stamp" },
          { icon: "⬇",  label: "PDF Export",       desc: "High-resolution A4 PDF via jsPDF + html2canvas" },
        ].map(({ icon, label, desc }) => (
          <div
            key={label}
            style={{
              flex: "1 1 200px",
              background: "linear-gradient(135deg,#ffffff,#f0f4ff)",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              boxShadow: "0 1px 4px rgba(13,27,42,0.05)",
            }}
          >
            <span style={{ fontSize: "22px", flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 700, color: "#0D1B2A", fontSize: "13px", marginBottom: "2px" }}>{label}</div>
              <div style={{ fontSize: "11px", color: "#8A9BB0", lineHeight: 1.5 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main form */}
      <ReportBuilderForm />
    </div>
  );
}
