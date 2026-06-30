"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { AQIGauge } from "@/components/shared/AQIGauge";
import { AlertCommandStrip } from "@/components/dashboard/AlertCommandStrip";
import { WorstWardsTable } from "@/components/dashboard/WorstWardsTable";
import { IncidentDrawer, type IncidentData } from "@/components/dashboard/IncidentDrawer";
import { EnforcementTimeline } from "@/components/dashboard/EnforcementTimeline";
import { Info, MapPin, X } from "lucide-react";
import LoadingScreen from "@/components/layout/LoadingScreen";

const PollutionMap = dynamic(
  () => import("@/components/modules/pollution/PollutionMap"),
  { ssr: false, loading: () => <MapSkeleton /> }
);

/* ─── Types ─── */
interface Station {
  id:         string;
  name:       string;
  lat:        number;
  lng:        number;
  aqi:        number;
  pm25:       number | null;
  pm10:       number | null;
  no2:        number | null;
  co:         number | null;
  o3:         number | null;
  so2:        number | null;
  color:      string;
  updated:    string;
  minutesAgo: number;
}
interface AQIData { stations: Station[]; source: string; fetchedAt: string; }

/* ─── GRAP config ─── */
const GRAP_CFG: Record<number, { color: string; bg: string; border: string; text: string }> = {
  1: { color: "#166534", bg: "#F0FDF4", border: "#86EFAC", text: "Monitor AQI daily · Activate control rooms · Inform public" },
  2: { color: "#92400E", bg: "#FFFBEB", border: "#FDE68A", text: "Restrict construction waste · Increase monitoring · Advise sensitive groups" },
  3: { color: "#9A3412", bg: "#FFF7ED", border: "#FDBA74", text: "Emergency measures active · Heavy vehicles restricted · Construction banned 6PM–6AM" },
  4: { color: "#7F1D1D", bg: "#FEF2F2", border: "#FCA5A5", text: "IMMEDIATE ACTION · Traffic restrictions · Industrial curbs · Deploy drones NOW" },
};

function aqiColor(aqi: number) {
  if (aqi <= 50)  return "#55A84F";
  if (aqi <= 100) return "#A3C853";
  if (aqi <= 200) return "#FFC000";
  if (aqi <= 300) return "#F29C33";
  if (aqi <= 400) return "#E93F33";
  return "#AF2D24";
}
function aqiCategory(aqi: number) {
  if (aqi <= 50)  return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 200) return "Moderate";
  if (aqi <= 300) return "Poor";
  if (aqi <= 400) return "Very Poor";
  return "Severe";
}

/* ─── Inline sparkline SVG ─── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const rng = max - min || 1;
  const W = 72, H = 22;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / rng) * (H - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = data[data.length - 1];
  const ly   = H - ((last - min) / rng) * (H - 4) - 2;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${H} ${pts} ${W},${H}`}
        fill={`url(#sg-${color.replace("#", "")})`}
        stroke="none"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={W} cy={ly} r="2.5" fill={color} />
    </svg>
  );
}

/* ─── Skeleton cards ─── */
function SkeletonKPI() {
  return (
    <div style={{
      background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "12px 16px",
      borderLeft: "3px solid var(--border-faint)", boxShadow: "var(--shadow-card)", overflow: "hidden",
    }}>
      <div style={{ height: "9px", width: "60%",  background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.3s linear infinite", borderRadius: "4px", marginBottom: "8px" }} />
      <div style={{ height: "24px", width: "45%", background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.3s linear infinite", borderRadius: "4px", marginBottom: "6px" }} />
      <div style={{ height: "9px", width: "40%",  background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.3s linear infinite", borderRadius: "4px" }} />
    </div>
  );
}

/* ─── Map skeleton ─── */
function MapSkeleton() {
  return (
    <div style={{
      height: "100%", minHeight: "200px",
      background: "linear-gradient(110deg, #e8ecf4 30%, #dde3ee 50%, #e8ecf4 70%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s linear infinite",
      borderRadius: "inherit",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ color: "var(--text-muted)", fontSize: "12px", fontFamily: "monospace", letterSpacing: "0.12em" }}>
        LOADING MAP…
      </span>
    </div>
  );
}


/* ─── Modal ─── */
function Modal({ open, title, onClose, children }: {
  open: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!open) return null;
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(13,27,42,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--surface)", width: "100%", maxWidth: "820px",
          borderRadius: "20px 20px 0 0", padding: "28px 28px 32px",
          maxHeight: "80vh", overflowY: "auto",
          boxShadow: "0 -8px 40px rgba(13,27,42,0.18)",
          animation: "slideUp 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>{title}</span>
          <button onClick={onClose} style={{ background: "var(--surface-alt)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "18px", color: "var(--text-muted)", lineHeight: "32px", textAlign: "center" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Mock 7-day sparkline history ─── */
const SPARK_HISTORY = {
  cityAqi:   [162, 178, 191, 183, 207, 195, 188],
  poorWards: [2,   4,   5,   5,   6,   7,   5  ],
  alerts:    [1,   2,   3,   4,   5,   4,   3  ],
  drones:    [1,   1,   2,   2,   2,   2,   2  ],
};

/* ─── Dashboard ─── */
function CommandCentreContent({ splashDelay = 0 }: { splashDelay?: number }) {
  useSearchParams();

  const [data,    setData]    = useState<AQIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<KpiId | null>(null);
  const [incident, setIncident] = useState<IncidentData | null>(null);
  const [grapDismissed, setGrapDismissed] = useState(false);

  const [animAqi,       setAnimAqi]       = useState(0);
  const [animPoorWards, setAnimPoorWards] = useState(0);
  const [animAlerts,    setAnimAlerts]    = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res  = await fetch("/api/aqi");
      const json: AQIData = await res.json();
      setData(json);
    } catch (e) { console.error("Dashboard fetch error:", e); }
    finally    { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 60_000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const stations   = data?.stations ?? [];
  const cityAqi    = stations.length ? Math.round(stations.reduce((s, x) => s + x.aqi, 0) / stations.length) : 188;
  const poorWards  = stations.filter(s => s.aqi > 200);
  const critAlerts = stations.filter(s => s.aqi > 300);
  const grapLevel  = cityAqi > 400 ? 4 : cityAqi > 300 ? 3 : cityAqi > 200 ? 2 : 1;
  const grap       = GRAP_CFG[grapLevel];

  /* Animated counters */
  useEffect(() => {
    if (loading) {
      setAnimAqi(cityAqi); setAnimPoorWards(poorWards.length); setAnimAlerts(critAlerts.length);
      return;
    }
    const dur = 1400, step = 28, steps = dur / step;
    let cur = 0;
    const t = setInterval(() => {
      cur++;
      const p = 1 - Math.pow(1 - cur / steps, 4);
      setAnimAqi(Math.round(cityAqi * p));
      setAnimPoorWards(Math.round(poorWards.length * p));
      setAnimAlerts(Math.round(critAlerts.length * p));
      if (cur >= steps) {
        clearInterval(t);
        setAnimAqi(cityAqi); setAnimPoorWards(poorWards.length); setAnimAlerts(critAlerts.length);
      }
    }, step);
    return () => clearInterval(t);
  }, [loading, cityAqi, poorWards.length, critAlerts.length]);

  const spark = {
    cityAqi:   [...SPARK_HISTORY.cityAqi.slice(0, 6),   loading ? 188 : cityAqi        ],
    poorWards: [...SPARK_HISTORY.poorWards.slice(0, 6), loading ? 5   : poorWards.length],
    alerts:    [...SPARK_HISTORY.alerts.slice(0, 6),    loading ? 3   : critAlerts.length],
    drones:    [...SPARK_HISTORY.drones],
  };

  const handleStationClick = useCallback((station: Station) => {
    setIncident({
      ward:       station.name,
      zone:       "Delhi",
      aqi:        station.aqi,
      pm25:       station.pm25 ?? 0,
      pm10:       station.pm10 ?? 0,
      no2:        station.no2  ?? 0,
      source:     "Vehicular",
      confidence: 78,
      delta:      +12,
      lat:        station.lat,
      lng:        station.lng,
    });
  }, []);

  type KpiId = "cityAqi" | "poorWards" | "alerts" | "drones";
  const kpis: Array<{
    id:       KpiId | null;
    label:    string;
    value:    string | number;
    sub:      string;
    change:   string;
    color:    string;
    sparkKey: keyof typeof spark;
  }> = [
    { id: "cityAqi",   label: "City AQI",        value: loading ? "—" : animAqi,       sub: aqiCategory(cityAqi).toUpperCase(), change: "↑ 12 vs 06:00 AM",  color: aqiColor(cityAqi), sparkKey: "cityAqi"   },
    { id: "poorWards", label: "Wards in Poor+",   value: loading ? "—" : animPoorWards, sub: "Above AQI 200",                    change: "↔ 0 change",         color: "#DC2626",         sparkKey: "poorWards" },
    { id: "alerts",    label: "Active Alerts",     value: loading ? "—" : animAlerts,   sub: "Require action",                   change: "↔ 0 change",         color: "#D97706",         sparkKey: "alerts"    },
    { id: null,        label: "Active Drones",     value: 0,                            sub: "Deployed",                         change: "↔ 0 change",         color: "#4F46E5",         sparkKey: "drones"    },
  ];

  // Only stagger on first load (behind splash); return visits use template's pageEnter
  const ca = (stagger = 0): React.CSSProperties => splashDelay > 0
    ? { animation: `cardEnter 0.5s cubic-bezier(0.22,1,0.36,1) ${splashDelay + stagger}ms both` }
    : {};

  return (
    <>
      <style>{`
        @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes slideUp  { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>

      <div style={{
        flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
        backgroundColor: "var(--page-bg)", padding: "14px 20px 16px",
        gap: "12px", boxSizing: "border-box", overflow: "hidden",
      }}>

        {/* ── PAGE HEADER: title + GRAP banner ── */}
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0, gap: "20px", minHeight: "40px", ...ca(0) }}>
          <div style={{ flexShrink: 0 }}>
            <h1 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.01em" }}>
              Command Centre
            </h1>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "2px 0 0", fontFamily: "var(--font-mono)" }}>
              NCT Delhi · {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>

          {!grapDismissed && (
            <div style={{
              flex: 1,
              display: "flex", alignItems: "center", gap: "8px",
              padding: "0 12px 0 14px", height: "38px", borderRadius: "8px",
              background: grap.bg,
              border: `1px solid ${grap.border}`,
              borderLeft: `3px solid ${grap.color}`,
            }}>
              <Info size={14} color={grap.color} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: grap.color, whiteSpace: "nowrap" }}>
                GRAP {grapLevel} ACTIVE
              </span>
              <span style={{ fontSize: "11px", color: grap.color, opacity: 0.65 }}>·</span>
              <span style={{ fontSize: "11px", color: grap.color, opacity: 0.85, flex: 1 }}>
                {grap.text}
              </span>
              <button
                onClick={() => setGrapDismissed(true)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: grap.color, opacity: 0.55, padding: "2px", display: "flex",
                  alignItems: "center", flexShrink: 0,
                }}
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        {/* ── KPI STRIP: 4 cards with sparklines ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", flexShrink: 0, ...ca(80) }}>
          {kpis.map(kpi => (
            loading ? <SkeletonKPI key={kpi.label} /> : (
              <div
                key={kpi.label}
                className={kpi.id ? "stat-box-clickable" : ""}
                onClick={() => kpi.id && setModal(kpi.id)}
                style={{
                  background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "10px 14px",
                  borderLeft: `3px solid ${kpi.color}`,
                  boxShadow: "var(--shadow-card)", cursor: kpi.id ? "pointer" : "default",
                }}
              >
                <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>
                  {kpi.label}
                </span>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "26px", fontWeight: 800, fontFamily: "var(--font-mono)", color: kpi.color, lineHeight: 1, display: "block" }}>
                      {kpi.value}
                    </span>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>
                      {kpi.sub}
                    </span>
                  </div>
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px", paddingBottom: "1px" }}>
                    <Sparkline data={spark[kpi.sparkKey]} color={kpi.color} />
                    <span style={{ fontSize: "9px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {kpi.change}
                    </span>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>

        {/* ── MAIN GRID: left | map | right ── */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 300px", gap: "12px", flex: 1, minHeight: 0 }}>

          {/* COL 1: Gauge + Drones + Critical Zones */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", minHeight: 0, ...ca(160) }}>

            {/* Current Status — AQI Gauge */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "12px 14px", boxShadow: "var(--shadow-card)", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", alignSelf: "flex-start", marginBottom: "6px" }}>
                Current Status
              </span>
              <AQIGauge value={loading ? 0 : cityAqi} size={148} />
            </div>

            {/* Critical Zones — top 5, flex-fills remaining height, internally scrollable */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", overflow: "hidden", flex: 1, minHeight: 0 }}>
              <div style={{ padding: "10px 14px 5px", flexShrink: 0 }}>
                <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Critical Zones (Top 5)
                </span>
              </div>
              <div style={{ overflowY: "auto", flex: 1, minHeight: 0, scrollbarWidth: "thin", scrollbarColor: "#E2E8F0 transparent" }}>
                <WorstWardsTable onSelect={setIncident} />
              </div>
              <a href="/wards" style={{ padding: "7px 14px", borderTop: "1px solid var(--border-faint)", fontSize: "11px", color: "var(--accent)", textAlign: "right", flexShrink: 0, textDecoration: "none", display: "block", fontWeight: 500 }}>
                View all 272 wards →
              </a>
            </div>
          </div>

          {/* COL 2: Map + source bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", minHeight: 0, ...ca(210) }}>
            <div style={{ background: "var(--page-bg)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
              <PollutionMap compact={true} onStationClick={handleStationClick} />
            </div>
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "7px 14px", boxShadow: "var(--shadow-card)", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, height: "34px" }}>
              <span className="live-dot" style={{ width: "6px", height: "6px", margin: 0, flexShrink: 0 }} />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)" }}>WAQI Live</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                · {stations.length || "—"} stations · CPCB / DPCC
              </span>
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={10} color="#9CA3AF" />
                <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>28.6139°N 77.2090°E</span>
              </span>
            </div>
          </div>

          {/* COL 3: Active Alerts + Enforcement Timeline */}
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", overflow: "hidden", ...ca(260) }}>

            {/* Alert header */}
            <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid var(--border-faint)", flexShrink: 0 }}>
              <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "7px" }}>
                Active Alerts
              </span>
              <div style={{ display: "flex", gap: "5px" }}>
                {[
                  { label: `${critAlerts.length} Critical`, color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5" },
                  { label: `${Math.max(0, poorWards.length - critAlerts.length)} Warning`, color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
                ].map(p => (
                  <span key={p.label} style={{ fontSize: "10px", fontWeight: 700, color: p.color, background: p.bg, borderRadius: "20px", padding: "2px 8px", border: `1px solid ${p.border}` }}>
                    {p.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Scrollable alert list — fills remaining height */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 10px", scrollbarWidth: "thin", scrollbarColor: "#E2E8F0 transparent" }}>
              <AlertCommandStrip />
            </div>

            {/* Enforcement Timeline — compact, internally scrollable */}
            <div style={{ borderTop: "1px solid var(--border-faint)", flexShrink: 0, maxHeight: "196px", overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "#E2E8F0 transparent" }}>
              <EnforcementTimeline />
            </div>
          </div>

        </div>
      </div>

      {/* ── Incident Drawer ── */}
      <IncidentDrawer data={incident} onClose={() => setIncident(null)} />

      {/* ── MODAL: City AQI ── */}
      <Modal open={modal === "cityAqi"} title="City AQI · Station Breakdown" onClose={() => setModal(null)}>
        <div style={{ display: "flex", gap: "14px", marginBottom: "20px" }}>
          <div style={{ background: "var(--page-bg)", borderRadius: "12px", padding: "16px 24px", textAlign: "center", flex: 1 }}>
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>City Average AQI</span>
            <div style={{ fontFamily: "monospace", fontSize: "3rem", fontWeight: 900, color: aqiColor(cityAqi), lineHeight: 1 }}>{cityAqi}</div>
            <div style={{ fontSize: "13px", color: aqiColor(cityAqi), fontWeight: 700, marginTop: "6px" }}>{aqiCategory(cityAqi)}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {stations.map(s => (
            <div key={s.id} style={{ padding: "12px", border: "1px solid var(--border-faint)", borderRadius: "10px", borderLeft: `4px solid ${aqiColor(s.aqi)}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13px" }}>{s.name}</span>
                <span style={{ fontFamily: "monospace", fontWeight: 800, color: aqiColor(s.aqi), fontSize: "18px" }}>{s.aqi}</span>
              </div>
              <div style={{ background: "var(--surface-alt)", borderRadius: "4px", height: "5px", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (s.aqi / 500) * 100)}%`, height: "100%", background: aqiColor(s.aqi), borderRadius: "4px", transition: "width 0.5s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "10px", color: "var(--text-muted)" }}>
                <span>{aqiCategory(s.aqi)}</span><span>{s.minutesAgo}m ago</span>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* ── MODAL: Poor Wards ── */}
      <Modal open={modal === "poorWards"} title="Poor+ Quality Wards · Intervention Required" onClose={() => setModal(null)}>
        {poorWards.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "#16A34A" }}>
            <div style={{ fontSize: "2.5rem" }}>✓</div>
            <div style={{ fontWeight: 700, fontSize: "18px", marginTop: "8px" }}>All zones within safe limits</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[...poorWards].sort((a, b) => b.aqi - a.aqi).map((s, i) => (
              <div key={s.id} style={{ border: "1px solid var(--border-faint)", borderRadius: "12px", overflow: "hidden", borderLeft: `5px solid ${aqiColor(s.aqi)}` }}>
                <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: i === 0 ? "rgba(220,38,38,0.06)" : "var(--surface-alt)" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "14px" }}>
                      {i === 0 && <span style={{ fontSize: "11px", background: "#C0392B", color: "white", borderRadius: "4px", padding: "1px 6px", marginRight: "8px" }}>WORST</span>}
                      {s.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{s.minutesAgo}m ago{s.pm25 != null && ` · PM2.5: ${s.pm25} µg/m³`}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "monospace", fontSize: "2rem", fontWeight: 900, color: aqiColor(s.aqi), lineHeight: 1 }}>{s.aqi}</div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: aqiColor(s.aqi) }}>{aqiCategory(s.aqi)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── MODAL: Alerts ── */}
      <Modal open={modal === "alerts"} title="Critical Station Alerts" onClose={() => setModal(null)}>
        {critAlerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "#16A34A" }}>
            <div style={{ fontSize: "2.5rem" }}>✓</div>
            <div style={{ fontWeight: 700, fontSize: "18px", marginTop: "8px" }}>No critical alerts</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[...critAlerts].sort((a, b) => b.aqi - a.aqi).map(s => (
              <div key={s.id} style={{ border: `1px solid ${aqiColor(s.aqi)}40`, borderRadius: "12px", borderLeft: `5px solid ${aqiColor(s.aqi)}`, overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", background: `${aqiColor(s.aqi)}08`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "14px" }}>{s.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>{s.pm25 != null && `PM2.5: ${s.pm25} µg/m³ · `}{s.minutesAgo}m ago</div>
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "2rem", fontWeight: 900, color: aqiColor(s.aqi) }}>{s.aqi}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}

export default function CommandCentre() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const splashDelay = mounted && !sessionStorage.getItem("splashShown") ? 2200 : 0;

  return (
    <>
      <LoadingScreen />
      <Suspense fallback={<MapSkeleton />}>
        <CommandCentreContent splashDelay={splashDelay} />
      </Suspense>
    </>
  );
}
