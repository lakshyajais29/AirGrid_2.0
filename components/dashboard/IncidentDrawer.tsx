"use client";

import React from "react";
import { X, Download, MapPin, Plane } from "lucide-react";

/* ── Shared incident data shape ── */
export interface IncidentData {
  ward:       string;
  zone:       string;
  aqi:        number;
  pm25:       number;
  pm10:       number;
  no2:        number;
  source:     string;
  confidence: number;
  delta:      number;
  lat:        number;
  lng:        number;
}

/* ── Source display config ── */
const SOURCE_META: Record<string, { emoji: string; simple: string }> = {
  "Construction Dust": { emoji: "🏗️", simple: "Building work nearby"     },
  "Open Burning":      { emoji: "🔥", simple: "Something is being burned" },
  "Vehicular":         { emoji: "🚗", simple: "Too many vehicles"         },
  "Industrial":        { emoji: "🏭", simple: "Factory emissions"         },
  "Road Dust":         { emoji: "🛣️", simple: "Dust from roads"          },
  "DG Set":            { emoji: "⚡", simple: "Diesel generators running" },
};

/* ── Departments per source ── */
const DISPATCH_DEPTS: Record<string, string[]> = {
  "Construction Dust": ["MCD Enforcement", "DPCC"],
  "Open Burning":      ["Fire Services", "MCD Anti-Burning"],
  "Vehicular":         ["Traffic Police", "DPCC"],
  "Industrial":        ["DPCC Industry Cell", "CAQM"],
  "Road Dust":         ["MCD Road Watering", "DPCC"],
  "DG Set":            ["DPCC DG Task Force", "Police"],
};

/* ── Nearby sensitive places per ward ── */
const NEARBY: Record<string, Array<{ name: string; type: "school"|"hospital"|"residential"; dist: string }>> = {
  "Anand Vihar":  [{ name: "Anand Vihar Govt School", type: "school",      dist: "0.6 km" }, { name: "GTB Hospital", type: "hospital",    dist: "2.1 km" }],
  "Bawana":       [{ name: "Bawana Primary School",   type: "school",      dist: "0.4 km" }],
  "Mundka":       [{ name: "Mundka Primary School",   type: "school",      dist: "0.8 km" }, { name: "Rohini Hospital",  type: "hospital",    dist: "1.4 km" }],
  "Wazirpur":     [{ name: "Bal Vidyalaya Wazirpur",  type: "school",      dist: "0.3 km" }, { name: "Sanjay Gandhi Memorial", type: "hospital", dist: "1.8 km" }],
  "Jahangirpuri": [{ name: "JJ Colony School",        type: "school",      dist: "0.5 km" }, { name: "Sec-22 Residential",   type: "residential", dist: "0.3 km" }],
};

const PLACE_EMOJI = { school: "🏫", hospital: "🏥", residential: "🏘️" } as const;

/* ── AQI helpers ── */
function aqiColor(aqi: number) {
  if (aqi > 400) return "#AF2D24";
  if (aqi > 300) return "#E93F33";
  if (aqi > 200) return "#F29C33";
  if (aqi > 100) return "#FFC000";
  return "#55A84F";
}

function aqiLabel(aqi: number) {
  if (aqi > 400) return { word: "EMERGENCY 🔴",  sub: "Stay indoors. Do not go outside."         };
  if (aqi > 300) return { word: "VERY BAD 🟠",   sub: "Children & elderly must stay indoors."    };
  if (aqi > 200) return { word: "BAD 🟡",         sub: "Avoid outdoor activity. Wear mask."       };
  if (aqi > 100) return { word: "CAUTION 🟡",     sub: "Sensitive people should be careful."      };
  return               { word: "OK 🟢",            sub: "Air quality is acceptable."               };
}

function aiSureWord(conf: number) {
  if (conf >= 90) return "Very Sure";
  if (conf >= 75) return "Fairly Sure";
  return "Not Very Sure";
}

/* ═══════════════════════════════════════
   Main Drawer
   ═══════════════════════════════════════ */
interface Props {
  data:    IncidentData | null;
  onClose: () => void;
}

export function IncidentDrawer({ data, onClose }: Props) {
  if (!data) return null;

  const color   = aqiColor(data.aqi);
  const label   = aqiLabel(data.aqi);
  const meta    = SOURCE_META[data.source] ?? { emoji: "📍", simple: "Unknown source" };
  const depts   = DISPATCH_DEPTS[data.source] ?? ["DPCC", "MCD"];
  const nearby  = NEARBY[data.ward] ?? [];

  const pm25Pct = Math.min(100, (data.pm25 / 300) * 100);
  const pm10Pct = Math.min(100, (data.pm10 / 400) * 100);
  const no2Pct  = Math.min(100, (data.no2  / 150) * 100);

  function barColor(pct: number) {
    if (pct > 65) return "#E93F33";
    if (pct > 35) return "#F29C33";
    return "#55A84F";
  }

  return (
    <>
      {/* Dim backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 900,
          background: "rgba(13,27,42,0.30)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Drawer */}
      <div style={{
        position:   "fixed",
        top:        "52px",
        right:      0,
        bottom:     "36px",
        width:      "360px",
        zIndex:     901,
        background: "var(--surface)",
        boxShadow:  "-6px 0 28px rgba(13,27,42,0.18)",
        display:    "flex",
        flexDirection: "column",
        animation:  "slideInRight 0.22s cubic-bezier(0.4,0,0.2,1)",
        overflow:   "hidden",
        borderLeft: "1px solid rgba(13,27,42,0.08)",
      }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "13px 16px",
          borderBottom: "1px solid rgba(13,27,42,0.07)",
          flexShrink: 0, background: "var(--surface-alt)",
        }}>
          <div>
            <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Incident Report
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginTop: "1px" }}>
              {data.ward}
              <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "12px" }}> · {data.zone}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--surface-alt)", border: "none", borderRadius: "50%",
              width: "30px", height: "30px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={14} color="#6B7280" />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 20px", scrollbarWidth: "thin", scrollbarColor: "#E2E8F0 transparent" }}>

          {/* ── HERO: Source + AQI ── */}
          <div style={{
            background: `linear-gradient(135deg, ${color}12, ${color}06)`,
            border: `1px solid ${color}30`,
            borderRadius: "14px",
            padding: "18px 16px 14px",
            textAlign: "center",
            marginBottom: "12px",
          }}>
            <div style={{ fontSize: "40px", lineHeight: 1, marginBottom: "6px" }}>{meta.emoji}</div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "2px" }}>
              {data.source}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "14px" }}>
              {meta.simple}
            </div>

            {/* AQI big number */}
            <div style={{ fontSize: "58px", fontWeight: 900, fontFamily: "var(--font-mono)", color, lineHeight: 1, letterSpacing: "-0.03em" }}>
              {data.aqi}
            </div>
            <div style={{ marginTop: "8px", fontSize: "15px", fontWeight: 800, color }}>{label.word}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{label.sub}</div>

            {/* 24h trend */}
            <div style={{
              marginTop: "10px",
              display: "inline-flex", alignItems: "center", gap: "5px",
              fontSize: "11px", fontWeight: 600,
              color: data.delta > 0 ? "#DC2626" : "#16A34A",
              background: data.delta > 0 ? "#FEF2F2" : "#F0FDF4",
              padding: "3px 12px", borderRadius: "20px",
            }}>
              {data.delta > 0 ? `↑ ${data.delta} worse than yesterday` : `↓ ${Math.abs(data.delta)} better than yesterday`}
            </div>
          </div>

          {/* ── AI Confidence ── */}
          <div style={{
            background: "var(--surface-alt)", borderRadius: "10px", border: "1px solid var(--border-faint)",
            padding: "10px 12px", marginBottom: "12px",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <span style={{ fontSize: "22px" }}>🤖</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                AI is {aiSureWord(data.confidence)}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>
                {data.confidence}% sure this is {data.source}
              </div>
            </div>
            {/* Confidence ring */}
            <svg width="38" height="38" viewBox="0 0 38 38">
              <circle cx="19" cy="19" r="16" fill="none" stroke="#E5E7EB" strokeWidth="3.5" />
              <circle
                cx="19" cy="19" r="16" fill="none"
                stroke={data.confidence >= 80 ? "#16A34A" : "#D97706"}
                strokeWidth="3.5"
                strokeDasharray={`${(data.confidence / 100) * 100.5} 100.5`}
                strokeLinecap="round"
                transform="rotate(-90 19 19)"
              />
              <text x="19" y="23" textAnchor="middle" fontSize="9" fontWeight="800" fill={data.confidence >= 80 ? "#16A34A" : "#D97706"}>
                {data.confidence}%
              </text>
            </svg>
          </div>

          {/* ── What's in the air ── */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
              What's in the air right now?
            </div>

            {[
              { label: "Dust Particles",    hint: "PM2.5", value: data.pm25, unit: "µg/m³", pct: pm25Pct },
              { label: "Bigger Dust",       hint: "PM10",  value: data.pm10, unit: "µg/m³", pct: pm10Pct },
              { label: "Vehicle Gas Smoke", hint: "NO₂",   value: data.no2,  unit: "ppb",   pct: no2Pct  },
            ].map(row => (
              <div key={row.label} style={{ marginBottom: "9px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{row.label}</span>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "4px" }}>({row.hint})</span>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-mono)", color: barColor(row.pct) }}>
                    {row.value} {row.unit}
                  </span>
                </div>
                <div style={{ background: "var(--surface-alt)", borderRadius: "4px", height: "7px", overflow: "hidden" }}>
                  <div style={{ width: `${row.pct}%`, height: "100%", background: barColor(row.pct), borderRadius: "4px", transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)" }} />
                </div>
              </div>
            ))}
          </div>

          {/* ── Drone Status ── */}
          <div style={{
            background: "rgba(15,139,141,0.06)", borderRadius: "10px",
            border: "1px solid rgba(15,139,141,0.18)",
            padding: "10px 12px", marginBottom: "12px",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <Plane size={18} color="#0F8B8D" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>Drone is watching this area</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>AG-01 · Last scan: 4 minutes ago</div>
            </div>
            <span style={{ fontSize: "9px", fontWeight: 700, color: "#0F8B8D", background: "rgba(15,139,141,0.12)", padding: "2px 8px", borderRadius: "20px" }}>
              LIVE
            </span>
          </div>

          {/* ── Nearby sensitive places ── */}
          {nearby.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
                ⚠️ Nearby Schools & Hospitals
              </div>
              {nearby.map(loc => (
                <div key={loc.name} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "9px 12px", marginBottom: "6px",
                  background: "#FFF7ED", borderRadius: "9px",
                  border: "1px solid #FDE68A",
                }}>
                  <span style={{ fontSize: "20px", lineHeight: 1 }}>{PLACE_EMOJI[loc.type]}</span>
                  <span style={{ flex: 1, fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{loc.name}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#D97706" }}>{loc.dist}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── GPS ── */}
          <a
            href={`https://www.google.com/maps?q=${data.lat},${data.lng}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 12px", marginBottom: "14px",
              background: "var(--surface-alt)", borderRadius: "9px",
              border: "1px solid var(--border-faint)", textDecoration: "none",
            }}
          >
            <MapPin size={13} color="#9CA3AF" />
            <span style={{ flex: 1, fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              {data.lat.toFixed(4)}°N, {data.lng.toFixed(4)}°E
            </span>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#0F8B8D" }}>Open Maps →</span>
          </a>

          {/* ── Big red action button ── */}
          <button
            style={{
              width: "100%", padding: "15px 16px",
              background: color, color: "#fff",
              border: "none", borderRadius: "12px",
              fontSize: "15px", fontWeight: 800,
              cursor: "pointer", marginBottom: "8px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: `0 4px 16px ${color}45`,
              transition: "opacity 0.14s ease",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            🚨 SEND ENFORCEMENT TEAM NOW
          </button>

          <div style={{ textAlign: "center", fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
            Notifying: {depts.join(" + ")}
          </div>

          {/* ── Evidence download ── */}
          <button
            style={{
              width: "100%", padding: "10px",
              background: "var(--surface-alt)", color: "var(--text-secondary)",
              border: "1px solid var(--border-faint)", borderRadius: "10px",
              fontSize: "12px", fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              transition: "background 0.12s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-alt)"; }}
          >
            <Download size={13} />
            Download Proof Package (PDF)
          </button>
        </div>
      </div>
    </>
  );
}
