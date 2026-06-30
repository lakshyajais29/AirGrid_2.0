"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Clock, Map, Printer, FileText, Cpu } from "lucide-react";

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

/* ─── Delhi ward data (12 zones with station cross-reference) ─── */
const DELHI_ZONES = [
  { id: "Z01", name: "Anand Vihar", zone: "East Delhi", population: 312000, aviation_exposure: 3, dominant_pollutant: "PM2.5", lat: 28.6469, lng: 77.3164, stationName: "Anand Vihar" },
  { id: "Z02", name: "ITO / Central", zone: "Central Delhi", population: 198000, aviation_exposure: 4, dominant_pollutant: "NO₂", lat: 28.6289, lng: 77.2414, stationName: "ITO" },
  { id: "Z03", name: "Punjabi Bagh", zone: "West Delhi", population: 245000, aviation_exposure: 6, dominant_pollutant: "PM10", lat: 28.6676, lng: 77.1290, stationName: "Punjabi Bagh" },
  { id: "Z04", name: "RK Puram", zone: "South West Delhi", population: 178000, aviation_exposure: 8, dominant_pollutant: "PM2.5", lat: 28.5634, lng: 77.1740, stationName: "RK Puram" },
  { id: "Z05", name: "Dwarka", zone: "South West Delhi", population: 412000, aviation_exposure: 9, dominant_pollutant: "PM10", lat: 28.5921, lng: 77.0460, stationName: "Dwarka" },
  { id: "Z06", name: "Okhla", zone: "South East Delhi", population: 289000, aviation_exposure: 5, dominant_pollutant: "SO₂", lat: 28.5309, lng: 77.2710, stationName: "Okhla" },
  { id: "Z07", name: "Shahdara", zone: "East Delhi", population: 356000, aviation_exposure: 2, dominant_pollutant: "PM2.5", lat: 28.6725, lng: 77.2893, stationName: "Shahdara" },
  { id: "Z08", name: "IGI Airport Belt", zone: "South West Delhi", population: 94000, aviation_exposure: 10, dominant_pollutant: "CO", lat: 28.5562, lng: 77.0882, stationName: "IGI Airport" },
];

/* ─── Helpers ─── */
function aqiColor(aqi: number) {
  if (aqi <= 50)  return "#1E8449";
  if (aqi <= 100) return "#A8D08D";
  if (aqi <= 200) return "#FFC000";
  if (aqi <= 300) return "#C0392B";
  return "#7B241C";
}

function aqiLabel(aqi: number) {
  if (aqi <= 50)  return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 200) return "Moderate";
  if (aqi <= 300) return "Poor";
  if (aqi <= 400) return "Very Poor";
  return "Severe";
}

function exposureBarColor(score: number) {
  if (score >= 8) return "#C0392B";
  if (score >= 5) return "#FFC000";
  return "#1E8449";
}

function droneRec(aqi: number, exposure: number): string {
  if (aqi > 300 || exposure >= 9) return "Immediate drone deployment — critical pollution + high aviation impact.";
  if (aqi > 200 || exposure >= 7) return "Drone patrol recommended within 4h. Anti-smog gun activation advised.";
  if (aqi > 150 || exposure >= 5) return "Schedule drone inspection within 24h.";
  return "No immediate action required. Routine monitoring in 72h.";
}

/* ─── Zone card component ─── */
function ZoneCard({ zone, station, isSelected, onClick }: {
  zone: typeof DELHI_ZONES[0];
  station?: Station;
  isSelected: boolean;
  onClick: () => void;
}) {
  const aqi = station?.aqi ?? 0;
  const color = aqiColor(aqi);
  const label = aqiLabel(aqi);

  return (
    <div
      onClick={onClick}
      style={{
        border: isSelected ? `2px solid ${color}` : "1px solid #E2E8F0",
        borderLeft: `5px solid ${color}`,
        borderRadius: "12px",
        padding: "16px",
        cursor: "pointer",
        background: isSelected ? `${color}08` : "var(--surface)",
        transition: "all 0.2s",
        boxShadow: isSelected ? `0 4px 20px ${color}30` : "0 1px 4px rgba(13,27,42,0.06)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "14px" }}>{zone.name}</div>
          <div style={{ fontSize: "11px", color: "#8A9BB0", marginTop: "2px" }}>{zone.zone}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "monospace", fontSize: "1.6rem", fontWeight: 900, color, lineHeight: 1 }}>
            {station ? aqi : "—"}
          </div>
          <div style={{ fontSize: "10px", fontWeight: 700, color }}>{label}</div>
        </div>
      </div>

      <div style={{ marginTop: "12px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "10px", background: "#F1F5F9", borderRadius: "4px", padding: "2px 6px", color: "#4A5568" }}>
          PM2.5: {station?.pm25 ?? "—"}
        </span>
        <span style={{ fontSize: "10px", background: "#F1F5F9", borderRadius: "4px", padding: "2px 6px", color: "#4A5568" }}>
          NO₂: {station?.no2 ?? "—"}
        </span>
        <span style={{ fontSize: "10px", background: "#F1F5F9", borderRadius: "4px", padding: "2px 6px", color: "#C9A84C", display: "inline-flex", alignItems: "center", gap: "3px" }}>
          <Cpu size={10} />
          Exposure: {zone.aviation_exposure}/10
        </span>
      </div>

      <div style={{ marginTop: "10px", height: "4px", background: "#F1F5F9", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(100, (aqi / 400) * 100)}%`, background: color, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function WardsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<typeof DELHI_ZONES[0] | null>(null);
  const [sortBy, setSortBy] = useState<"aqi" | "exposure" | "name">("aqi");
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/aqi");
      const data = await res.json();
      setStations(data.stations);
      setSource(data.source);
      setLastUpdate(new Date().toLocaleTimeString("en-IN", { hour12: false }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 60_000);
    return () => clearInterval(t);
  }, [fetchData]);

  const getStation = (zoneName: string) =>
    stations.find(s => s.name === zoneName);

  const sortedZones = [...DELHI_ZONES].sort((a, b) => {
    if (sortBy === "aqi") return (getStation(b.stationName)?.aqi ?? 0) - (getStation(a.stationName)?.aqi ?? 0);
    if (sortBy === "exposure") return b.aviation_exposure - a.aviation_exposure;
    return a.name.localeCompare(b.name);
  });

  const selectedStation = selectedZone ? getStation(selectedZone.stationName) : null;
  const avgAqi = stations.length ? Math.round(stations.reduce((s, x) => s + x.aqi, 0) / stations.length) : 0;
  const critCount = stations.filter(s => s.aqi > 200).length;

  return (
    <div style={{
      backgroundImage: "radial-gradient(circle, #c8d6e8 1px, transparent 1px)",
      backgroundSize: "28px 28px",
      backgroundColor: "var(--page-bg)",
      minHeight: "100vh",
      padding: "28px",
    }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>

        {/* ── Page header ── */}
        <div style={{
          background: "linear-gradient(135deg, #0D1B2A 0%, #1A3A5C 70%, #0F8B8D 100%)",
          borderRadius: "16px", padding: "24px 28px", marginBottom: "24px",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px",
        }}>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.25em", color: "#C9A84C", marginBottom: "8px" }}>
              AIRGRID OS · WARD & ZONE ANALYSIS
            </div>
            <h1 style={{ color: "white", fontSize: "24px", fontWeight: 700, margin: 0 }}>Delhi Ward Air Quality Data</h1>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
              Real-time AQI · Aviation exposure · Drone deployment recommendations
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { label: "City Avg AQI", value: loading ? "—" : avgAqi, color: aqiColor(avgAqi) },
              { label: "Critical Zones", value: loading ? "—" : critCount, color: "#C0392B" },
              { label: "Data Source", value: source === "waqi" ? "LIVE" : "MOCK", color: source === "waqi" ? "#00f5d4" : "#FFC000" },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px 18px",
                border: "1px solid rgba(255,255,255,0.1)", textAlign: "center", minWidth: "80px",
              }}>
                <div style={{ fontSize: "10px", color: "#8A9BB0", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
                <div style={{ fontFamily: "monospace", fontSize: "1.4rem", fontWeight: 900, color: String(s.color) }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px", alignItems: "start" }}>

          {/* Left: zone grid */}
          <div>
            {/* Sort controls */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#8A9BB0", textTransform: "uppercase" }}>Sort by:</span>
              {(["aqi", "exposure", "name"] as const).map(k => (
                <button key={k} onClick={() => setSortBy(k)} style={{
                  padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                  border: "1px solid",
                  borderColor: sortBy === k ? "var(--text-primary)" : "var(--border-faint)",
                  background: sortBy === k ? "var(--text-primary)" : "var(--surface)",
                  color: sortBy === k ? "var(--page-bg)" : "var(--text-muted)",
                  cursor: "pointer",
                }}>
                  {k === "aqi" ? "AQI" : k === "exposure" ? "Aviation Exposure" : "Name"}
                </button>
              ))}
              {lastUpdate && (
                <span style={{ marginLeft: "auto", fontSize: "11px", color: "#8A9BB0", fontFamily: "monospace", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={10} /> Updated {lastUpdate}
                </span>
              )}
            </div>

            {/* Zone cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {sortedZones.map(zone => (
                <ZoneCard
                  key={zone.id}
                  zone={zone}
                  station={getStation(zone.stationName)}
                  isSelected={selectedZone?.id === zone.id}
                  onClick={() => setSelectedZone(z => z?.id === zone.id ? null : zone)}
                />
              ))}
            </div>

            {/* Zone comparison table */}
            <div style={{ marginTop: "24px", background: "var(--surface)", borderRadius: "14px", border: "1px solid var(--border-faint)", overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(90deg, #0D1B2A, #1A3A5C)", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#C9A84C", fontSize: "9px", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase" }}>Aviation Impact Rankings</div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: "15px", marginTop: "2px" }}>Zone Comparison Table</div>
                </div>
                <button onClick={() => window.print()} style={{
                  background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "6px", padding: "6px 14px", fontSize: "12px", cursor: "pointer",
                }}>
                  <Printer size={13} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                  Print Report
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFF" }}>
                      {["Rank", "Zone", "Area", "AQI", "PM2.5", "NO₂", "Exposure", "Status"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: h === "AQI" || h === "PM2.5" || h === "NO₂" || h === "Exposure" ? "right" : "left", fontWeight: 600, fontSize: "11px", color: "#8A9BB0", letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...DELHI_ZONES].sort((a, b) => (getStation(b.stationName)?.aqi ?? 0) - (getStation(a.stationName)?.aqi ?? 0)).map((zone, i) => {
                      const st = getStation(zone.stationName);
                      const aqi = st?.aqi ?? 0;
                      const color = aqiColor(aqi);
                      return (
                        <tr
                          key={zone.id}
                          onClick={() => setSelectedZone(z => z?.id === zone.id ? null : zone)}
                          style={{
                            background: selectedZone?.id === zone.id ? "var(--accent-light)" : i % 2 === 0 ? "var(--surface)" : "var(--surface-alt)",
                            borderBottom: "1px solid var(--border-faint)",
                            cursor: "pointer",
                            borderLeft: `4px solid ${color}`,
                          }}
                        >
                          <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 700, color: "#8A9BB0", fontSize: "12px" }}>#{i + 1}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-primary)" }}>{zone.name}</td>
                          <td style={{ padding: "10px 14px", color: "#8A9BB0", fontSize: "12px" }}>{zone.zone}</td>
                          <td style={{ padding: "10px 14px", textAlign: "right" }}>
                            <span style={{ fontFamily: "monospace", fontWeight: 800, color, background: `${color}15`, padding: "2px 10px", borderRadius: "12px" }}>{aqi || "—"}</span>
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "monospace", color: "#4A5568" }}>{st?.pm25 ?? "—"}</td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "monospace", color: "#4A5568" }}>{st?.no2 ?? "—"}</td>
                          <td style={{ padding: "10px 14px", textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                              <span style={{ fontFamily: "monospace", fontWeight: 700, color: exposureBarColor(zone.aviation_exposure) }}>{zone.aviation_exposure}/10</span>
                              <div style={{ width: "50px", height: "5px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${zone.aviation_exposure * 10}%`, background: exposureBarColor(zone.aviation_exposure) }} />
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, color, background: `${color}15`, padding: "2px 8px", borderRadius: "10px" }}>
                              {aqiLabel(aqi)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: detail panel */}
          <div style={{ position: "sticky", top: "16px" }}>
            {!selectedZone ? (
              <div style={{
                background: "var(--surface)", borderRadius: "14px", border: "1px solid var(--border-faint)",
                padding: "40px 24px", textAlign: "center",
              }}>
                <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}><Map size={40} color="#8A9BB0" /></div>
                <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "16px" }}>Select a Zone</div>
                <div style={{ color: "#8A9BB0", fontSize: "13px", marginTop: "6px" }}>
                  Click any zone card or table row to view detailed pollution analysis and drone recommendations.
                </div>
              </div>
            ) : (
              <div style={{ background: "var(--surface)", borderRadius: "14px", border: "1px solid var(--border-faint)", overflow: "hidden" }}>
                {/* Panel header */}
                <div style={{
                  background: `linear-gradient(135deg, #0D1B2A, #1A3A5C)`,
                  padding: "20px 20px 16px",
                  borderBottom: `3px solid ${aqiColor(selectedStation?.aqi ?? 0)}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: "9px", color: "#C9A84C", letterSpacing: "0.2em" }}>ZONE ANALYSIS</div>
                      <div style={{ color: "white", fontWeight: 700, fontSize: "18px", marginTop: "4px" }}>{selectedZone.name}</div>
                      <div style={{ color: "#8A9BB0", fontSize: "12px" }}>{selectedZone.zone}</div>
                    </div>
                    <button onClick={() => setSelectedZone(null)} style={{
                      background: "rgba(255,255,255,0.1)", border: "none", color: "white",
                      borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "16px",
                    }}>×</button>
                  </div>
                </div>

                <div style={{ padding: "20px" }}>
                  {/* AQI + exposure grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ background: "#F8FAFF", borderRadius: "10px", padding: "14px", border: `1px solid ${aqiColor(selectedStation?.aqi ?? 0)}30` }}>
                      <div style={{ fontSize: "10px", color: "#8A9BB0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Current AQI</div>
                      <div style={{ fontFamily: "monospace", fontSize: "2.2rem", fontWeight: 900, color: aqiColor(selectedStation?.aqi ?? 0), lineHeight: 1.1, marginTop: "4px" }}>
                        {selectedStation?.aqi ?? "—"}
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: aqiColor(selectedStation?.aqi ?? 0) }}>
                        {aqiLabel(selectedStation?.aqi ?? 0)}
                      </div>
                    </div>
                    <div style={{ background: "#FFFBEB", borderRadius: "10px", padding: "14px", border: "1px solid #FDE68A" }}>
                      <div style={{ fontSize: "10px", color: "#8A9BB0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Aviation Exposure</div>
                      <div style={{ fontFamily: "monospace", fontSize: "2.2rem", fontWeight: 900, color: exposureBarColor(selectedZone.aviation_exposure), lineHeight: 1.1, marginTop: "4px" }}>
                        {selectedZone.aviation_exposure}<span style={{ fontSize: "1rem", color: "#8A9BB0" }}>/10</span>
                      </div>
                      <div style={{ height: "4px", background: "#F1F5F9", borderRadius: "2px", marginTop: "6px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${selectedZone.aviation_exposure * 10}%`, background: exposureBarColor(selectedZone.aviation_exposure) }} />
                      </div>
                    </div>
                  </div>

                  {/* Pollutant breakdown */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A9BB0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Pollutant Breakdown</div>
                    {[
                      { label: "PM2.5 (µg/m³)", value: selectedStation?.pm25, max: 300 },
                      { label: "PM10 (µg/m³)", value: selectedStation?.pm10, max: 400 },
                      { label: "NO₂ (ppb)", value: selectedStation?.no2, max: 200 },
                      { label: "CO (mg/m³)", value: selectedStation?.co, max: 10 },
                      { label: "O₃ (ppb)", value: selectedStation?.o3, max: 100 },
                    ].map(p => (
                      <div key={p.label} style={{ marginBottom: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#4A5568", marginBottom: "4px" }}>
                          <span>{p.label}</span>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--text-primary)" }}>{p.value ?? "—"}</span>
                        </div>
                        {p.value != null && (
                          <div style={{ height: "5px", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min(100, (p.value / p.max) * 100)}%`, background: "#0F8B8D" }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Zone info */}
                  <div style={{ padding: "12px", background: "#F8FAFF", borderRadius: "10px", marginBottom: "16px", fontSize: "12px" }}>
                    {[
                      ["Population", selectedZone.population.toLocaleString()],
                      ["Dominant Pollutant", selectedZone.dominant_pollutant],
                      ["Last Updated", selectedStation ? `${selectedStation.minutesAgo}m ago` : "—"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #E2E8F0" }}>
                        <span style={{ color: "#8A9BB0" }}>{k}</span>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Drone recommendation */}
                  <div style={{
                    padding: "14px", borderRadius: "10px",
                    background: selectedStation && selectedStation.aqi > 300 ? "rgba(192,57,43,0.06)" : "rgba(15,139,141,0.06)",
                    border: `1px solid ${selectedStation && selectedStation.aqi > 300 ? "rgba(192,57,43,0.2)" : "rgba(15,139,141,0.2)"}`,
                  }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#8A9BB0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}>
                      <Cpu size={12} color="#8A9BB0" /> Drone Action Recommendation
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.6 }}>
                      {droneRec(selectedStation?.aqi ?? 0, selectedZone.aviation_exposure)}
                    </div>
                  </div>

                  {/* Report button */}
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/reports/ward", {
                          method: "POST",
                          body: JSON.stringify({ zoneId: selectedZone.id, name: selectedZone.name }),
                          headers: { "Content-Type": "application/json" },
                        });
                        const data = await res.json();
                        alert(data.success ? `Report: ${data.message}` : "Failed to generate report.");
                      } catch { alert("Error generating report."); }
                    }}
                    style={{
                      width: "100%", marginTop: "14px", padding: "11px",
                      background: "linear-gradient(90deg, #0D1B2A, #1A3A5C)",
                      color: "white", border: "none", borderRadius: "8px",
                      fontWeight: 700, fontSize: "13px", cursor: "pointer",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <FileText size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                     Generate Ward Report (PDF)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
