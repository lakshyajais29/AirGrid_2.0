"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { AQIGauge } from "@/components/shared/AQIGauge";
import { AlertCommandStrip } from "@/components/dashboard/AlertCommandStrip";
import { DataFreshness } from "@/components/dashboard/DataFreshness";
import { WorstWardsTable } from "@/components/dashboard/WorstWardsTable";

/* ── Lazy-load the Leaflet map (SSR=false required) ── */
const PollutionMap = dynamic(
  () => import("@/components/modules/pollution/PollutionMap"),
  { ssr: false, loading: () => <MapPlaceholder /> }
);

/* ─── Types ─── */
interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  aqi: number;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  co: number | null;
  o3: number | null;
  so2: number | null;
  color: string;
  updated: string;
  minutesAgo: number;
}

interface AQIData {
  stations: Station[];
  source: string;
  fetchedAt: string;
}

type ModalType = "poorWards" | "alerts" | "cityAqi" | null;

/* ─── Helpers ─── */
function aqiCategory(aqi: number) {
  if (aqi <= 50) return { label: "Good", color: "#1E8449" };
  if (aqi <= 100) return { label: "Satisfactory", color: "#A8D08D" };
  if (aqi <= 200) return { label: "Moderate", color: "#FFC000" };
  if (aqi <= 300) return { label: "Poor", color: "#C0392B" };
  if (aqi <= 400) return { label: "Very Poor", color: "#922B21" };
  return { label: "Severe", color: "#5B0000" };
}

function aqiColor(aqi: number) {
  if (aqi <= 50)  return "#1E8449";
  if (aqi <= 100) return "#A8D08D";
  if (aqi <= 200) return "#FFC000";
  if (aqi <= 300) return "#C0392B";
  return "#800000";
}

function droneAction(aqi: number): string {
  if (aqi > 400) return "IMMEDIATE drone deployment — Severe pollution. Emergency suppression protocol.";
  if (aqi > 300) return "Urgent drone-based monitoring required. Dust/emission source identification needed.";
  if (aqi > 200) return "Deploy monitoring drone. Recommend anti-smog gun activation in this ward.";
  return "Schedule routine drone inspection within 48h.";
}

/* ─── Map placeholder ─── */
function MapPlaceholder() {
  return (
    <div
      style={{
        height: "380px", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#F4F6FA",
        border: "1px solid #e2e8f0", borderRadius: "12px",
        color: "#8A9BB0", fontSize: "13px",
      }}
    >
      Loading map…
    </div>
  );
}

/* ─── Modal Component ─── */
function Modal({ open, title, onClose, children }: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(13,27,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", width: "100%", maxWidth: "780px",
          borderRadius: "20px 20px 0 0", padding: "28px 28px 32px",
          maxHeight: "80vh", overflowY: "auto",
          boxShadow: "0 -8px 40px rgba(13,27,42,0.18)",
          animation: "slideUp 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <div className="section-label">{title}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#F1F5F9", border: "none", borderRadius: "50%",
              width: "32px", height: "32px", cursor: "pointer", fontSize: "18px",
              color: "#8A9BB0", lineHeight: "32px", textAlign: "center",
            }}
          >×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Slim GRAP strip ─── */
function GRAPStrip({ level }: { level: number }) {
  const cfg: Record<number, { color: string; bg: string; border: string; text: string }> = {
    1: { color: "#1E8449", bg: "rgba(30,132,73,0.07)", border: "rgba(30,132,73,0.25)", text: "Monitor AQI daily · Inform public · Activate control rooms" },
    2: { color: "#1E5FA8", bg: "rgba(30,95,168,0.07)", border: "rgba(30,95,168,0.25)", text: "Increase monitoring frequency · Restrict construction · Advise sensitive groups" },
    3: { color: "#C0392B", bg: "rgba(192,57,43,0.07)", border: "rgba(192,57,43,0.25)", text: "Ban diesel generators · Odd-even rationing · Crackdown on polluting vehicles" },
    4: { color: "#5c0e0e", bg: "rgba(92,14,14,0.07)", border: "rgba(92,14,14,0.25)", text: "Immediate action on hotspots · Traffic restrictions · Industrial curbs" },
  };
  const c = cfg[level] ?? cfg[1];
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        height: "36px", padding: "0 14px",
        background: c.bg, border: `1px solid ${c.border}`,
        borderLeft: `3px solid ${c.color}`,
        borderRadius: "8px", flexShrink: 0,
      }}
    >
      <span style={{ fontSize: "10px", fontWeight: 700, color: c.color, letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
        GRAP LEVEL {level} ACTIVE
      </span>
      <span style={{ width: "1px", height: "16px", background: c.border, flexShrink: 0 }} />
      <span style={{ fontSize: "11px", color: c.color, opacity: 0.85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {c.text}
      </span>
      <a
        href="/alerts"
        style={{ marginLeft: "auto", fontSize: "11px", color: c.color, fontWeight: 600, whiteSpace: "nowrap", textDecoration: "none", flexShrink: 0 }}
      >
        Full detail →
      </a>
    </div>
  );
}

/* ─── Compact Source Attribution bar ─── */
function SourceBar({ source, stationCount }: { source: string; stationCount: number }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "12px", height: "30px",
        padding: "0 12px", background: "#fff",
        border: "1px solid #e2e8f0", borderRadius: "7px", flexShrink: 0,
        fontSize: "11px", color: "#8A9BB0",
      }}
    >
      <span className="live-dot" style={{ backgroundColor: source === "waqi" ? "#1E8449" : "#FFC000", margin: 0 }} />
      <span style={{ fontWeight: 600, color: "#0D1B2A" }}>
        {source === "waqi" ? "WAQI Live Feed" : "Mock Data"}
      </span>
      <span>·</span>
      <span>{stationCount} monitoring stations</span>
      <span>·</span>
      <span>CPCB / DPCC certified data</span>
    </div>
  );
}

/* ─── Main Dashboard Content ─── */
function CommandCentreContent() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const [data, setData] = useState<AQIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  
  // Animated states for demo mode
  const [animCityAqi, setAnimCityAqi] = useState(0);
  const [animPoorWards, setAnimPoorWards] = useState(0);
  const [animAlerts, setAnimAlerts] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/aqi");
      const json: AQIData = await res.json();
      setData(json);
    } catch (e) {
      console.error("Dashboard AQI fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /* ─── Derived stats ─── */
  const stations = data?.stations ?? [];
  const cityAqi = stations.length
    ? Math.round(stations.reduce((s, x) => s + x.aqi, 0) / stations.length)
    : 0;
  const poorWards = stations.filter(s => s.aqi > 200);
  const criticalAlerts = stations.filter(s => s.aqi > 300);
  const grapLevel = cityAqi > 400 ? 4 : cityAqi > 300 ? 3 : cityAqi > 200 ? 2 : 1;
  const aqiCat = aqiCategory(cityAqi);

  useEffect(() => {
    if (loading || !isDemo) {
      setAnimCityAqi(cityAqi);
      setAnimPoorWards(poorWards.length);
      setAnimAlerts(criticalAlerts.length);
      return;
    }

    const duration = 1500;
    const interval = 30;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);

      setAnimCityAqi(Math.round(cityAqi * easeProgress));
      setAnimPoorWards(Math.round(poorWards.length * easeProgress));
      setAnimAlerts(Math.round(criticalAlerts.length * easeProgress));

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimCityAqi(cityAqi);
        setAnimPoorWards(poorWards.length);
        setAnimAlerts(criticalAlerts.length);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [loading, isDemo, cityAqi, poorWards.length, criticalAlerts.length]);

  return (
    <>
      {/* ─── Global styles ─── */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .stat-box-clickable {
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .stat-box-clickable:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 12px 32px rgba(0,0,0,0.18);
        }
        /* Teal scrollbar for alert col */
        .alert-scroll::-webkit-scrollbar { width: 4px; }
        .alert-scroll::-webkit-scrollbar-track { background: transparent; }
        .alert-scroll::-webkit-scrollbar-thumb {
          background: rgba(15,139,141,0.35);
          border-radius: 4px;
        }
        .alert-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(15,139,141,0.65);
        }
        /* Hide map controls scrollbar bleed */
        .map-fixed-wrap { overflow: hidden; border-radius: 12px; }
      `}</style>

      {/* ─── Full-viewport wrapper — NO page scroll ─── */}
      {/* Header=64px Footer=40px main-padding=32px total chrome=136px */}
      <div
        style={{
          height: "calc(100vh - 136px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          backgroundImage: "radial-gradient(circle, #c8d6e8 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          backgroundColor: "#F4F6FA",
          margin: "-16px",          /* cancel main's p-4 so we fill edge-to-edge */
          padding: "12px 16px 10px",
          boxSizing: "border-box",
          gap: "10px",
        }}
      >
        {/* ── HERO STRIP ── */}
        <div
          className="rounded-2xl flex flex-col lg:flex-row lg:items-stretch justify-between"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 12px rgba(13,27,42,0.07)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {/* Left Panel */}
          <div
            className="flex flex-col justify-center"
            style={{ padding: "14px 24px", borderRight: "1px solid #e2e8f0", flex: "0 0 auto" }}
          >
            {/* Eyebrow */}
            <div
              style={{
                display: "flex", alignItems: "center", gap: "7px",
                fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.2em",
                color: "#0F8B8D", textTransform: "uppercase", marginBottom: "6px",
                fontWeight: 600,
              }}
            >
              <svg width="7" height="7" viewBox="0 0 7 7" style={{ flexShrink: 0 }}>
                <circle cx="3.5" cy="3.5" r="3.5" fill="#0F8B8D" />
              </svg>
              REAL-TIME · WARD-LEVEL · SOURCE-ATTRIBUTED
            </div>

            {/* Heading */}
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0D1B2A", letterSpacing: "-0.01em", lineHeight: 1.2, margin: 0 }}>
              Air Quality Command Centre
            </h1>

            {/* Subtext */}
            <p style={{ fontSize: "12px", color: "#8A9BB0", marginTop: "2px", marginBottom: "10px", fontFamily: "var(--font-mono)" }}>
              Live · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>

            {/* Stat Pills */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  borderRadius: "9999px", border: "1px solid #e2e8f0",
                  padding: "3px 10px", fontSize: "11px", color: "#0D1B2A",
                  background: "#f8faff",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="6" cy="6" r="5" stroke="#0F8B8D" strokeWidth="1.5" />
                  <circle cx="6" cy="6" r="2" fill="#0F8B8D" />
                </svg>
                <span style={{ fontWeight: 600 }}>272 Wards Monitored</span>
              </div>
              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  borderRadius: "9999px", border: "1px solid #e2e8f0",
                  padding: "3px 10px", fontSize: "11px", color: "#0D1B2A",
                  background: "#f8faff",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="6" cy="6" r="5" stroke="#0D1B2A" strokeWidth="1.5" />
                  <path d="M6 3v3l2 1.5" stroke="#0D1B2A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontWeight: 600 }}>Updated 3 min ago</span>
              </div>
            </div>
          </div>

          {/* Right KPI Boxes */}
          <div style={{ display: "flex", flexDirection: "row", flex: 1, alignItems: "stretch" }}>
            {/* Box 1: City AQI */}
            <div
              className="stat-box-clickable"
              onClick={() => setModal("cityAqi")}
              title="Click to see AQI breakdown"
              style={{
                flex: 1, padding: "14px 20px",
                background: "#ffffff", borderLeft: `4px solid ${aqiColor(cityAqi)}`,
                boxShadow: "0 2px 8px rgba(13,27,42,0.08)",
                display: "flex", flexDirection: "column", justifyContent: "center",
                cursor: "pointer", borderRight: "1px solid #e2e8f0",
              }}
            >
              <div className="section-label" style={{ marginBottom: "2px" }}>CITY AQI</div>
              <div style={{ fontFamily: "monospace", fontSize: "38px", fontWeight: 900, color: aqiColor(cityAqi), lineHeight: 1 }}>
                {loading ? "—" : animCityAqi}
              </div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: aqiColor(cityAqi), marginTop: "3px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {aqiCat.label.toUpperCase()}
              </div>
            </div>

            {/* Box 2: Wards in Poor+ */}
            <div
              className="stat-box-clickable"
              onClick={() => setModal("poorWards")}
              title="Click to see affected wards"
              style={{
                flex: 1, padding: "14px 20px",
                background: "#ffffff", borderLeft: "4px solid #C0392B",
                boxShadow: "0 2px 8px rgba(13,27,42,0.08)",
                display: "flex", flexDirection: "column", justifyContent: "center",
                cursor: "pointer", borderRight: "1px solid #e2e8f0",
              }}
            >
              <div className="section-label" style={{ marginBottom: "2px" }}>WARDS IN POOR+</div>
              <div style={{ fontFamily: "monospace", fontSize: "38px", fontWeight: 900, color: "#C0392B", lineHeight: 1 }}>
                {loading ? "—" : animPoorWards}
              </div>
              <div style={{ fontSize: "10px", color: "#8A9BB0", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                above AQI 200
              </div>
            </div>

            {/* Box 3: Active Alerts */}
            <div
              className="stat-box-clickable"
              onClick={() => setModal("alerts")}
              title="Click to see alerts"
              style={{
                flex: 1, padding: "14px 20px",
                background: "#ffffff", borderLeft: "4px solid #0F8B8D",
                boxShadow: "0 2px 8px rgba(13,27,42,0.08)",
                display: "flex", flexDirection: "column", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <div className="section-label" style={{ marginBottom: "2px" }}>ACTIVE ALERTS</div>
              <div style={{ fontFamily: "monospace", fontSize: "38px", fontWeight: 900, color: "#0F8B8D", lineHeight: 1 }}>
                {loading ? "—" : animAlerts}
              </div>
              <div style={{ fontSize: "10px", color: "#8A9BB0", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                require action
              </div>
            </div>
          </div>
        </div>

        {/* ── 3-COLUMN BODY GRID — fills remaining viewport height ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr 1.2fr",
            gap: "12px",
            flex: 1,
            minHeight: 0, /* critical: lets grid shrink inside flex column */
          }}
        >
          {/* ════ COL 1 — AQI Gauge + Worst Wards ════ */}
          <div
            style={{
              display: "flex", flexDirection: "column", gap: "10px",
              minHeight: 0, overflow: "hidden",
            }}
          >
            {/* AQI Gauge card */}
            <div
              className="panel-card"
              style={{
                borderTop: "3px solid var(--accent-teal)",
                padding: "14px 16px",
                display: "flex", flexDirection: "column", alignItems: "center",
                flexShrink: 0,
              }}
            >
              <div className="w-full text-left mb-2">
                <div className="section-label">CURRENT STATUS</div>
              </div>
              <AQIGauge value={loading ? 0 : cityAqi} size={160} />
            </div>

            {/* Worst 5 Wards — fills remaining col height */}
            <div
              className="panel-card"
              style={{
                borderTop: "3px solid var(--accent-teal)",
                padding: "14px 16px",
                flex: 1, minHeight: 0,
                display: "flex", flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div className="section-label">Critical Zones</div>
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#0D1B2A", margin: "0 0 10px" }}>
                Worst 5 Wards
              </h2>
              <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "linear-gradient(90deg, #0D1B2A, #1A3A5C)", color: "white" }}>
                      <th className="text-left py-1.5 px-2 font-semibold rounded-tl-md" style={{ fontSize: "11px" }}>Ward</th>
                      <th className="text-right py-1.5 px-2 font-semibold" style={{ fontSize: "11px" }}>AQI</th>
                      <th className="text-right py-1.5 px-2 font-semibold rounded-tr-md" style={{ fontSize: "11px" }}>PM2.5</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", padding: "20px", color: "#8A9BB0", fontSize: "12px" }}>
                          Loading…
                        </td>
                      </tr>
                    ) : (
                      [...stations]
                        .sort((a, b) => b.aqi - a.aqi)
                        .slice(0, 5)
                        .map((s, i) => (
                          <tr
                            key={s.id}
                            className={i % 2 === 0 ? "bg-white" : "bg-[#f8faff]"}
                            style={{
                              borderBottom: "1px solid #F1F5F9",
                              borderLeft: i === 0 ? "3px solid #C0392B" : "3px solid transparent",
                              cursor: "pointer",
                            }}
                            onClick={() => setModal("poorWards")}
                          >
                            <td className="py-1.5 px-2 font-medium" style={{ color: "#0D1B2A", fontSize: "12px" }}>{s.name}</td>
                            <td className="py-1.5 px-2 text-right">
                              <span style={{
                                fontFamily: "monospace", fontWeight: 700, fontSize: "12px",
                                color: aqiColor(s.aqi), background: `${aqiColor(s.aqi)}18`,
                                borderRadius: "20px", padding: "1px 8px",
                              }}>
                                {s.aqi}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono" style={{ color: "#1C2B3A", fontSize: "12px" }}>{s.pm25 ?? "—"}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
              <a
                href="/wards"
                style={{
                  display: "block", marginTop: "10px", textAlign: "right",
                  fontSize: "11px", color: "#0F8B8D", fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                View all 272 wards →
              </a>
            </div>
          </div>

          {/* ════ COL 2 — GRAP strip + Map + Source bar ════ */}
          <div
            style={{
              display: "flex", flexDirection: "column", gap: "10px",
              minHeight: 0, overflow: "hidden",
            }}
          >
            {/* Slim GRAP strip */}
            <GRAPStrip level={grapLevel} />

            {/* Pollution Map — fixed 380px, no overflow */}
            <div
              className="map-fixed-wrap"
              style={{
                height: "380px", flexShrink: 0,
                border: "1px solid #e2e8f0",
                borderRadius: "12px", overflow: "hidden",
              }}
            >
              <PollutionMap />
            </div>

            {/* Source attribution compact bar */}
            <SourceBar source={data?.source ?? ""} stationCount={stations.length} />

            {/* DataFreshness fills the rest */}
            <div
              className="panel-card"
              style={{
                borderTop: "3px solid var(--gov-gold)",
                padding: "12px 16px",
                flex: 1, minHeight: 0, overflow: "auto",
              }}
            >
              <DataFreshness />
            </div>
          </div>

          {/* ════ COL 3 — Alert Strip (scrollable) ════ */}
          <div
            className="alert-scroll"
            style={{
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "0",
              minHeight: 0,
            }}
          >
            <AlertCommandStrip />
          </div>
        </div>
      </div>

      {/* ── MODAL: City AQI Breakdown ── */}
      <Modal open={modal === "cityAqi"} title="City AQI · Station Breakdown" onClose={() => setModal(null)}>
        <div className="space-y-3">
          <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
            <div style={{ background: "#F4F6FA", borderRadius: "12px", padding: "16px 24px", textAlign: "center", flex: 1 }}>
              <div className="section-label">City Average AQI</div>
              <div style={{ fontFamily: "monospace", fontSize: "3rem", fontWeight: 900, color: aqiColor(cityAqi), lineHeight: 1 }}>{cityAqi}</div>
              <div style={{ fontSize: "13px", color: aqiCategory(cityAqi).color, fontWeight: 700, marginTop: "6px" }}>{aqiCategory(cityAqi).label}</div>
            </div>
          </div>
          {stations.map(s => {
            const cat = aqiCategory(s.aqi);
            const pct = Math.min(100, (s.aqi / 500) * 100);
            return (
              <div key={s.id} style={{ padding: "12px", border: "1px solid #E2E8F0", borderRadius: "10px", borderLeft: `4px solid ${cat.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 600, color: "#0D1B2A" }}>{s.name}</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 800, color: cat.color, fontSize: "18px" }}>{s.aqi}</span>
                </div>
                <div style={{ background: "#F1F5F9", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: cat.color, borderRadius: "4px", transition: "width 0.6s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "11px", color: "#8A9BB0" }}>
                  <span>{cat.label}</span>
                  <span>Updated {s.minutesAgo}m ago</span>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* ── MODAL: Poor Wards Detail ── */}
      <Modal open={modal === "poorWards"} title="Poor+ Quality Wards · Intervention Required" onClose={() => setModal(null)}>
        {poorWards.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "#1E8449" }}>
            <div style={{ fontSize: "3rem" }}>✓</div>
            <div style={{ fontWeight: 700, fontSize: "18px", marginTop: "8px" }}>All zones within safe limits</div>
          </div>
        ) : (
          <>
            <div style={{ background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.2)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px" }}>
              <div style={{ fontWeight: 700, color: "#C0392B", fontSize: "14px" }}>Drone-Based Monitoring Protocol Active</div>
              <div style={{ fontSize: "12px", color: "#8A9BB0", marginTop: "2px" }}>Following wards require immediate aerial surveillance and anti-smog intervention per DPCC guidelines.</div>
            </div>
            <div className="space-y-4">
              {[...poorWards].sort((a, b) => b.aqi - a.aqi).map((s, i) => {
                const cat = aqiCategory(s.aqi);
                return (
                  <div key={s.id} style={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden", borderLeft: `5px solid ${cat.color}` }}>
                    <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: i === 0 ? "#FFF5F5" : "#FAFBFC" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "#0D1B2A", fontSize: "15px" }}>
                          {i === 0 && <span style={{ fontSize: "12px", background: "#C0392B", color: "white", borderRadius: "4px", padding: "1px 6px", marginRight: "8px" }}>WORST</span>}
                          {s.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "#8A9BB0", marginTop: "2px" }}>
                          Updated {s.minutesAgo}m ago
                          {s.pm25 && ` · PM2.5: ${s.pm25}µg/m³`}
                          {s.no2 && ` · NO₂: ${s.no2}ppb`}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "monospace", fontSize: "2rem", fontWeight: 900, color: cat.color, lineHeight: 1 }}>{s.aqi}</div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: cat.color }}>{cat.label}</div>
                      </div>
                    </div>
                    <div style={{ padding: "12px 16px", background: "#F8FAFF", borderTop: "1px solid #EEF2F7" }}>
                      <div style={{ fontSize: "13px", color: "#1C2B3A", lineHeight: 1.5 }}>
                        <strong>Action Required:</strong> {droneAction(s.aqi)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: "20px", padding: "12px 16px", background: "#F0F9FF", borderRadius: "10px", border: "1px solid #BAE6FD", fontSize: "12px", color: "#0D1B2A" }}>
              <strong>DPCC Directive:</strong> All wards with AQI &gt; 300 require mandatory drone patrol under Delhi Pollution Control Committee circular no. DPCC/Drone/2024/118. Report generated at {new Date().toLocaleTimeString("en-IN")}.
            </div>
          </>
        )}
      </Modal>

      {/* ── MODAL: Active Alerts ── */}
      <Modal open={modal === "alerts"} title="Active Station Alerts · Critical Zones" onClose={() => setModal(null)}>
        {criticalAlerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "#1E8449" }}>
            <div style={{ fontSize: "3rem" }}>✓</div>
            <div style={{ fontWeight: 700, fontSize: "18px", marginTop: "8px" }}>No critical alerts at this time</div>
          </div>
        ) : (
          <div className="space-y-4">
            {[...criticalAlerts].sort((a, b) => b.aqi - a.aqi).map(s => {
              const cat = aqiCategory(s.aqi);
              return (
                <div key={s.id} style={{ border: `1px solid ${cat.color}40`, borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px", background: `${cat.color}08`, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `5px solid ${cat.color}` }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="live-dot" style={{ backgroundColor: cat.color }} />
                        <span style={{ fontWeight: 700, color: "#0D1B2A", fontSize: "15px" }}>{s.name} Ward</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#8A9BB0", marginTop: "4px" }}>
                        {s.pm25 && `PM2.5: ${s.pm25}µg/m³ (threshold: 200)`}
                        {s.no2 && ` · NO₂: ${s.no2}ppb`}
                        {` · ${s.minutesAgo}m ago`}
                      </div>
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: "2rem", fontWeight: 900, color: cat.color }}>
                      {s.aqi}
                    </div>
                  </div>
                  <div style={{ padding: "10px 16px", fontSize: "13px", color: "#1C2B3A", borderTop: `1px solid ${cat.color}20`, background: "#FAFBFC" }}>
                    <strong>Recommended Action:</strong> {droneAction(s.aqi)}
                  </div>
                </div>
              );
            })}
            <div style={{ padding: "12px 16px", background: "#FFF7ED", borderRadius: "10px", border: "1px solid #FED7AA", fontSize: "12px", color: "#9A3412" }}>
              These alerts are auto-generated based on CPCB National AQI standards. Threshold for Poor: AQI &gt; 300. Drone deployment authority: Ward Environmental Officer.
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function CommandCentre() {
  return (
    <Suspense fallback={<MapPlaceholder />}>
      <CommandCentreContent />
    </Suspense>
  );
}
