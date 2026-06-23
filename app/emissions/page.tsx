"use client";

import React, { useState } from "react";

/* ─── Emission source types ─── */
type SourceType = "construction" | "fire" | "industrial" | "stubble" | "vehicle" | "waste";

interface EmissionEvent {
  id: string;
  zone: string;
  area: string;
  lat: number;
  lng: number;
  source: SourceType;
  severity: "critical" | "high" | "moderate";
  pm25_contribution: number; // µg/m³ above baseline
  co2_tonnes_day: number;
  detected_by: "flight_sensor" | "ground_sensor" | "satellite";
  detected_at: string;
  description: string;
  status: "active" | "contained" | "monitoring";
  drone_dispatched: boolean;
}

const SOURCE_META: Record<SourceType, { icon: string; label: string; color: string; bg: string }> = {
  construction:  { icon: "🏗️", label: "Construction Dust", color: "#C9A84C", bg: "#FFFBEB" },
  fire:          { icon: "🔥", label: "Open Fire / Burning", color: "#C0392B", bg: "#FFF5F5" },
  industrial:    { icon: "🏭", label: "Industrial Emission", color: "#7B241C", bg: "#FDF2F8" },
  stubble:       { icon: "🌾", label: "Stubble Burning", color: "#E67E22", bg: "#FEF9F0" },
  vehicle:       { icon: "🚛", label: "Heavy Traffic / Vehicles", color: "#1A5276", bg: "#EBF5FB" },
  waste:         { icon: "♻️", label: "Waste / Landfill", color: "#6C3483", bg: "#F5EEF8" },
};

const SEVERITY_META: Record<string, { color: string; label: string }> = {
  critical: { color: "#C0392B", label: "CRITICAL" },
  high:     { color: "#E67E22", label: "HIGH" },
  moderate: { color: "#FFC000", label: "MODERATE" },
};

const DETECTOR_META: Record<string, { icon: string; label: string }> = {
  flight_sensor: { icon: "✈️", label: "Flight Sensor (Aerial)" },
  ground_sensor: { icon: "📡", label: "Ground CPCB Sensor" },
  satellite:     { icon: "🛰️", label: "Satellite Imagery" },
};

/* ─── Mock incident data ─── */
const EMISSION_EVENTS: EmissionEvent[] = [
  {
    id: "EV001", zone: "Anand Vihar", area: "East Delhi", lat: 28.6469, lng: 77.3164,
    source: "vehicle", severity: "critical",
    pm25_contribution: 178, co2_tonnes_day: 42.3,
    detected_by: "flight_sensor", detected_at: "09:15 AM",
    description: "Severe vehicular congestion near ISBT Anand Vihar. Diesel trucks queued for 2.4km detected by flight sensor at 1,800ft altitude. PM2.5 spike 340% above baseline.",
    status: "active", drone_dispatched: true,
  },
  {
    id: "EV002", zone: "Punjabi Bagh", area: "West Delhi", lat: 28.6676, lng: 77.1290,
    source: "construction", severity: "critical",
    pm25_contribution: 142, co2_tonnes_day: 8.7,
    detected_by: "flight_sensor", detected_at: "08:40 AM",
    description: "Large-scale construction site (Metro Phase-4 extension). Visible dust plume extending 1.2km NE detected aerially. No dust suppression systems active.",
    status: "active", drone_dispatched: true,
  },
  {
    id: "EV003", zone: "Shahdara", area: "East Delhi", lat: 28.6725, lng: 77.2893,
    source: "waste", severity: "high",
    pm25_contribution: 98, co2_tonnes_day: 14.1,
    detected_by: "satellite", detected_at: "07:30 AM",
    description: "Ghazipur landfill methane flaring detected. Smoke plume crossing into Shahdara residential zone. CO concentration: 4.2x safe limit.",
    status: "active", drone_dispatched: false,
  },
  {
    id: "EV004", zone: "Okhla", area: "South East Delhi", lat: 28.5309, lng: 77.2710,
    source: "industrial", severity: "high",
    pm25_contribution: 86, co2_tonnes_day: 31.6,
    detected_by: "flight_sensor", detected_at: "06:55 AM",
    description: "Industrial cluster Okhla Phase-2: 3 factories detected with non-compliant stack emissions. NO₂ anomaly flagged by AI flight sensor at 2,200ft.",
    status: "monitoring", drone_dispatched: true,
  },
  {
    id: "EV005", zone: "RK Puram", area: "South West Delhi", lat: 28.5634, lng: 77.1740,
    source: "fire", severity: "high",
    pm25_contribution: 74, co2_tonnes_day: 5.2,
    detected_by: "ground_sensor", detected_at: "10:20 AM",
    description: "Open burning event in sector 8 RK Puram — waste paper/cardboard. Ground sensor triggered alert. Estimated duration: 45 min ongoing.",
    status: "contained", drone_dispatched: false,
  },
  {
    id: "EV006", zone: "Dwarka", area: "South West Delhi", lat: 28.5921, lng: 77.0460,
    source: "construction", severity: "moderate",
    pm25_contribution: 52, co2_tonnes_day: 4.8,
    detected_by: "flight_sensor", detected_at: "11:00 AM",
    description: "Residential construction (Dwarka Sec 21). Insufficient dust netting. Flight sensor at 1,500ft detected fine particulate spread over 400m radius.",
    status: "monitoring", drone_dispatched: false,
  },
  {
    id: "EV007", zone: "ITO / Central", area: "Central Delhi", lat: 28.6289, lng: 77.2414,
    source: "vehicle", severity: "moderate",
    pm25_contribution: 44, co2_tonnes_day: 18.9,
    detected_by: "ground_sensor", detected_at: "08:00 AM",
    description: "Peak hour vehicle density at ITO intersection — one of highest NO₂ readings in city. 14 lanes of traffic detected with heavy diesel vehicle mix.",
    status: "monitoring", drone_dispatched: false,
  },
  {
    id: "EV008", zone: "IGI Airport Belt", area: "South West Delhi", lat: 28.5562, lng: 77.0882,
    source: "industrial", severity: "moderate",
    pm25_contribution: 38, co2_tonnes_day: 22.4,
    detected_by: "flight_sensor", detected_at: "07:10 AM",
    description: "Aviation fuel combustion + APU emissions during ground operations. Normal for airport zone but contributing to elevated CO levels in nearby residential areas.",
    status: "monitoring", drone_dispatched: false,
  },
];

/* ─── Source summary stats ─── */
function SourceSummary({ events }: { events: EmissionEvent[] }) {
  const counts = events.reduce((acc, e) => {
    acc[e.source] = (acc[e.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      {(Object.keys(counts) as SourceType[]).map(src => {
        const meta = SOURCE_META[src];
        return (
          <div key={src} style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: meta.bg, border: `1px solid ${meta.color}30`,
            borderRadius: "20px", padding: "5px 12px", fontSize: "12px",
          }}>
            <span>{meta.icon}</span>
            <span style={{ fontWeight: 600, color: meta.color }}>{counts[src]}</span>
            <span style={{ color: "#4A5568" }}>{meta.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Component ─── */
export default function ZonePollutionSources() {
  const [selectedSource, setSelectedSource] = useState<SourceType | "all">("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<EmissionEvent | null>(null);
  const [dispatchedIds, setDispatchedIds] = useState<string[]>([]);

  const filtered = EMISSION_EVENTS.filter(e =>
    (selectedSource === "all" || e.source === selectedSource) &&
    (selectedSeverity === "all" || e.severity === selectedSeverity)
  );

  const totalPM25 = EMISSION_EVENTS.reduce((s, e) => s + e.pm25_contribution, 0);
  const totalCO2 = EMISSION_EVENTS.reduce((s, e) => s + e.co2_tonnes_day, 0);
  const criticalCount = EMISSION_EVENTS.filter(e => e.severity === "critical").length;
  const flightDetected = EMISSION_EVENTS.filter(e => e.detected_by === "flight_sensor").length;

  const dispatchDrone = (eventId: string) => {
    setDispatchedIds(prev => [...prev, eventId]);
  };

  return (
    <div style={{
      backgroundImage: "radial-gradient(circle, #c8d6e8 1px, transparent 1px)",
      backgroundSize: "28px 28px",
      backgroundColor: "#F4F6FA",
      minHeight: "100vh",
      padding: "28px",
    }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>

        {/* ─── Hero Header ─── */}
        <div style={{
          background: "linear-gradient(135deg, #0D1B2A 0%, #1A3A5C 65%, #7B241C 100%)",
          borderRadius: "16px", padding: "24px 28px", marginBottom: "24px",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px",
        }}>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.25em", color: "#C9A84C", marginBottom: "8px" }}>
              ⬡ AIRGRID OS · EMISSION ESTIMATOR
            </div>
            <h1 style={{ color: "white", fontSize: "24px", fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
              Zone Pollution Source Identification
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "6px", margin: "6px 0 0" }}>
              AI-assisted detection of construction, fire, industrial & vehicular emission events via flight sensors · Satellite · CPCB ground network
            </p>
            <div style={{ marginTop: "10px", display: "inline-block", padding: "4px 12px", background: "rgba(192,57,43,0.2)", border: "1px solid rgba(192,57,43,0.4)", borderRadius: "20px", fontSize: "11px", color: "#FF8A80" }}>
              ⚠️ DEMO MODE — Data simulates aerial sensor readings from flight corridors over Delhi
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { label: "Total PM2.5 Added", value: `+${totalPM25}`, unit: "µg/m³", color: "#C0392B" },
              { label: "CO₂ Today", value: totalCO2.toFixed(0), unit: "tonnes", color: "#E67E22" },
              { label: "Critical Events", value: criticalCount, unit: "zones", color: "#FF6B6B" },
              { label: "Flight-Detected", value: flightDetected, unit: "events", color: "#00f5d4" },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.08)", borderRadius: "10px", padding: "12px 16px",
                border: "1px solid rgba(255,255,255,0.12)", textAlign: "center", minWidth: "90px",
              }}>
                <div style={{ fontSize: "9px", color: "#8A9BB0", textTransform: "uppercase", letterSpacing: "0.12em" }}>{s.label}</div>
                <div style={{ fontFamily: "monospace", fontSize: "1.4rem", fontWeight: 900, color: s.color, lineHeight: 1.1, marginTop: "4px" }}>{s.value}</div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>{s.unit}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Source type legend ─── */}
        <div style={{ background: "white", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px", border: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A9BB0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
            Detection Summary — Today 06:00–{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}
          </div>
          <SourceSummary events={EMISSION_EVENTS} />
        </div>

        {/* ─── Filters ─── */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#8A9BB0", textTransform: "uppercase" }}>Source:</span>
            {(["all", ...Object.keys(SOURCE_META)] as (SourceType | "all")[]).map(src => {
              const meta = src === "all" ? null : SOURCE_META[src];
              return (
                <button
                  key={src}
                  onClick={() => setSelectedSource(src)}
                  style={{
                    padding: "5px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                    border: "1px solid",
                    borderColor: selectedSource === src ? (meta?.color ?? "#0D1B2A") : "#E2E8F0",
                    background: selectedSource === src ? (meta?.color ?? "#0D1B2A") : "white",
                    color: selectedSource === src ? "white" : "#8A9BB0",
                    cursor: "pointer",
                  }}
                >
                  {meta ? `${meta.icon} ${meta.label.split(" ")[0]}` : "All"}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#8A9BB0", textTransform: "uppercase" }}>Severity:</span>
            {["all", "critical", "high", "moderate"].map(sev => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                style={{
                  padding: "5px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                  border: "1px solid",
                  borderColor: selectedSeverity === sev ? (SEVERITY_META[sev]?.color ?? "#0D1B2A") : "#E2E8F0",
                  background: selectedSeverity === sev ? (SEVERITY_META[sev]?.color ?? "#0D1B2A") : "white",
                  color: selectedSeverity === sev ? "white" : "#8A9BB0",
                  cursor: "pointer",
                }}
              >
                {sev.charAt(0).toUpperCase() + sev.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: "auto", fontSize: "12px", color: "#8A9BB0", fontFamily: "monospace" }}>
            {filtered.length} event{filtered.length !== 1 ? "s" : ""} shown
          </div>
        </div>

        {/* ─── Main content: event cards + detail ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: "20px", alignItems: "start" }}>

          {/* Event cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {filtered.map(event => {
              const src = SOURCE_META[event.source];
              const sev = SEVERITY_META[event.severity];
              const det = DETECTOR_META[event.detected_by];
              const isSelected = selectedEvent?.id === event.id;
              const isDroneDispatched = event.drone_dispatched || dispatchedIds.includes(event.id);

              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(isSelected ? null : event)}
                  style={{
                    background: "white",
                    border: isSelected ? `2px solid ${sev.color}` : "1px solid #E2E8F0",
                    borderLeft: `6px solid ${sev.color}`,
                    borderRadius: "12px",
                    overflow: "hidden",
                    cursor: "pointer",
                    boxShadow: isSelected ? `0 6px 24px ${sev.color}25` : "0 1px 4px rgba(13,27,42,0.06)",
                    transition: "all 0.2s",
                  }}
                >
                  {/* Card header */}
                  <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      {/* Source icon */}
                      <div style={{
                        width: "42px", height: "42px", borderRadius: "10px", display: "flex",
                        alignItems: "center", justifyContent: "center", fontSize: "20px",
                        background: src.bg, border: `1px solid ${src.color}30`, flexShrink: 0,
                      }}>
                        {src.icon}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, color: "#0D1B2A", fontSize: "14px" }}>{event.zone}</span>
                          <span style={{
                            fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px",
                            background: `${sev.color}15`, color: sev.color, border: `1px solid ${sev.color}30`,
                          }}>
                            ● {sev.label}
                          </span>
                          {event.status === "contained" && (
                            <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: "#F0FFF4", color: "#1E8449", border: "1px solid #C6F6D5" }}>
                              ✓ CONTAINED
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "12px", color: "#8A9BB0", marginTop: "2px" }}>
                          {event.area} · {src.label}
                        </div>
                        <div style={{ fontSize: "12px", color: "#4A5568", marginTop: "6px", lineHeight: 1.5 }}>
                          {event.description}
                        </div>
                      </div>
                    </div>

                    {/* Right stats */}
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "12px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: "1.4rem", fontWeight: 900, color: sev.color, lineHeight: 1 }}>
                        +{event.pm25_contribution}
                      </div>
                      <div style={{ fontSize: "10px", color: "#8A9BB0" }}>µg/m³ PM2.5</div>
                      <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#E67E22", marginTop: "4px", fontWeight: 700 }}>
                        {event.co2_tonnes_day}t CO₂
                      </div>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div style={{
                    padding: "8px 16px", background: "#F8FAFF", borderTop: "1px solid #EEF2F7",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "#8A9BB0" }}>
                        {det.icon} <strong style={{ color: "#4A5568" }}>{det.label}</strong>
                      </span>
                      <span style={{ fontSize: "11px", color: "#8A9BB0" }}>
                        🕐 Detected {event.detected_at}
                      </span>
                      <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#8A9BB0" }}>
                        {event.id}
                      </span>
                    </div>
                    {isDroneDispatched ? (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#0F8B8D", display: "flex", alignItems: "center", gap: "4px" }}>
                        🚁 Drone Dispatched
                      </span>
                    ) : (
                      <button
                        onClick={e => { e.stopPropagation(); dispatchDrone(event.id); }}
                        style={{
                          fontSize: "11px", fontWeight: 700, color: "#C0392B",
                          background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.2)",
                          borderRadius: "6px", padding: "4px 10px", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: "4px",
                        }}
                      >
                        🚁 Dispatch Drone
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── Detail panel ─── */}
          <div style={{ position: "sticky", top: "16px" }}>
            {!selectedEvent ? (
              <div style={{
                background: "white", borderRadius: "14px", border: "1px solid #E2E8F0",
                padding: "40px 24px", textAlign: "center",
              }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
                <div style={{ fontWeight: 700, color: "#0D1B2A", fontSize: "16px" }}>Select an Event</div>
                <div style={{ color: "#8A9BB0", fontSize: "13px", marginTop: "6px" }}>
                  Click any emission event to view full analysis, source attribution, and recommended action.
                </div>
                {/* flight detection explanation */}
                <div style={{ marginTop: "24px", textAlign: "left", padding: "16px", background: "#F0FDFC", borderRadius: "10px", border: "1px solid #B2EBF2" }}>
                  <div style={{ fontWeight: 700, color: "#0F8B8D", fontSize: "13px", marginBottom: "8px" }}>✈️ How Flight Detection Works</div>
                  <ul style={{ fontSize: "12px", color: "#4A5568", lineHeight: 1.8, paddingLeft: "16px", margin: 0 }}>
                    <li>Aircraft equipped with AQI sensors fly standard corridors over Delhi</li>
                    <li>Onboard spectrometers detect PM2.5, NO₂, CO, SO₂ in real-time</li>
                    <li>Geo-tagged readings pinpoint emission plumes to within 50m</li>
                    <li>AI cross-references with satellite & ground data to identify source</li>
                    <li>Alert triggers drone deployment for on-ground investigation</li>
                  </ul>
                </div>
              </div>
            ) : (
              (() => {
                const src = SOURCE_META[selectedEvent.source];
                const sev = SEVERITY_META[selectedEvent.severity];
                const det = DETECTOR_META[selectedEvent.detected_by];
                const isDroneDispatched = selectedEvent.drone_dispatched || dispatchedIds.includes(selectedEvent.id);
                return (
                  <div style={{ background: "white", borderRadius: "14px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                    {/* Header */}
                    <div style={{ background: `linear-gradient(135deg, #0D1B2A, #1A3A5C)`, padding: "18px 20px", borderBottom: `3px solid ${sev.color}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: "9px", fontFamily: "monospace", color: "#C9A84C", letterSpacing: "0.2em" }}>INCIDENT {selectedEvent.id}</div>
                          <div style={{ color: "white", fontWeight: 700, fontSize: "17px", marginTop: "4px" }}>{selectedEvent.zone}</div>
                          <div style={{ color: "#8A9BB0", fontSize: "12px" }}>{selectedEvent.area} · {src.label}</div>
                        </div>
                        <button onClick={() => setSelectedEvent(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "16px" }}>×</button>
                      </div>
                    </div>

                    <div style={{ padding: "20px" }}>
                      {/* Severity + status */}
                      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", background: `${sev.color}15`, color: sev.color, border: `1px solid ${sev.color}30` }}>
                          ● {sev.label}
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", background: src.bg, color: src.color, border: `1px solid ${src.color}30` }}>
                          {src.icon} {src.label}
                        </span>
                        <span style={{
                          fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px",
                          background: selectedEvent.status === "active" ? "#FFF5F5" : selectedEvent.status === "contained" ? "#F0FFF4" : "#F0F9FF",
                          color: selectedEvent.status === "active" ? "#C0392B" : selectedEvent.status === "contained" ? "#1E8449" : "#0F8B8D",
                        }}>
                          {selectedEvent.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Emission metrics */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                        {[
                          { label: "PM2.5 Contribution", value: `+${selectedEvent.pm25_contribution} µg/m³`, color: sev.color },
                          { label: "CO₂ Load (Today)", value: `${selectedEvent.co2_tonnes_day} tonnes`, color: "#E67E22" },
                          { label: "Detection Method", value: det.icon + " " + det.label, color: "#0F8B8D" },
                          { label: "Detected At", value: selectedEvent.detected_at, color: "#4A5568" },
                        ].map(m => (
                          <div key={m.label} style={{ background: "#F8FAFF", borderRadius: "8px", padding: "12px" }}>
                            <div style={{ fontSize: "10px", color: "#8A9BB0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.label}</div>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: m.color, marginTop: "4px" }}>{m.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Full description */}
                      <div style={{ padding: "12px", background: "#FAFBFF", borderRadius: "10px", border: "1px solid #E2E8F0", marginBottom: "16px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A9BB0", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Event Description</div>
                        <div style={{ fontSize: "13px", color: "#0D1B2A", lineHeight: 1.7 }}>{selectedEvent.description}</div>
                      </div>

                      {/* Estimated health impact */}
                      <div style={{ padding: "12px", background: "#FFF5F5", borderRadius: "10px", border: "1px solid rgba(192,57,43,0.15)", marginBottom: "16px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#C0392B", marginBottom: "8px" }}>⚕️ Estimated Health Impact</div>
                        <div style={{ fontSize: "12px", color: "#4A5568", lineHeight: 1.7 }}>
                          <div>• Population at risk: <strong>{Math.round(selectedEvent.pm25_contribution * 800).toLocaleString()} residents</strong></div>
                          <div>• Respiratory risk index: <strong style={{ color: sev.color }}>{selectedEvent.severity === "critical" ? "Very High" : selectedEvent.severity === "high" ? "High" : "Moderate"}</strong></div>
                          <div>• Vulnerable groups (elderly/children): <strong>Avoid outdoor exposure</strong></div>
                        </div>
                      </div>

                      {/* Recommended actions */}
                      <div style={{ padding: "12px", background: "#F0FDFC", borderRadius: "10px", border: "1px solid rgba(15,139,141,0.2)", marginBottom: "16px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#0F8B8D", marginBottom: "8px" }}>📋 Recommended Actions</div>
                        <div style={{ fontSize: "12px", color: "#0D1B2A", lineHeight: 1.8 }}>
                          {selectedEvent.source === "construction" && <>
                            <div>1. Issue stop-work notice until dust suppression active</div>
                            <div>2. Require water sprinkler system installation</div>
                            <div>3. Deploy drone for daily compliance monitoring</div>
                          </>}
                          {selectedEvent.source === "fire" && <>
                            <div>1. Notify Delhi Fire Service & ward officer immediately</div>
                            <div>2. Cordon 200m safety radius</div>
                            <div>3. Issue air quality advisory for 1km radius</div>
                          </>}
                          {selectedEvent.source === "industrial" && <>
                            <div>1. Trigger DPCC surprise inspection</div>
                            <div>2. Review NOC/stack emission compliance</div>
                            <div>3. Issue show-cause notice if violations confirmed</div>
                          </>}
                          {selectedEvent.source === "vehicle" && <>
                            <div>1. Traffic police odd-even enforcement request</div>
                            <div>2. Restrict heavy diesel vehicles 08:00–20:00</div>
                            <div>3. Deploy anti-smog gun at junction</div>
                          </>}
                          {selectedEvent.source === "waste" && <>
                            <div>1. MCD landfill management team alert</div>
                            <div>2. Initiate biogas capture protocol</div>
                            <div>3. Request NGT emergency intervention</div>
                          </>}
                          {selectedEvent.source === "stubble" && <>
                            <div>1. Coordinate with revenue department for field ID</div>
                            <div>2. Issue FIR under Air Act 1981</div>
                            <div>3. Deploy bio-decomposer support teams</div>
                          </>}
                        </div>
                      </div>

                      {/* Drone dispatch */}
                      {isDroneDispatched ? (
                        <div style={{ padding: "12px 16px", background: "rgba(15,139,141,0.08)", borderRadius: "10px", border: "1px solid rgba(15,139,141,0.25)", display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "24px" }}>🚁</span>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0F8B8D", fontSize: "13px" }}>Drone Dispatched</div>
                            <div style={{ fontSize: "11px", color: "#8A9BB0", marginTop: "2px" }}>Monitoring drone en-route to {selectedEvent.zone}. ETA ~12 minutes.</div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => dispatchDrone(selectedEvent.id)}
                          style={{
                            width: "100%", padding: "12px",
                            background: "linear-gradient(90deg, #C0392B, #7B241C)",
                            color: "white", border: "none", borderRadius: "8px",
                            fontWeight: 700, fontSize: "14px", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                          }}
                        >
                          🚁 Dispatch Monitoring Drone to {selectedEvent.zone}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
