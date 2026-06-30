"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AlertTriangle, Info, CheckCircle, Download, MapPin } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity     = "critical" | "warning" | "info";
type SourceType   = "Construction Dust" | "Open Burning" | "Vehicular" | "Industrial" | "Road Dust" | "DG Set";

interface Alert {
  id:         number;
  ward:       string;
  pollutant:  string;
  value:      number;
  threshold:  number;
  time:       string;
  severity:   Severity;
  title:      string;
  source:     SourceType;
  confidence: number;  // AI confidence 0-100
  lat:        number;
  lng:        number;
}

interface AlertState extends Alert {
  acknowledged:   boolean;
  acknowledgedAt?: string;
  assignedDept?:  string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_ALERTS: Alert[] = [
  { id: 1, ward: "Mahipalpur",   pollutant: "PM2.5", value: 245, threshold: 200, time: "14:30", severity: "critical", title: "PM2.5 Spike Detected",      source: "Construction Dust", confidence: 92, lat: 28.5082, lng: 77.1247 },
  { id: 2, ward: "Vasant Kunj",  pollutant: "NO₂",   value: 189, threshold: 180, time: "15:15", severity: "warning",  title: "NO₂ Above Limit",           source: "Vehicular",         confidence: 85, lat: 28.5214, lng: 77.1576 },
  { id: 3, ward: "Dwarka",       pollutant: "PM10",  value: 320, threshold: 250, time: "13:50", severity: "critical", title: "PM10 Hazardous Level",       source: "Road Dust",         confidence: 88, lat: 28.5921, lng: 77.0460 },
  { id: 4, ward: "Rohini",       pollutant: "CO",    value: 4.2, threshold: 4.0, time: "16:00", severity: "warning",  title: "CO Elevated",               source: "DG Set",            confidence: 76, lat: 28.7495, lng: 77.1122 },
  { id: 5, ward: "Lajpat Nagar", pollutant: "SO₂",   value: 22,  threshold: 20,  time: "12:45", severity: "info",     title: "SO₂ Above Baseline",        source: "Industrial",        confidence: 71, lat: 28.5672, lng: 77.2433 },
  { id: 6, ward: "Saket",        pollutant: "AQI",   value: 410, threshold: 400, time: "11:30", severity: "critical", title: "AQI Severe — Emergency",    source: "Open Burning",      confidence: 95, lat: 28.5244, lng: 77.2090 },
  { id: 7, ward: "Okhla",        pollutant: "PM2.5", value: 178, threshold: 160, time: "10:20", severity: "warning",  title: "PM2.5 Rising Trend",        source: "Industrial",        confidence: 81, lat: 28.5329, lng: 77.2811 },
];

/* Departments keyed by source category */
const SOURCE_DEPTS: Record<SourceType, string[]> = {
  "Construction Dust": ["MCD Enforcement",     "DPCC Site Inspection", "ICCC"],
  "Open Burning":      ["Fire Services",        "MCD Anti-Burning Cell", "Police"],
  "Vehicular":         ["Traffic Police",       "MCD Transport Dept",    "DPCC"],
  "Industrial":        ["DPCC Industry Cell",   "CAQM",                  "ICCC"],
  "Road Dust":         ["MCD Road Watering",    "DPCC Field Team",       "ICCC"],
  "DG Set":            ["DPCC DG Task Force",   "MCD",                   "Police"],
};

const SOURCE_STYLE: Record<SourceType, { bg: string; text: string }> = {
  "Construction Dust": { bg: "#FEF9C3", text: "#854D0E" },
  "Open Burning":      { bg: "#FEF2F2", text: "#991B1B" },
  "Vehicular":         { bg: "#EFF6FF", text: "#1D4ED8" },
  "Industrial":        { bg: "#FDF4FF", text: "#6B21A8" },
  "Road Dust":         { bg: "#FFF7ED", text: "#9A3412" },
  "DG Set":            { bg: "#F0FDF4", text: "#14532D" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const now    = new Date();
  const then   = new Date();
  then.setHours(h, m, 0, 0);
  const diffMin = Math.round((now.getTime() - then.getTime()) / 60000);
  if (diffMin < 1)  return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

function playBeep() {
  try {
    const ctx  = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* browser policy */ }
}

const SEV: Record<Severity, { border: string; icon: React.ReactNode; bgTint: string }> = {
  critical: { border: "#C0392B", icon: <AlertTriangle size={14} color="#C0392B" />, bgTint: "rgba(192,57,43,0.03)" },
  warning:  { border: "#D97706", icon: <AlertTriangle size={14} color="#D97706" />, bgTint: "rgba(217,119,6,0.03)"  },
  info:     { border: "#2563EB", icon: <Info size={14} color="#2563EB" />,          bgTint: "rgba(37,99,235,0.03)"  },
};

// ─── Alert Card ───────────────────────────────────────────────────────────────

interface AlertCardProps {
  alert:         AlertState;
  onAcknowledge: (id: number) => void;
  onAssign:      (id: number, dept: string) => void;
  isNew:         boolean;
  compact?:      boolean;
}

function AlertCard({ alert, onAcknowledge, onAssign, isNew, compact }: AlertCardProps) {
  const [deptOpen, setDeptOpen] = useState(false);
  const dropRef                 = useRef<HTMLDivElement>(null);
  const cfg                     = SEV[alert.severity];
  const srcStyle                = SOURCE_STYLE[alert.source];
  const depts                   = SOURCE_DEPTS[alert.source];

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDeptOpen(false);
      }
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  function mapsUrl(lat: number, lng: number) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  return (
    <div
      style={{
        background:  alert.acknowledged ? "var(--surface-alt)" : "var(--surface)",
        opacity:     alert.acknowledged ? 0.62 : 1,
        animation:   isNew ? "slideDown 0.3s ease both" : undefined,
        borderRadius:"9px",
        border:      `1px solid rgba(13,27,42,0.07)`,
        borderLeft:  `3px solid ${cfg.border}`,
        padding:     "11px 13px",
        position:    "relative",
        boxShadow:   alert.acknowledged ? "none" : "0 1px 3px rgba(13,27,42,0.04)",
        transition:  "opacity 0.4s ease",
      }}
    >
      {/* Row 1 — icon + title + source badge */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "5px" }}>
        <span style={{ flexShrink: 0, marginTop: "1px", display: "flex" }}>{cfg.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
              {alert.title}
            </span>
            <span style={{
              fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em",
              background: srcStyle.bg, color: srcStyle.text,
              padding: "1px 7px", borderRadius: "5px", whiteSpace: "nowrap",
            }}>
              {alert.source}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2 — ward + reading + time + confidence */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px", marginBottom: "8px", paddingLeft: "22px" }}>
        <span style={{
          fontSize: "10px", fontWeight: 600, fontFamily: "var(--font-mono)",
          background: "var(--surface-alt)", color: "var(--text-secondary)",
          padding: "1px 7px", borderRadius: "20px",
        }}>
          {alert.ward}
        </span>
        <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {alert.pollutant}: <strong style={{ color: "var(--text-secondary)" }}>{alert.value}</strong>
          {alert.pollutant === "CO" ? " mg/m³" : alert.pollutant === "AQI" ? "" : alert.pollutant === "SO₂" || alert.pollutant === "NO₂" ? " ppb" : " µg/m³"}
        </span>
        <span style={{ fontSize: "10px", color: "var(--text-disabled)" }}>·</span>
        <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {relativeTime(alert.time)}
        </span>
        <span style={{ fontSize: "10px", color: "var(--text-disabled)" }}>·</span>
        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
          AI: <strong style={{ color: alert.confidence >= 85 ? "#16A34A" : "#D97706" }}>{alert.confidence}%</strong>
        </span>
      </div>

      {/* Row 3 — action buttons */}
      {!alert.acknowledged && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", paddingLeft: "22px" }}>

          {/* Acknowledge */}
          <button
            onClick={() => onAcknowledge(alert.id)}
            style={btnStyle("#F0FDF4", "#166534", "#BBF7D0")}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#DCFCE7"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F0FDF4"; }}
          >
            ✓ Ack
          </button>

          {/* Dispatch — department selector */}
          <div style={{ position: "relative" }} ref={dropRef}>
            <button
              onClick={() => setDeptOpen(v => !v)}
              style={btnStyle("#EFF6FF", "#1D4ED8", "#BFDBFE")}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#DBEAFE"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EFF6FF"; }}
            >
              → Dispatch {deptOpen ? "▲" : "▼"}
            </button>
            {deptOpen && (
              <div style={{
                position: "absolute", left: 0, top: "calc(100% + 5px)",
                background: "var(--surface)", border: "1px solid var(--border-faint)",
                borderRadius: "10px", boxShadow: "0 8px 28px rgba(13,27,42,0.14)",
                minWidth: "220px", zIndex: 200, overflow: "hidden",
              }}>
                <div style={{ padding: "7px 12px 5px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Recommended Departments
                </div>
                {depts.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => { onAssign(alert.id, dept); setDeptOpen(false); }}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "8px 12px", fontSize: "12px", fontWeight: 500,
                      color: "var(--text-primary)", background: "transparent", border: "none",
                      cursor: "pointer", transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(15,139,141,0.08)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* GPS + Evidence — hidden in compact (dashboard) mode */}
          {!compact && (
            <>
              <a
                href={mapsUrl(alert.lat, alert.lng)}
                target="_blank"
                rel="noopener noreferrer"
                title="Open location in Google Maps"
                style={{
                  ...btnStyle("var(--surface-alt)", "var(--text-secondary)", "var(--border-faint)"),
                  display: "inline-flex", alignItems: "center", gap: "3px",
                  textDecoration: "none",
                }}
              >
                <MapPin size={10} />
                GPS
              </a>
              <button
                title="Download Evidence Package (PDF)"
                onClick={() => alert.ward && console.log("evidence:", alert.id)}
                style={{ ...btnStyle("var(--surface-alt)", "var(--text-secondary)", "var(--border-faint)"), display: "inline-flex", alignItems: "center", gap: "3px" }}
              >
                <Download size={10} />
                Evidence
              </button>
            </>
          )}
        </div>
      )}

      {/* Acknowledged state */}
      {alert.acknowledged && (
        <div style={{ paddingLeft: "22px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <span style={tagStyle("#F0FDF4", "#166534", "#BBF7D0")}>
            ✓ Acknowledged{alert.acknowledgedAt && ` at ${alert.acknowledgedAt}`}
          </span>
          {alert.assignedDept && (
            <span style={tagStyle("#EFF6FF", "#1D4ED8", "#BFDBFE")}>
              → {alert.assignedDept}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function btnStyle(bg: string, color: string, border: string): React.CSSProperties {
  return {
    background: bg, color, border: `1px solid ${border}`,
    borderRadius: "6px", padding: "3px 9px",
    fontSize: "10px", fontWeight: 600,
    cursor: "pointer", whiteSpace: "nowrap",
    transition: "background 0.12s ease",
    lineHeight: 1.6,
  };
}

function tagStyle(bg: string, color: string, border: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: "4px",
    background: bg, color, border: `1px solid ${border}`,
    borderRadius: "5px", padding: "2px 8px",
    fontSize: "10px", fontWeight: 600,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface AlertCommandStripProps {
  compact?: boolean;
}

export const AlertCommandStrip: React.FC<AlertCommandStripProps> = ({ compact }) => {
  const [alerts, setAlerts] = useState<AlertState[]>(() =>
    INITIAL_ALERTS.map((a) => ({ ...a, acknowledged: false }))
  );
  const newIds = new Set<number>();

  const handleAcknowledge = useCallback((id: number) => {
    const now = new Date();
    const t   = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true, acknowledgedAt: t } : a));
  }, []);

  const handleAssign = useCallback((id: number, dept: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, assignedDept: dept } : a));
  }, []);

  const unacked = alerts.filter((a) => !a.acknowledged);
  /* In compact (dashboard) mode show only the 2 highest-severity unacknowledged alerts */
  const visible     = compact ? unacked.slice(0, 2) : unacked;
  const acknowledged = compact ? [] : alerts.filter((a) => a.acknowledged);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
            <CheckCircle size={36} color="#16A34A" />
          </div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
            All parameters within limits
          </div>
          <div style={{ fontSize: "11px" }}>No active enforcement actions required.</div>
        </div>
      ) : (
        visible.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onAcknowledge={handleAcknowledge}
            onAssign={handleAssign}
            isNew={newIds.has(alert.id)}
            compact={compact}
          />
        ))
      )}

      {/* Acknowledged section — only shown in full (non-compact) mode */}
      {!compact && acknowledged.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", padding: "0 2px" }}>
            Acknowledged ({acknowledged.length})
          </div>
          {acknowledged.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
              onAssign={handleAssign}
              isNew={false}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
};
