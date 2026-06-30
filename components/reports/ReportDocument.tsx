"use client";

import React from "react";
import { Plane, Settings, MapPin, Radio, CloudSun, Factory, Satellite } from "lucide-react";
import type { ReportPeriod } from "./ReportBuilderForm";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  period: ReportPeriod;
  reportId: string;
}

// ─── Static report data ───────────────────────────────────────────────────────

const ALERTS = [
  { num: "01", ward: "Shahdara North",       severity: "CRITICAL", aqi: 267, issue: "Construction dust — NH9",           status: "Escalated" },
  { num: "02", ward: "Anand Vihar",          severity: "CRITICAL", aqi: 254, issue: "Heavy vehicle congestion",          status: "Assigned"  },
  { num: "03", ward: "Wazirpur Industrial",  severity: "CRITICAL", aqi: 248, issue: "Industrial stack emissions",        status: "Pending"   },
  { num: "04", ward: "Okhla Phase 2",        severity: "WARNING",  aqi: 221, issue: "Waste burning detected",            status: "Assigned"  },
  { num: "05", ward: "Rohini Sector 5",      severity: "WARNING",  aqi: 214, issue: "Road dust — unpaved stretch",       status: "Resolved"  },
  { num: "06", ward: "Bawana Industrial",    severity: "WARNING",  aqi: 208, issue: "Brick kiln activity",               status: "Pending"   },
  { num: "07", ward: "Jahangirpuri",         severity: "WARNING",  aqi: 203, issue: "Mixed: traffic + dust",             status: "Assigned"  },
  { num: "08", ward: "Mustafabad",           severity: "WARNING",  aqi: 197, issue: "Biomass burning — open lots",       status: "Pending"   },
  { num: "09", ward: "Burari",              severity: "INFO",     aqi: 186, issue: "AQI trending upward",               status: "Monitoring"},
  { num: "10", ward: "Narela",              severity: "INFO",     aqi: 179, issue: "Seasonal stubble correlation",      status: "Monitoring"},
  { num: "11", ward: "Badarpur Border",     severity: "INFO",     aqi: 173, issue: "Cross-boundary pollution load",     status: "Monitoring"},
];

const SOURCES = [
  { name: "Vehicular Emissions",  pct: 38, color: "#C0392B" },
  { name: "Construction Dust",    pct: 31, color: "#E67E22" },
  { name: "Biomass Burning",      pct: 18, color: "#8E44AD" },
  { name: "Industrial Emissions", pct:  9, color: "#2980B9" },
  { name: "Road Dust",            pct:  4, color: "#7F8C8D" },
];

const WARD_SOURCES = [
  { ward: "Anand Vihar",         bars: [{ l: "Vehicular",    p: 62, c: "#C0392B" }, { l: "Construction", p: 24, c: "#E67E22" }, { l: "Other", p: 14, c: "#7F8C8D" }] },
  { ward: "Shahdara North",      bars: [{ l: "Construction", p: 54, c: "#E67E22" }, { l: "Vehicular",    p: 28, c: "#C0392B" }, { l: "Other", p: 18, c: "#7F8C8D" }] },
  { ward: "Wazirpur Industrial", bars: [{ l: "Industrial",   p: 71, c: "#2980B9" }, { l: "Vehicular",    p: 19, c: "#C0392B" }, { l: "Other", p: 10, c: "#7F8C8D" }] },
];

const ACTIONS = [
  { action: "Deploy road watering tankers",    ward: "Shahdara North",  delta: "−34 AQI", effort: "Low",    priority: "HIGH"   },
  { action: "Restrict heavy vehicles 6–10 AM", ward: "Anand Vihar",     delta: "−22 AQI", effort: "Low",    priority: "HIGH"   },
  { action: "Inspect construction sites",      ward: "Wazirpur Indl.",  delta: "−29 AQI", effort: "Medium", priority: "HIGH"   },
  { action: "Investigate waste burning",       ward: "Okhla Phase 2",   delta: "−18 AQI", effort: "Medium", priority: "MEDIUM" },
  { action: "Pave unpaved road stretch",       ward: "Rohini Sector 5", delta: "−14 AQI", effort: "High",   priority: "MEDIUM" },
  { action: "Issue kiln compliance notice",    ward: "Bawana Indl.",    delta: "−21 AQI", effort: "Medium", priority: "MEDIUM" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityStyle(s: string): React.CSSProperties {
  if (s === "CRITICAL") return { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA" };
  if (s === "WARNING")  return { background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" };
  return { background: "#DBEAFE", color: "#1E40AF", border: "1px solid #BFDBFE" };
}

function statusStyle(s: string): React.CSSProperties {
  if (s === "Escalated") return { color: "#991B1B", fontWeight: 700 };
  if (s === "Assigned")  return { color: "#1E40AF", fontWeight: 600 };
  if (s === "Resolved")  return { color: "#166534", fontWeight: 600 };
  if (s === "Pending")   return { color: "#92400E", fontWeight: 600 };
  return { color: "#4A5568", fontWeight: 600 };
}

function priorityStyle(p: string): React.CSSProperties {
  if (p === "HIGH")   return { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA" };
  if (p === "MEDIUM") return { background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" };
  return { background: "#DBEAFE", color: "#1E40AF", border: "1px solid #BFDBFE" };
}

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  "24h": "Last 24 Hours",
  "7d":  "Last 7 Days",
  "30d": "Last 30 Days",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const PageShell = ({
  children,
  pageBreak = true,
}: {
  children: React.ReactNode;
  pageBreak?: boolean;
}) => (
  <div
    style={{
      width: "794px",
      minHeight: "1123px",
      background: "#ffffff",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "12px",
      color: "#1C2B3A",
      marginBottom: "20px",
      pageBreakBefore: pageBreak ? "always" : "auto",
      boxShadow: "0 2px 20px rgba(13,27,42,0.10)",
    }}
  >
    {children}
  </div>
);

// Repeated header on each page after cover
const PageHeader = ({ small }: { small?: boolean }) => (
  <div
    style={{
      background: "#0D1B2A",
      padding: small ? "10px 32px" : "14px 32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          width: "28px", height: "28px", borderRadius: "50%",
          border: "2px solid rgba(15,139,141,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px",
        }}
      >
        <Plane size={16} color="white" />
      </div>
      <div style={{ color: "white", fontWeight: 700, fontSize: "13px", letterSpacing: "0.06em" }}>
        AIRGRID OS
      </div>
    </div>
    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px", fontFamily: "monospace", letterSpacing: "0.04em" }}>
      AIR QUALITY INTELLIGENCE REPORT · DELHI MUNICIPAL CORPORATION
    </div>
    <div
      style={{
        background: "rgba(15,139,141,0.2)",
        border: "1px solid rgba(15,139,141,0.4)",
        borderRadius: "4px",
        padding: "2px 8px",
        fontSize: "10px",
        fontWeight: 700,
        color: "#0F8B8D",
        letterSpacing: "0.04em",
        fontFamily: "monospace",
      }}
    >
      CONFIDENTIAL
    </div>
  </div>
);

const PageFooter = ({ page, reportId }: { page: number; reportId: string }) => (
  <div
    style={{
      marginTop: "auto",
      borderTop: "1px solid #E2E8F0",
      padding: "10px 32px",
      display: "flex",
      justifyContent: "space-between",
      fontSize: "9px",
      color: "#A0AEC0",
      fontFamily: "monospace",
    }}
  >
    <span>AirGrid OS v2.0 · Air Quality Monitoring System</span>
    <span>{reportId}</span>
    <span>Page {page} of 6</span>
  </div>
);

const SectionHeading = ({ number, title }: { number: string; title: string }) => (
  <div style={{ marginBottom: "20px" }}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <span
        style={{
          fontSize: "10px",
          fontWeight: 800,
          letterSpacing: "0.2em",
          color: "#0F8B8D",
          fontFamily: "monospace",
        }}
      >
        {number}
      </span>
      <span
        style={{
          width: "1px",
          height: "16px",
          background: "#0F8B8D",
          display: "inline-block",
        }}
      />
      <span style={{ fontSize: "18px", fontWeight: 800, color: "#0D1B2A", letterSpacing: "0.04em" }}>
        {title}
      </span>
    </div>
    <div style={{ height: "2px", background: "linear-gradient(90deg, #0F8B8D, transparent)", marginTop: "8px", borderRadius: "2px" }} />
  </div>
);

// ─── Main ReportDocument ──────────────────────────────────────────────────────

export function ReportDocument({ period, reportId }: Props) {
  const today     = new Date();
  const tomorrow  = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr   = today.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const tomorrowStr = tomorrow.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const periodLabel = PERIOD_LABELS[period];

  // ── PAGE 1: COVER ────────────────────────────────────────────────────────

  const CoverPage = (
    <PageShell pageBreak={false}>
      {/* Top nav strip */}
      <div style={{ background: "#0D1B2A", height: "8px" }} />

      {/* Main cover body */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 64px",
          background: "linear-gradient(160deg, #ffffff 60%, #EEF2FF 100%)",
        }}
      >
        {/* Government seal placeholder */}
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            border: "4px solid #0D1B2A",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "32px",
            position: "relative",
            background: "white",
            boxShadow: "0 0 0 8px rgba(13,27,42,0.06)",
          }}
        >
          <div
            style={{
              width: "82px",
              height: "82px",
              borderRadius: "50%",
              border: "2px dashed #0D1B2A",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ marginBottom: "2px", color: "#0D1B2A", display: "flex" }}><Settings size={22} /></div>
            <div style={{ fontSize: "7px", fontWeight: 800, letterSpacing: "0.1em", color: "#0D1B2A", textAlign: "center", lineHeight: 1.2 }}>
              DELHI<br />GOVT.
            </div>
          </div>
        </div>

        {/* Title block */}
        <div
          style={{
            width: "1px",
            height: "40px",
            background: "linear-gradient(to bottom, transparent, #0F8B8D)",
            marginBottom: "20px",
          }}
        />

        <div
          style={{
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "0.35em",
            color: "#0F8B8D",
            textTransform: "uppercase",
            marginBottom: "14px",
            fontFamily: "monospace",
          }}
        >
          Official Government Report
        </div>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: 900,
            color: "#0D1B2A",
            textAlign: "center",
            letterSpacing: "0.06em",
            lineHeight: 1.2,
            margin: "0 0 12px",
            textTransform: "uppercase",
          }}
        >
          Air Quality<br />Intelligence Report
        </h1>

        <div
          style={{
            fontSize: "13px",
            color: "#4A6080",
            fontWeight: 500,
            textAlign: "center",
            marginBottom: "36px",
            letterSpacing: "0.02em",
          }}
        >
          Delhi Municipal Corporation — Air Quality Management Cell
        </div>

        {/* Separator */}
        <div
          style={{
            width: "60px",
            height: "3px",
            background: "linear-gradient(90deg, #0F8B8D, #0D1B2A)",
            borderRadius: "2px",
            marginBottom: "36px",
          }}
        />

        {/* Meta grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px 40px",
            width: "100%",
            maxWidth: "520px",
            background: "rgba(13,27,42,0.03)",
            border: "1px solid #E2E8F0",
            borderRadius: "14px",
            padding: "24px 32px",
          }}
        >
          {[
            { label: "Report Date",    value: dateStr },
            { label: "Report Period",  value: periodLabel },
            { label: "Report ID",      value: reportId },
            { label: "Generated By",   value: "AirGrid OS v2.0" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#8A9BB0", marginBottom: "4px" }}>
                {label}
              </div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#0D1B2A", fontFamily: label === "Report ID" ? "monospace" : "inherit" }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confidential footer bar */}
      <div
        style={{
          background: "#0D1B2A",
          padding: "12px 32px",
          textAlign: "center",
          fontSize: "10px",
          fontWeight: 800,
          letterSpacing: "0.25em",
          color: "rgba(255,255,255,0.75)",
          textTransform: "uppercase",
        }}
      >
        CONFIDENTIAL — FOR OFFICIAL USE ONLY
      </div>
    </PageShell>
  );

  // ── PAGE 2: EXECUTIVE SUMMARY ─────────────────────────────────────────────

  const ExecSummary = (
    <PageShell>
      <PageHeader />
      <div style={{ padding: "32px 40px", flex: 1, display: "flex", flexDirection: "column" }}>
        <SectionHeading number="01" title="EXECUTIVE SUMMARY" />

        {/* KPI grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          {[
            { label: "City AQI",         value: "187",       sub: "MODERATE-POOR", color: "#FF8C00",  bg: "#FFF7ED" },
            { label: "Wards Monitored",  value: "272",       sub: "Active sensors", color: "#0F8B8D",  bg: "#F0FDFA" },
            { label: "Active Alerts",    value: "11",        sub: "3 Critical · 5 Warning", color: "#C0392B", bg: "#FFF5F5" },
            { label: "Worst Ward",       value: "Shahdara",  sub: "AQI 267 — NH9 Corridor", color: "#C0392B", bg: "#FFF5F5" },
            { label: "Best Ward",        value: "Dwarka",    sub: "AQI 54 — Good", color: "#00C851",  bg: "#F0FFF4" },
            { label: "Avg PM2.5",        value: "89.4",      sub: "µg/m³ · 24h mean", color: "#8E44AD", bg: "#FAF5FF" },
          ].map(({ label, value, sub, color, bg }) => (
            <div
              key={label}
              style={{
                background: bg,
                border: `1px solid ${color}30`,
                borderTop: `3px solid ${color}`,
                borderRadius: "10px",
                padding: "14px 16px",
              }}
            >
              <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A9BB0", marginBottom: "6px" }}>
                {label}
              </div>
              <div style={{ fontSize: "22px", fontWeight: 900, color, fontFamily: "monospace", lineHeight: 1.1, marginBottom: "4px" }}>
                {value}
              </div>
              <div style={{ fontSize: "10px", color: "#4A6080", fontWeight: 500 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Auto-generated paragraph */}
        <div
          style={{
            background: "#F8FAFF",
            border: "1px solid #E2E8F0",
            borderLeft: "4px solid #0D1B2A",
            borderRadius: "0 10px 10px 0",
            padding: "20px 24px",
            marginBottom: "20px",
          }}
        >
          <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#0F8B8D", marginBottom: "10px" }}>
            Automated Data Summary
          </div>
          <p style={{ fontSize: "12px", lineHeight: 1.8, color: "#2D3748", margin: 0, textAlign: "justify" }}>
            On <strong>{dateStr}</strong>, Delhi's air quality remained in the <strong>MODERATE-POOR</strong> category
            with a city-wide AQI of <strong>187</strong> ({periodLabel}). A total of <strong>23 wards</strong> recorded
            AQI above 200 (Very Poor), primarily concentrated in East Delhi and North Delhi zones. The primary pollution
            sources identified were vehicular emissions (38%), construction dust (31%), and biomass burning (18%).
            The Graded Response Action Plan (GRAP) remains active at <strong>Stage II</strong>. Wind direction from
            the northwest at 6–9 km/h is limiting natural dispersion, especially in low-lying areas of Shahdara
            and Mustafabad. Sensor data from the WAQI ground array and Sentinel-5P satellite overlay corroborate
            the surface-level readings with high confidence (&gt;92%).
          </p>
        </div>

        {/* GRAP status */}
        <div style={{ display: "flex", gap: "10px" }}>
          {["Stage I", "Stage II", "Stage III", "Stage IV"].map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: "8px",
                textAlign: "center",
                background: i === 1 ? "#FEF3C7" : i < 1 ? "#F0FFF4" : "#F8FAFF",
                border: i === 1 ? "2px solid #F59E0B" : "1px solid #E2E8F0",
                fontSize: "11px",
                fontWeight: i === 1 ? 800 : 600,
                color: i === 1 ? "#92400E" : i < 1 ? "#166534" : "#CBD5E0",
              }}
            >
              {s}
              {i === 1 && <div style={{ fontSize: "9px", marginTop: "2px", fontWeight: 600, color: "#B45309" }}>ACTIVE</div>}
            </div>
          ))}
        </div>
      </div>
      <PageFooter page={2} reportId={reportId} />
    </PageShell>
  );

  // ── PAGE 3: ALERT LOG ─────────────────────────────────────────────────────

  const AlertLog = (
    <PageShell>
      <PageHeader />
      <div style={{ padding: "32px 40px", flex: 1, display: "flex", flexDirection: "column" }}>
        <SectionHeading number="02" title="ACTIVE ALERTS & INCIDENTS" />

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#0D1B2A", color: "white" }}>
              {["#", "Ward / Location", "Severity", "AQI", "Issue Identified", "Status"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 12px",
                    textAlign: h === "AQI" ? "center" : "left",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    borderRight: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALERTS.map((row, i) => (
              <tr
                key={row.num}
                style={{ background: i % 2 === 0 ? "white" : "#F8FAFF", borderBottom: "1px solid #E2E8F0" }}
              >
                <td style={{ padding: "9px 12px", fontFamily: "monospace", color: "#8A9BB0", fontWeight: 700, fontSize: "10px" }}>{row.num}</td>
                <td style={{ padding: "9px 12px", fontWeight: 600, color: "#0D1B2A" }}>{row.ward}</td>
                <td style={{ padding: "9px 12px" }}>
                  <span
                    style={{
                      ...severityStyle(row.severity),
                      borderRadius: "5px",
                      padding: "2px 8px",
                      fontSize: "9px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      display: "inline-block",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.severity}
                  </span>
                </td>
                <td style={{ padding: "9px 12px", textAlign: "center", fontFamily: "monospace", fontWeight: 800, color: row.aqi >= 200 ? "#C0392B" : row.aqi >= 151 ? "#E67E22" : "#0F8B8D" }}>
                  {row.aqi}
                </td>
                <td style={{ padding: "9px 12px", color: "#4A5568" }}>{row.issue}</td>
                <td style={{ padding: "9px 12px", ...statusStyle(row.status) }}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary chips */}
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          {[
            { label: "Critical", count: 3, color: "#C0392B", bg: "#FEE2E2" },
            { label: "Warning",  count: 5, color: "#B45309", bg: "#FEF3C7" },
            { label: "Info",     count: 3, color: "#1E40AF", bg: "#DBEAFE" },
          ].map(({ label, count, color, bg }) => (
            <div
              key={label}
              style={{
                flex: 1,
                background: bg,
                border: `1px solid ${color}40`,
                borderRadius: "8px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "22px", fontFamily: "monospace", fontWeight: 900, color }}>{count}</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label} Alerts</span>
            </div>
          ))}
        </div>
      </div>
      <PageFooter page={3} reportId={reportId} />
    </PageShell>
  );

  // ── PAGE 4: SOURCE ATTRIBUTION ────────────────────────────────────────────

  const SourceAttribution = (
    <PageShell>
      <PageHeader />
      <div style={{ padding: "32px 40px", flex: 1, display: "flex", flexDirection: "column" }}>
        <SectionHeading number="03" title="SOURCE ATTRIBUTION ANALYSIS" />

        {/* City-wide breakdown */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#4A5568", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            City-Wide Pollution Source Breakdown
          </div>

          {SOURCES.map((s) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
              <div style={{ width: "170px", fontSize: "11px", fontWeight: 600, color: "#1C2B3A", flexShrink: 0 }}>{s.name}</div>
              <div style={{ flex: 1, height: "18px", background: "#F1F5F9", borderRadius: "4px", overflow: "hidden", position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 0, top: 0, bottom: 0,
                    width: `${s.pct}%`,
                    background: s.color,
                    borderRadius: "4px",
                    opacity: 0.85,
                  }}
                />
              </div>
              <div style={{ width: "36px", fontFamily: "monospace", fontWeight: 800, color: s.color, fontSize: "12px", textAlign: "right", flexShrink: 0 }}>
                {s.pct}%
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "#E2E8F0", margin: "4px 0 24px" }} />

        {/* Per-ward breakdown */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#4A5568", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Top 3 Affected Wards — Source Attribution
          </div>

          {WARD_SOURCES.map((w) => (
            <div
              key={w.ward}
              style={{
                background: "#F8FAFF",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                padding: "14px 18px",
                marginBottom: "12px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#0D1B2A", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}><MapPin size={16} /> {w.ward}</div>
              {w.bars.map((b) => (
                <div key={b.l} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <div style={{ width: "100px", fontSize: "10px", fontWeight: 600, color: "#4A5568", flexShrink: 0 }}>{b.l}</div>
                  <div style={{ flex: 1, height: "12px", background: "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${b.p}%`, height: "100%", background: b.c, borderRadius: "3px", opacity: 0.8 }} />
                  </div>
                  <div style={{ width: "34px", fontFamily: "monospace", fontWeight: 800, color: b.c, fontSize: "11px", textAlign: "right", flexShrink: 0 }}>
                    {b.p}%
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <PageFooter page={4} reportId={reportId} />
    </PageShell>
  );

  // ── PAGE 5: RECOMMENDATIONS ───────────────────────────────────────────────

  const Recommendations = (
    <PageShell>
      <PageHeader />
      <div style={{ padding: "32px 40px", flex: 1, display: "flex", flexDirection: "column" }}>
        <SectionHeading number="04" title="RECOMMENDED ACTIONS" />

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#0D1B2A", color: "white" }}>
              {["Action", "Target Ward", "Expected ↓", "Effort", "Priority"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    borderRight: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACTIONS.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#F8FAFF", borderBottom: "1px solid #E2E8F0" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0D1B2A" }}>{row.action}</td>
                <td style={{ padding: "10px 12px", color: "#4A5568" }}>{row.ward}</td>
                <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700, color: "#166534" }}>{row.delta}</td>
                <td style={{ padding: "10px 12px", color: "#4A5568" }}>{row.effort}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span
                    style={{
                      ...priorityStyle(row.priority),
                      borderRadius: "5px",
                      padding: "2px 8px",
                      fontSize: "9px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      display: "inline-block",
                    }}
                  >
                    {row.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Implementation note */}
        <div
          style={{
            background: "#F0FDFA",
            border: "1px solid #99F6E4",
            borderLeft: "4px solid #0F8B8D",
            borderRadius: "0 10px 10px 0",
            padding: "14px 18px",
            marginTop: "20px",
            fontSize: "11px",
            color: "#134E4A",
            lineHeight: 1.7,
          }}
        >
          <strong>Implementation Note:</strong> Actions marked HIGH priority should be initiated within 24 hours.
          Field teams should coordinate with the Ward Officer before deployment. All outcomes must be logged
          in the AirGrid OS Incident Management System for post-action review.
        </div>
      </div>
      <PageFooter page={5} reportId={reportId} />
    </PageShell>
  );

  // ── PAGE 6: FOOTER / SIGN-OFF ─────────────────────────────────────────────

  const SignOff = (
    <PageShell>
      <PageHeader />
      <div style={{ padding: "32px 40px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <SectionHeading number="05" title="DATA SOURCES & CERTIFICATION" />

          {/* Data sources */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "28px" }}>
            {[
              { name: "WAQI Network",        desc: "Ground-level air quality sensors — 47 stations active",     icon: <Radio size={20} /> },
              { name: "OpenWeatherMap API",   desc: "Meteorological data — wind, temperature, humidity",         icon: <CloudSun size={20} /> },
              { name: "Ground Sensor Array",  desc: "Delhi Pollution Control Committee — real-time feeds",       icon: <Factory size={20} /> },
              { name: "Sentinel-5P Satellite", desc: "ESA satellite imagery — NO₂, SO₂, CO column data",        icon: <Satellite size={20} /> },
            ].map((s) => (
              <div
                key={s.name}
                style={{
                  background: "#F8FAFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ flexShrink: 0, color: "#0F8B8D" }}>{s.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, color: "#0D1B2A", fontSize: "12px", marginBottom: "3px" }}>{s.name}</div>
                  <div style={{ color: "#8A9BB0", fontSize: "10px", lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div
            style={{
              background: "#F8FAFF",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "16px 20px",
              marginBottom: "28px",
              fontSize: "11px",
              color: "#4A5568",
              lineHeight: 1.8,
            }}
          >
            <strong style={{ color: "#0D1B2A" }}>Queries & Escalations:</strong>{" "}
            airquality@mcdelhi.gov.in · Emergency Hotline: 1800-XXX-XXXX
            <br />
            <strong style={{ color: "#0D1B2A" }}>Next Automated Report:</strong>{" "}
            {tomorrowStr} at 06:00 IST
            <br />
            <strong style={{ color: "#0D1B2A" }}>Platform:</strong>{" "}
            AirGrid OS v2.0 · Air Quality Monitoring System · Delhi Municipal Corporation
          </div>
        </div>

        {/* Signature block */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
            {[
              { title: "Automated by AirGrid AI", sub: `Generated on ${today.toLocaleString("en-IN")}` },
              { title: "Chief Environmental Officer", sub: "Delhi Municipal Corporation" },
              { title: "Commissioner, DPCC", sub: "Delhi Pollution Control Committee" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", width: "200px" }}>
                <div style={{ height: "40px", borderBottom: "1px solid #0D1B2A", marginBottom: "8px" }} />
                <div style={{ fontWeight: 700, fontSize: "11px", color: "#0D1B2A" }}>{s.title}</div>
                <div style={{ fontSize: "10px", color: "#8A9BB0", marginTop: "2px" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Confidential banner */}
          <div
            style={{
              background: "#0D1B2A",
              borderRadius: "8px",
              padding: "12px",
              textAlign: "center",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.3em",
              color: "rgba(255,255,255,0.7)",
              textTransform: "uppercase",
            }}
          >
            CONFIDENTIAL — FOR OFFICIAL USE ONLY — DO NOT DISTRIBUTE WITHOUT AUTHORISATION
          </div>
        </div>
      </div>
      <PageFooter page={6} reportId={reportId} />
    </PageShell>
  );

  return (
    <div style={{ background: "#E8EAF0" }}>
      {CoverPage}
      {ExecSummary}
      {AlertLog}
      {SourceAttribution}
      {Recommendations}
      {SignOff}
    </div>
  );
}
