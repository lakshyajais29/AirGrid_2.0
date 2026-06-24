"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = "critical" | "warning" | "info";
type FilterType = "all" | Severity | "acknowledged";

interface Alert {
  id: number;
  ward: string;
  pollutant: string;
  value: number;
  threshold: number;
  time: string;        // "HH:MM"
  severity: Severity;
  title: string;
  isNew?: boolean;     // for slide-in animation
}

interface AlertState extends Alert {
  acknowledged: boolean;
  acknowledgedAt?: string;
  assignedTeam?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_ALERTS: Alert[] = [
  { id: 1,  ward: "Mahipalpur",      pollutant: "PM2.5", value: 245, threshold: 200, time: "14:30", severity: "critical", title: "PM2.5 Critically Elevated" },
  { id: 2,  ward: "Vasant Kunj",     pollutant: "NO₂",   value: 189, threshold: 180, time: "15:15", severity: "warning",  title: "NO₂ Above Threshold" },
  { id: 3,  ward: "Dwarka",          pollutant: "PM10",  value: 320, threshold: 250, time: "13:50", severity: "critical", title: "PM10 Hazardous Level" },
  { id: 4,  ward: "Rohini",          pollutant: "CO",    value: 4.2, threshold: 4.0, time: "16:00", severity: "warning",  title: "CO Slightly Elevated" },
  { id: 5,  ward: "Lajpat Nagar",    pollutant: "SO₂",   value: 22,  threshold: 20,  time: "12:45", severity: "info",     title: "SO₂ Monitoring Notice" },
  { id: 6,  ward: "Saket",           pollutant: "AQI",   value: 410, threshold: 400, time: "11:30", severity: "critical", title: "AQI Severe — Action Required" },
  { id: 7,  ward: "Okhla",           pollutant: "PM2.5", value: 178, threshold: 160, time: "10:20", severity: "warning",  title: "PM2.5 Rising Trend" },
];

const TEAMS = [
  "Field Inspection Team",
  "Road Watering Unit",
  "Construction Enforcement",
  "Emergency Response",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function aqiColor(value: number): { bg: string; text: string } {
  if (value >= 401) return { bg: "#7E0023", text: "#fff" };
  if (value >= 301) return { bg: "#C0392B", text: "#fff" };
  if (value >= 201) return { bg: "#E67E22", text: "#fff" };
  if (value >= 101) return { bg: "#F1C40F", text: "#1C2B3A" };
  if (value >= 51)  return { bg: "#2ECC71", text: "#fff" };
  return { bg: "#27AE60", text: "#fff" };
}

function relativeTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  const then = new Date();
  then.setHours(h, m, 0, 0);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1)  return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const hrs = Math.floor(diffMin / 60);
  return `${hrs} hr ago`;
}

// Play a short beep via Web Audio API
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Ignore AudioContext errors (e.g., blocked by browser policy)
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, { border: string; icon: string; label: string; bgTint: string; pulse: boolean }> = {
  critical: { border: "#C0392B", icon: "🔴", label: "Critical",  bgTint: "rgba(192,57,43,0.04)", pulse: true  },
  warning:  { border: "#E67E22", icon: "🟠", label: "Warning",   bgTint: "rgba(230,126,34,0.04)", pulse: false },
  info:     { border: "#2980B9", icon: "🔵", label: "Info",      bgTint: "rgba(41,128,185,0.04)", pulse: false },
};

interface AlertCardProps {
  alert: AlertState;
  onAcknowledge: (id: number) => void;
  onAssign: (id: number, team: string) => void;
  isNew: boolean;
}

function AlertCard({ alert, onAcknowledge, onAssign, isNew }: AlertCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cfg = SEVERITY_CONFIG[alert.severity];
  const aqiStyle = aqiColor(alert.value);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div
      className="alert-card"
      style={{
        borderLeft: `4px solid ${cfg.border}`,
        background: alert.acknowledged
          ? "rgba(240,244,250,0.7)"
          : `linear-gradient(90deg, ${cfg.bgTint}, transparent)`,
        opacity: alert.acknowledged ? 0.5 : 1,
        animation: isNew ? "slideDown 0.3s ease both" : undefined,
        transition: "opacity 0.5s ease",
        borderRadius: "10px",
        border: `1px solid #e2e8f0`,
        borderLeftWidth: "4px",
        borderLeftColor: cfg.border,
        borderLeftStyle: "solid",
        padding: "14px 16px",
        marginBottom: "10px",
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Critical pulse bar */}
      {alert.severity === "critical" && !alert.acknowledged && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "4px",
            height: "100%",
            borderRadius: "4px 0 0 4px",
            background: cfg.border,
            animation: "borderPulse 2s ease-in-out infinite",
          }}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        {/* Left: icon + info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span style={{ fontSize: "18px", lineHeight: 1, marginTop: "2px", flexShrink: 0 }}>
            {cfg.icon}
          </span>
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--navy)",
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                }}
              >
                {alert.title}
              </span>
              {/* Ward pill */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background:
                    alert.severity === "critical"
                      ? "#FFF5F5"
                      : alert.severity === "warning"
                      ? "#FFFBF0"
                      : "#EFF8FF",
                  color:
                    alert.severity === "critical"
                      ? "#C0392B"
                      : alert.severity === "warning"
                      ? "#B7580E"
                      : "#2980B9",
                  border: `1px solid ${
                    alert.severity === "critical"
                      ? "#FECACA"
                      : alert.severity === "warning"
                      ? "#FDE68A"
                      : "#BFDBFE"
                  }`,
                  borderRadius: "9999px",
                  padding: "1px 10px",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {alert.ward}
              </span>
            </div>

            {/* Pollutant + timestamp */}
            <div
              style={{
                fontSize: "12px",
                color: "#8A9BB0",
                fontFamily: "var(--font-mono)",
                marginBottom: "8px",
              }}
            >
              {alert.pollutant}: {alert.value} µg/m³ · Threshold {alert.threshold} ·{" "}
              <span style={{ color: "#A0AEC0" }}>
                {alert.time} IST · {relativeTime(alert.time)}
              </span>
            </div>

            {/* Status tags */}
            <div className="flex flex-wrap gap-2">
              {alert.acknowledged && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#F0FDF4",
                    color: "#166534",
                    border: "1px solid #BBF7D0",
                    borderRadius: "6px",
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  ✓ Acknowledged by Operator
                  {alert.acknowledgedAt && (
                    <span style={{ fontWeight: 400, opacity: 0.75 }}>
                      {" "}at {alert.acknowledgedAt}
                    </span>
                  )}
                </span>
              )}
              {alert.assignedTeam && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#EFF6FF",
                    color: "#1D4ED8",
                    border: "1px solid #BFDBFE",
                    borderRadius: "6px",
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  📋 Assigned to: {alert.assignedTeam}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: AQI badge + actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {/* AQI badge */}
          <div
            style={{
              background: aqiStyle.bg,
              color: aqiStyle.text,
              borderRadius: "8px",
              padding: "4px 12px",
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              fontSize: "20px",
              lineHeight: 1.2,
              minWidth: "56px",
              textAlign: "center",
              letterSpacing: "-0.5px",
            }}
          >
            {alert.value}
            <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.05em", opacity: 0.85 }}>
              AQI
            </div>
          </div>

          {/* Action buttons */}
          {!alert.acknowledged && (
            <div className="flex gap-2">
              {/* Acknowledge */}
              <button
                onClick={() => onAcknowledge(alert.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "#F0FDF4",
                  color: "#166534",
                  border: "1px solid #BBF7D0",
                  borderRadius: "7px",
                  padding: "5px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#DCFCE7";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#F0FDF4";
                }}
              >
                ✓ Acknowledge
              </button>

              {/* Assign team */}
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#EFF6FF",
                    color: "#1D4ED8",
                    border: "1px solid #BFDBFE",
                    borderRadius: "7px",
                    padding: "5px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#DBEAFE";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#EFF6FF";
                  }}
                >
                  → Assign Team
                  <span style={{ fontSize: "10px", marginLeft: "2px" }}>
                    {dropdownOpen ? "▲" : "▼"}
                  </span>
                </button>

                {dropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 6px)",
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      boxShadow: "0 8px 24px rgba(13,27,42,0.14)",
                      minWidth: "210px",
                      zIndex: 50,
                      overflow: "hidden",
                      animation: "fadeInDown 0.15s ease",
                    }}
                  >
                    {TEAMS.map((team) => (
                      <button
                        key={team}
                        onClick={() => {
                          onAssign(alert.id, team);
                          setDropdownOpen(false);
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "9px 14px",
                          fontSize: "13px",
                          color: "var(--navy)",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 500,
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "#EFF6FF";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        }}
                      >
                        {team}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const AlertCommandStrip: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertState[]>(() =>
    INITIAL_ALERTS.map((a) => ({ ...a, acknowledged: false, isNew: false }))
  );
  const [filter, setFilter] = useState<FilterType>("all");
  const [soundOn, setSoundOn] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [newAlertIds, setNewAlertIds] = useState<Set<number>>(new Set());
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;

  // Auto-refresh countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          // Simulate refresh: mark all as not-new
          setNewAlertIds(new Set());
          return 30;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = useCallback((id: number) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, acknowledged: true, acknowledgedAt: timeStr } : a
      )
    );
  }, []);

  const handleAssign = useCallback((id: number, team: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, assignedTeam: team } : a))
    );
  }, []);

  // Counts
  const criticalCount   = alerts.filter((a) => a.severity === "critical" && !a.acknowledged).length;
  const warningCount    = alerts.filter((a) => a.severity === "warning"  && !a.acknowledged).length;
  const acknowledgedCount = alerts.filter((a) => a.acknowledged).length;

  // Filtered list
  const visible = alerts.filter((a) => {
    if (filter === "all")          return true;
    if (filter === "acknowledged") return a.acknowledged;
    return a.severity === filter && !a.acknowledged;
  });

  const filters: { key: FilterType; label: string; icon: string }[] = [
    { key: "all",          label: "All",         icon: "≡" },
    { key: "critical",     label: "Critical",    icon: "🔴" },
    { key: "warning",      label: "Warning",     icon: "🟠" },
    { key: "info",         label: "Info",        icon: "🔵" },
    { key: "acknowledged", label: "Acknowledged", icon: "✓" },
  ];

  return (
    <>
      {/* Inject keyframe animations */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes borderPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div
        className="panel-card p-5"
        style={{ borderTop: "3px solid var(--accent-teal)" }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="section-label">Real-Time Notifications</div>
            <h2
              style={{
                fontSize: "17px",
                fontWeight: 700,
                color: "var(--navy)",
                margin: 0,
              }}
            >
              Active Alerts
            </h2>
          </div>

          {/* Sound toggle + auto-refresh */}
          <div className="flex items-center gap-3">
            {/* Auto-refresh indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                color: "#8A9BB0",
                fontFamily: "var(--font-mono)",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                  border: "2px solid #0F8B8D",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 1.2s linear infinite",
                }}
              />
              Refreshing in {countdown}s
            </div>

            {/* Sound toggle */}
            <button
              onClick={() => setSoundOn((v) => !v)}
              title={soundOn ? "Mute alert sound" : "Enable alert sound"}
              style={{
                background: soundOn ? "rgba(15,139,141,0.08)" : "rgba(138,155,176,0.1)",
                border: `1px solid ${soundOn ? "rgba(15,139,141,0.25)" : "#e2e8f0"}`,
                borderRadius: "8px",
                padding: "6px 10px",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              }}
            >
              {soundOn ? "🔔" : "🔕"}
            </button>
          </div>
        </div>

        {/* ── Summary Strip ───────────────────────────────────────────── */}
        <div
          className="flex gap-3 mb-4"
          style={{ flexWrap: "wrap" }}
        >
          {/* Critical box */}
          <button
            onClick={() => setFilter(filter === "critical" ? "all" : "critical")}
            style={{
              flex: "1 1 120px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: filter === "critical" ? "rgba(192,57,43,0.12)" : "rgba(192,57,43,0.06)",
              border: `1px solid ${filter === "critical" ? "rgba(192,57,43,0.4)" : "rgba(192,57,43,0.18)"}`,
              borderRadius: "12px",
              padding: "10px 14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: "20px" }}>🔴</span>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#C0392B", lineHeight: 1, fontFamily: "var(--font-mono)" }}>
                {criticalCount}
              </div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#C0392B", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Critical
              </div>
            </div>
          </button>

          {/* Warning box */}
          <button
            onClick={() => setFilter(filter === "warning" ? "all" : "warning")}
            style={{
              flex: "1 1 120px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: filter === "warning" ? "rgba(230,126,34,0.12)" : "rgba(230,126,34,0.06)",
              border: `1px solid ${filter === "warning" ? "rgba(230,126,34,0.4)" : "rgba(230,126,34,0.18)"}`,
              borderRadius: "12px",
              padding: "10px 14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: "20px" }}>🟠</span>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#B7580E", lineHeight: 1, fontFamily: "var(--font-mono)" }}>
                {warningCount}
              </div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#B7580E", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Warning
              </div>
            </div>
          </button>

          {/* Acknowledged box */}
          <button
            onClick={() => setFilter(filter === "acknowledged" ? "all" : "acknowledged")}
            style={{
              flex: "1 1 120px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: filter === "acknowledged" ? "rgba(22,101,52,0.12)" : "rgba(22,101,52,0.06)",
              border: `1px solid ${filter === "acknowledged" ? "rgba(22,101,52,0.4)" : "rgba(22,101,52,0.18)"}`,
              borderRadius: "12px",
              padding: "10px 14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: "20px" }}>✅</span>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#166534", lineHeight: 1, fontFamily: "var(--font-mono)" }}>
                {acknowledgedCount}
              </div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#166534", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Acknowledged
              </div>
            </div>
          </button>
        </div>

        {/* ── Filter Bar ──────────────────────────────────────────────── */}
        <div
          className="flex gap-1 mb-4"
          style={{
            background: "rgba(244,246,250,0.8)",
            borderRadius: "10px",
            padding: "4px",
            flexWrap: "wrap",
          }}
        >
          {filters.map(({ key, label, icon }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "6px 14px",
                  borderRadius: "7px",
                  border: "none",
                  background: active ? "#fff" : "transparent",
                  boxShadow: active ? "0 1px 4px rgba(13,27,42,0.10)" : "none",
                  color: active ? "var(--accent-teal)" : "#8A9BB0",
                  fontWeight: active ? 700 : 500,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  position: "relative",
                  whiteSpace: "nowrap",
                }}
              >
                <span>{icon}</span>
                {label}
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: "2px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "20px",
                      height: "2px",
                      background: "var(--accent-teal)",
                      borderRadius: "2px",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Alert Cards ─────────────────────────────────────────────── */}
        <div>
          {visible.length === 0 ? (
            /* Empty state */
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
                color: "#8A9BB0",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#4A6080", marginBottom: "4px" }}>
                No active alerts for selected filter
              </div>
              <div style={{ fontSize: "13px" }}>
                All monitored parameters within acceptable thresholds.
              </div>
            </div>
          ) : (
            visible.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={handleAcknowledge}
                onAssign={handleAssign}
                isNew={newAlertIds.has(alert.id)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};
