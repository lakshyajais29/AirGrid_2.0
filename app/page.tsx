"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AQIGauge } from "@/components/shared/AQIGauge";
import { GRAPBanner } from "@/components/shared/GRAPBanner";
import { LiveFlightCounter } from "@/components/dashboard/LiveFlightCounter";
import { WeatherCard } from "@/components/dashboard/WeatherCard";
import { EmissionTodayCard } from "@/components/dashboard/EmissionTodayCard";
import { DataFreshness } from "@/components/dashboard/DataFreshness";
import { AQITrendSparkline } from "@/components/dashboard/AQITrendSparkline";

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
  if (aqi > 400) return "🚨 IMMEDIATE drone deployment — Severe pollution. Emergency suppression protocol.";
  if (aqi > 300) return "⚠️ Urgent drone-based monitoring required. Dust/emission source identification needed.";
  if (aqi > 200) return "🔶 Deploy monitoring drone. Recommend anti-smog gun activation in this ward.";
  return "✅ Schedule routine drone inspection within 48h.";
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

/* ─── Main Dashboard ─── */
export default function CommandCentre() {
  const [data, setData] = useState<AQIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/aqi");
      const json: AQIData = await res.json();
      setData(json);
      setLastUpdate(new Date().toLocaleTimeString("en-IN", { hour12: false }));
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
  const sparklineData = stations.length
    ? stations.map(s => s.aqi)
    : [172, 178, 182, 185, 187, 189, 187];
  const grapLevel = cityAqi > 400 ? 4 : cityAqi > 300 ? 3 : cityAqi > 200 ? 2 : 1;
  const aqiCat = aqiCategory(cityAqi);
  const isLive = data?.source === "waqi";

  return (
    <>
      {/* ─── Slide-up modal animation ─── */}
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
          box-shadow: 0 12px 32px rgba(0,0,0,0.25);
        }
      `}</style>

      <div
        style={{
          backgroundImage: "radial-gradient(circle, #c8d6e8 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          backgroundColor: "#F4F6FA",
          minHeight: "100vh",
          padding: "24px",
        }}
      >
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ── SECTION A: Hero Strip ── */}
          <div
            className="rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            style={{ background: "linear-gradient(135deg, #0D1B2A 0%, #1A3A5C 60%, #0F8B8D 100%)", minHeight: "140px" }}
          >
            {/* Left */}
            <div className="flex flex-col justify-center">
              <div style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.25em", color: "#C9A84C", textTransform: "uppercase", marginBottom: "10px" }}>
                ⬡ AIRGRID OS &nbsp;·&nbsp; DELHI MUNICIPAL CORPORATION
                &nbsp;
                <span style={{ color: isLive ? "#00f5d4" : "#FFC000", fontSize: "9px" }}>
                  ● {isLive ? "LIVE" : "MOCK"} · Updated {lastUpdate || "—"}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white leading-tight">Air Quality Command Centre</h1>
              <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "6px" }}>Ward-level hyperlocal pollution intelligence · Real-time</p>
              <p style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>

            {/* Right: stat boxes */}
            <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
              {/* City AQI */}
              <div
                className="stat-box-clickable rounded-xl px-6 py-4 text-center"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.15)", minWidth: "110px" }}
                onClick={() => setModal("cityAqi")}
                title="Click to see AQI breakdown"
              >
                <div className="section-label" style={{ color: "#8A9BB0" }}>City AQI</div>
                <div style={{ fontFamily: "monospace", fontSize: "2.5rem", fontWeight: 900, color: aqiColor(cityAqi), lineHeight: 1 }}>
                  {loading ? "—" : cityAqi}
                </div>
                <div style={{ fontSize: "10px", color: aqiCat.color, fontWeight: 700, marginTop: "4px" }}>{aqiCat.label}</div>
              </div>

              {/* Poor+ Wards */}
              <div
                className="stat-box-clickable rounded-xl px-6 py-4 text-center"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(4px)", border: poorWards.length > 0 ? "1px solid rgba(192,57,43,0.4)" : "1px solid rgba(255,255,255,0.1)", minWidth: "110px" }}
                onClick={() => setModal("poorWards")}
                title="Click to see affected wards"
              >
                <div className="section-label" style={{ color: "#ff6b6b" }}>Poor+ Wards</div>
                <div style={{ fontFamily: "monospace", fontSize: "2.5rem", fontWeight: 900, color: "#C0392B", lineHeight: 1 }}>
                  {loading ? "—" : poorWards.length}
                </div>
                <div style={{ fontSize: "10px", color: "#8A9BB0", marginTop: "4px" }}>↗ tap for list</div>
              </div>

              {/* Active Alerts */}
              <div
                className="stat-box-clickable rounded-xl px-6 py-4 text-center"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(4px)", border: criticalAlerts.length > 0 ? "1px solid rgba(192,57,43,0.4)" : "1px solid rgba(255,255,255,0.1)", minWidth: "110px" }}
                onClick={() => setModal("alerts")}
                title="Click to see alerts"
              >
                <div className="section-label" style={{ color: "#8A9BB0" }}>Active Alerts</div>
                <div style={{ fontFamily: "monospace", fontSize: "2.5rem", fontWeight: 900, color: "#0F8B8D", lineHeight: 1 }}>
                  {loading ? "—" : criticalAlerts.length}
                </div>
                <div style={{ fontSize: "10px", color: "#8A9BB0", marginTop: "4px" }}>↗ view alerts</div>
              </div>
            </div>
          </div>

          {/* ── Alert banner for critical stations ── */}
          {criticalAlerts.length > 0 && (
            <div
              className="rounded-xl px-5 py-3 flex items-center gap-3 cursor-pointer"
              style={{ background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.3)", borderLeft: "4px solid #C0392B" }}
              onClick={() => setModal("alerts")}
            >
              <span className="live-dot" style={{ backgroundColor: "#C0392B", flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: "#C0392B", fontWeight: 600 }}>
                {criticalAlerts.length} station{criticalAlerts.length > 1 ? "s" : ""} with AQI &gt; 300 (Poor+). Immediate drone-based monitoring recommended.
              </span>
              <span style={{ marginLeft: "auto", fontSize: "11px", color: "#C0392B", opacity: 0.7, whiteSpace: "nowrap" }}>View details →</span>
            </div>
          )}

          {/* ── SECTION B: 3-column grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1 */}
            <div className="space-y-6">
              <div className="panel-card p-6 flex flex-col items-center" style={{ borderTop: "3px solid var(--accent-teal)" }}>
                <div className="w-full text-left mb-4">
                  <div className="section-label">Real-time Snapshot</div>
                  <h2 className="text-xl font-semibold text-navy">Current AQI Situation</h2>
                </div>
                <AQIGauge value={loading ? 0 : cityAqi} size={200} />
              </div>
              <LiveFlightCounter />
              <WeatherCard />
              <EmissionTodayCard />
            </div>

            {/* Column 2+3 */}
            <div className="space-y-6 lg:col-span-2">
              <GRAPBanner level={grapLevel} />

              {/* Inline alerts strip from real data */}
              <div className="panel-card p-4" style={{ borderTop: "3px solid var(--critical-red)" }}>
                <div className="section-label" style={{ color: "#C0392B" }}>Real-Time Notifications</div>
                <h2 className="text-lg font-semibold mb-3 text-navy">Station Alerts</h2>
                {stations.length === 0 ? (
                  <div style={{ color: "#8A9BB0", fontSize: "13px" }}>Fetching live data...</div>
                ) : (
                  <div className="space-y-2">
                    {stations
                      .filter(s => s.aqi > 200)
                      .sort((a, b) => b.aqi - a.aqi)
                      .slice(0, 4)
                      .map(s => (
                        <div
                          key={s.id}
                          className="flex items-center gap-3 px-4 py-2 rounded"
                          style={{
                            borderLeft: `4px solid ${aqiColor(s.aqi)}`,
                            background: `${aqiColor(s.aqi)}10`,
                            cursor: "pointer",
                          }}
                          onClick={() => setModal("poorWards")}
                        >
                          <span className="live-dot" style={{ backgroundColor: aqiColor(s.aqi), flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: "#0D1B2A", fontSize: "13px" }}>{s.name}</span>
                          <span style={{ color: "#8A9BB0", fontSize: "12px" }}>|</span>
                          <span style={{ fontSize: "12px", color: aqiColor(s.aqi), fontWeight: 700, fontFamily: "monospace" }}>AQI {s.aqi}</span>
                          {s.pm25 && <span style={{ fontSize: "11px", color: "#8A9BB0" }}>· PM2.5: {s.pm25}µg/m³</span>}
                          <span style={{ marginLeft: "auto", fontSize: "10px", color: aqiColor(s.aqi) }}>{aqiCategory(s.aqi).label}</span>
                        </div>
                      ))}
                    {stations.filter(s => s.aqi > 200).length === 0 && (
                      <div style={{ color: "#1E8449", fontWeight: 600, fontSize: "13px" }}>✓ All stations within acceptable range</div>
                    )}
                  </div>
                )}
              </div>

              {/* Sparkline + DataFreshness */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="panel-card p-6" style={{ borderTop: "3px solid var(--accent-teal)" }}>
                  <div className="section-label">Station AQI Overview</div>
                  <h2 className="text-lg font-semibold text-navy mb-4">Live AQI · All Stations</h2>
                  <AQITrendSparkline data={sparklineData} />
                </div>
                <div className="panel-card p-6" style={{ borderTop: "3px solid var(--gov-gold)" }}>
                  <DataFreshness />
                </div>
              </div>

              {/* Worst wards table — live from API */}
              <div className="panel-card p-6" style={{ borderTop: "3px solid var(--accent-teal)" }}>
                <div className="section-label">Critical Zones</div>
                <h2 className="text-xl font-semibold mb-4 text-navy">All Monitoring Stations</h2>
                {loading ? (
                  <div style={{ color: "#8A9BB0", padding: "16px", textAlign: "center" }}>Loading station data...</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "linear-gradient(90deg, #0D1B2A, #1A3A5C)", color: "white" }}>
                        <th className="text-left py-2 px-3 font-semibold rounded-tl-md">Station</th>
                        <th className="text-right py-2 px-3 font-semibold">AQI</th>
                        <th className="text-right py-2 px-3 font-semibold">PM2.5</th>
                        <th className="text-right py-2 px-3 font-semibold">NO₂</th>
                        <th className="text-right py-2 px-3 font-semibold rounded-tr-md">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...stations].sort((a, b) => b.aqi - a.aqi).map((s, i) => {
                        const cat = aqiCategory(s.aqi);
                        return (
                          <tr
                            key={s.id}
                            className={i % 2 === 0 ? "bg-white" : "bg-[#f8faff]"}
                            style={{ borderBottom: "1px solid #F1F5F9", borderLeft: i === 0 ? "4px solid #C0392B" : "4px solid transparent", cursor: "pointer" }}
                            onClick={() => setModal("poorWards")}
                          >
                            <td className="py-2 px-3 font-medium" style={{ color: "#0D1B2A" }}>{s.name}</td>
                            <td className="py-2 px-3 text-right">
                              <span style={{ fontFamily: "monospace", fontWeight: 700, color: aqiColor(s.aqi), background: `${aqiColor(s.aqi)}18`, borderRadius: "20px", padding: "2px 10px" }}>
                                {s.aqi}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono" style={{ color: "#1C2B3A" }}>{s.pm25 ?? "—"}</td>
                            <td className="py-2 px-3 text-right font-mono" style={{ color: "#1C2B3A" }}>{s.no2 ?? "—"}</td>
                            <td className="py-2 px-3 text-right">
                              <span style={{ fontSize: "11px", fontWeight: 700, color: cat.color }}>{cat.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
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
              <div style={{ fontSize: "13px", color: aqiCat.color, fontWeight: 700, marginTop: "6px" }}>{aqiCat.label}</div>
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
            <div style={{ background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.2)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "20px" }}>🚁</span>
              <div>
                <div style={{ fontWeight: 700, color: "#C0392B", fontSize: "14px" }}>Drone-Based Monitoring Protocol Active</div>
                <div style={{ fontSize: "12px", color: "#8A9BB0", marginTop: "2px" }}>Following wards require immediate aerial surveillance and anti-smog intervention per DPCC guidelines.</div>
              </div>
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
                    <div style={{ padding: "12px 16px", background: "#F8FAFF", borderTop: "1px solid #EEF2F7", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      <span>🚁</span>
                      <div style={{ fontSize: "13px", color: "#1C2B3A", lineHeight: 1.5 }}>
                        <strong>Action Required:</strong> {droneAction(s.aqi)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: "20px", padding: "12px 16px", background: "#F0F9FF", borderRadius: "10px", border: "1px solid #BAE6FD", fontSize: "12px", color: "#0D1B2A" }}>
              📋 <strong>DPCC Directive:</strong> All wards with AQI &gt; 300 require mandatory drone patrol under Delhi Pollution Control Committee circular no. DPCC/Drone/2024/118. Report generated at {new Date().toLocaleTimeString("en-IN")}.
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
                    🚁 <strong>Recommended Action:</strong> {droneAction(s.aqi)}
                  </div>
                </div>
              );
            })}
            <div style={{ padding: "12px 16px", background: "#FFF7ED", borderRadius: "10px", border: "1px solid #FED7AA", fontSize: "12px", color: "#9A3412" }}>
              ⚠️ These alerts are auto-generated based on CPCB National AQI standards. Threshold for "Poor": AQI &gt; 300. Drone deployment authority: Ward Environmental Officer.
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
