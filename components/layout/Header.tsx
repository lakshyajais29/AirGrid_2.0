"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Bell, Radio, Hexagon } from "lucide-react";

/* Derive GRAP level from city AQI */
function grapLevel(aqi: number) {
  if (aqi > 400) return { level: 4, label: "SEVERE", color: "#DC2626", bg: "rgba(220,38,38,0.12)" };
  if (aqi > 300) return { level: 3, label: "VERY POOR", color: "#EA580C", bg: "rgba(234,88,12,0.12)" };
  if (aqi > 200) return { level: 2, label: "POOR", color: "#CA8A04", bg: "rgba(202,138,4,0.12)" };
  return { level: 1, label: "MODERATE", color: "#16A34A", bg: "rgba(22,163,74,0.10)" };
}

export const Header: React.FC = () => {
  const [time, setTime]           = useState("");
  const [cityAqi, setCityAqi]     = useState<number | null>(null);
  const [alertCount, setAlertCount] = useState(0);

  /* Live clock */
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString("en-IN", { hour12: false });
    setTime(fmt());
    const t = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(t);
  }, []);

  /* Fetch city AQI for operational status badge */
  const fetchAqi = useCallback(async () => {
    try {
      const res  = await fetch("/api/aqi");
      const data = await res.json();
      const stations = data.stations ?? [];
      if (stations.length) {
        const avg = Math.round(stations.reduce((s: number, x: { aqi: number }) => s + x.aqi, 0) / stations.length);
        setCityAqi(avg);
        setAlertCount(stations.filter((s: { aqi: number }) => s.aqi > 300).length);
      }
    } catch {
      // silently ignore — header is non-critical path
    }
  }, []);

  useEffect(() => {
    fetchAqi();
    const iv = setInterval(fetchAqi, 60_000);
    return () => clearInterval(iv);
  }, [fetchAqi]);

  const grap   = cityAqi != null ? grapLevel(cityAqi) : null;
  const today  = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return (
    <header
      className="flex items-center justify-between"
      style={{
        height: "52px",
        padding: "0 20px",
        background: "var(--shell-bg)",
        borderBottom: "1px solid var(--shell-border)",
        flexShrink: 0,
      }}
    >
      {/* ── Brand ── */}
      <div className="flex items-center gap-3">
        <Hexagon size={20} color="var(--shell-active-text)" strokeWidth={1.5} fill="var(--shell-active-bg)" />
        <div className="flex flex-col leading-tight">
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--shell-text-primary)", letterSpacing: "0.08em" }}>
            AIRGRID OS
          </span>
          <span style={{ fontSize: "9px", color: "var(--shell-text-faint)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Environmental Intelligence · NCT Delhi
          </span>
        </div>
      </div>

      {/* ── Right cluster ── */}
      <div className="flex items-center gap-5">

        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span className="live-dot" style={{ width: "6px", height: "6px", margin: 0 }} />
          <span style={{ fontSize: "10px", color: "var(--shell-text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}>
            LIVE
          </span>
        </div>

        {/* GRAP operational status badge */}
        {grap && (
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "0 12px", height: "28px",
            background: grap.bg,
            border: `1px solid ${grap.color}40`,
            borderRadius: "20px",
          }}>
            <Radio size={11} color={grap.color} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: grap.color, fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
              GRAP {grap.level}
            </span>
            <span style={{ fontSize: "10px", color: grap.color, opacity: 0.75 }}>
              {grap.label}
            </span>
          </div>
        )}

        {/* City AQI value */}
        {cityAqi != null && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "10px", color: "var(--shell-text-secondary)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>AQI</span>
            <span style={{
              fontSize: "16px", fontWeight: 800,
              fontFamily: "var(--font-mono)",
              color: cityAqi > 300 ? "#E93F33" : cityAqi > 200 ? "#F29C33" : cityAqi > 100 ? "#FFF833" : "#55A84F",
              letterSpacing: "-0.02em",
            }}>
              {cityAqi}
            </span>
          </div>
        )}

        {/* Alert bell */}
        <div style={{ position: "relative", cursor: "pointer" }}>
          <Bell size={17} color="var(--shell-text-secondary)" />
          {alertCount > 0 && (
            <span style={{
              position: "absolute", top: "-4px", right: "-4px",
              background: "var(--alert-critical)", color: "#fff",
              fontSize: "9px", fontWeight: 700,
              width: "15px", height: "15px",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </div>

        {/* Date · Clock */}
        <div className="flex flex-col items-end leading-tight" style={{ gap: "1px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--shell-text-primary)", letterSpacing: "0.04em" }}>
            {time}
          </span>
          <span style={{ fontSize: "9px", color: "var(--shell-text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
            {today}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
