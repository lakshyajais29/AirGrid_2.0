"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

/* ── Types ── */
interface StationHistory {
  aqi: number[];
  pm25: number[];
  pm10: number[];
  no2: number[];
  co: number[];
  o3: number[];
  so2: number[];
}

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
  history: StationHistory | null;
}

type Pollutant = "pm25" | "pm10" | "no2" | "co" | "o3" | "so2";
type TimeRange = "now" | "-6h" | "-12h" | "-24h";
type SortField = "name" | "aqi" | "pm25" | "no2" | "co" | "o3" | "updated";
type SortDir = "asc" | "desc";

const POLLUTANT_LABELS: Record<Pollutant, { label: string; unit: string }> = {
  pm25: { label: "PM2.5", unit: "µg/m³" },
  pm10: { label: "PM10",  unit: "µg/m³" },
  no2:  { label: "NO₂",   unit: "ppb" },
  co:   { label: "CO",    unit: "mg/m³" },
  o3:   { label: "O₃",    unit: "ppb" },
  so2:  { label: "SO₂",   unit: "ppb" },
};

const TIME_OFFSETS: Record<TimeRange, number> = {
  now:   0,
  "-6h":  6,
  "-12h": 12,
  "-24h": 24,
};

/* ── Helpers ── */
function aqiColor(aqi: number): string {
  if (aqi <= 50)  return "var(--safe-green)";
  if (aqi <= 100) return "#A8D08D";
  if (aqi <= 200) return "#FFC000";
  if (aqi <= 300) return "var(--critical-red)";
  return "#800000";
}

function aqiCategory(aqi: number): string {
  if (aqi <= 50)  return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 200) return "Moderate";
  if (aqi <= 300) return "Poor";
  if (aqi <= 400) return "Very Poor";
  return "Severe";
}

function freshnessColor(minutes: number): string {
  if (minutes <= 5) return "var(--safe-green)";
  if (minutes <= 15) return "#FFC000";
  return "var(--critical-red)";
}

function freshnessLabel(minutes: number): string {
  if (minutes <= 5)  return "Live";
  if (minutes <= 15) return "Delayed";
  return "Offline";
}

/* ── Heatmap layer component ── */
function HeatmapLayer({ stations, pollutant }: { stations: Station[]; pollutant: Pollutant }) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Dynamically import leaflet.heat
      try {
        await import("leaflet.heat" as string);
      } catch {
        // leaflet.heat not installed — skip heatmap
        return;
      }

      if (cancelled) return;

      const L = (await import("leaflet")).default;
      const points = stations
        .filter((s) => s[pollutant] != null)
        .map((s) => [s.lat, s.lng, (s[pollutant] as number) / 300] as [number, number, number]);

      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const heat = (L as any).heatLayer(points, {
        radius: 40,
        blur: 30,
        maxZoom: 14,
        max: 1.0,
        gradient: {
          0.2: "#1E8449",
          0.4: "#A8D08D",
          0.6: "#FFC000",
          0.8: "#C0392B",
          1.0: "#800000",
        },
      });
      heat.addTo(map);
      layerRef.current = heat;
    })();

    return () => {
      cancelled = true;
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, stations, pollutant]);

  return null;
}

/* ── Custom Map Overlays ── */
function MapBrandBadge() {
  const map = useMap();
  const controlRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      const L = (await import("leaflet")).default;

      if (controlRef.current) {
        map.removeControl(controlRef.current);
      }

      const CustomControl = L.Control.extend({
        options: { position: "topleft" },
        onAdd: function () {
          const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
          div.innerHTML = "AIRGRID OS";
          div.style.background = "rgba(13,27,42,0.85)";
          div.style.color = "white";
          div.style.fontFamily = "monospace";
          div.style.padding = "6px 12px";
          div.style.borderRadius = "6px";
          div.style.border = "1px solid rgba(0,245,212,0.3)";
          div.style.fontSize = "12px";
          div.style.fontWeight = "bold";
          div.style.pointerEvents = "none";
          return div;
        },
      });

      const control = new CustomControl();
      control.addTo(map);
      controlRef.current = control;
    })();

    return () => {
      cancelled = true;
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
    };
  }, [map]);

  return null;
}

function StatusOverlayBadge({ source }: { source: string }) {
  const map = useMap();
  const controlRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      const L = (await import("leaflet")).default;

      if (controlRef.current) {
        map.removeControl(controlRef.current);
      }

      const CustomControl = L.Control.extend({
        options: { position: "topright" },
        onAdd: function () {
          const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
          div.innerHTML = source === "waqi" ? "<span class='live-dot'></span> WAQI Live" : "<span class='live-dot'></span> Mock Data";
          div.style.background = "rgba(13,27,42,0.85)";
          div.style.color = source === "waqi" ? "var(--safe-green)" : "var(--gov-gold)";
          div.style.fontFamily = "monospace";
          div.style.padding = "4px 8px";
          div.style.borderRadius = "6px";
          div.style.border = "1px solid rgba(0,245,212,0.3)";
          div.style.fontSize = "10px";
          div.style.pointerEvents = "none";
          return div;
        },
      });

      const control = new CustomControl();
      control.addTo(map);
      controlRef.current = control;
    })();

    return () => {
      cancelled = true;
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
    };
  }, [map, source]);

  return null;
}

/* ── Main Component ── */
export default function PollutionMap() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>("");
  const [pollutant, setPollutant] = useState<Pollutant>("pm25");
  const [timeRange, setTimeRange] = useState<TimeRange>("now");
  const [sortField, setSortField] = useState<SortField>("aqi");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [lastFetch, setLastFetch] = useState<string>("");
  const [countdown, setCountdown] = useState(60);
  const [showHeatmap, setShowHeatmap] = useState(false);

  /* Fetch stations */
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/aqi");
      const data = await res.json();
      setStations(data.stations);
      setSource(data.source);
      setLastFetch(new Date().toLocaleTimeString("en-IN", { hour12: false }));
      setCountdown(60);
    } catch (err) {
      console.error("Failed to fetch AQI data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* Initial fetch + 60s refresh */
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /* Countdown timer */
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 60));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  /* Get display value: historical or live */
  const getDisplayStations = useMemo(() => {
    if (timeRange === "now") return stations;
    const offset = TIME_OFFSETS[timeRange];
    const idx = 24 - offset; // index into 25-element history array
    return stations.map((s) => {
      if (!s.history) return s;
      return {
        ...s,
        aqi:  s.history.aqi[idx]  ?? s.aqi,
        pm25: s.history.pm25[idx] ?? s.pm25,
        pm10: s.history.pm10[idx] ?? s.pm10,
        no2:  s.history.no2[idx]  ?? s.no2,
        co:   s.history.co[idx]   ?? s.co,
        o3:   s.history.o3[idx]   ?? s.o3,
        so2:  s.history.so2[idx]  ?? s.so2,
      };
    });
  }, [stations, timeRange]);

  /* Sorting */
  const sortedStations = useMemo(() => {
    const list = [...getDisplayStations];
    list.sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortField === "name") {
        av = a.name;
        bv = b.name;
      } else if (sortField === "updated") {
        av = new Date(a.updated).getTime();
        bv = new Date(b.updated).getTime();
      } else {
        av = (a[sortField] as number) ?? 0;
        bv = (b[sortField] as number) ?? 0;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [getDisplayStations, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function sortIcon(field: SortField) {
    if (sortField !== field) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  }

  /* CSV export */
  function exportCSV() {
    const headers = ["Station", "AQI", "PM2.5 (µg/m³)", "PM10 (µg/m³)", "NO₂ (ppb)", "CO (mg/m³)", "O₃ (ppb)", "SO₂ (ppb)", "Updated"];
    const rows = sortedStations.map((s) => [
      s.name,
      s.aqi,
      s.pm25 ?? "—",
      s.pm10 ?? "—",
      s.no2 ?? "—",
      s.co ?? "—",
      s.o3 ?? "—",
      s.so2 ?? "—",
      new Date(s.updated).toLocaleString("en-IN"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `delhi-aqi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div
            className="inline-block w-8 h-8 border-3 rounded-full animate-spin mb-3"
            style={{
              borderColor: "var(--mid-blue)",
              borderTopColor: "transparent",
            }}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Loading pollution data…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Control Bar ── */}
      <div
        className="rounded-lg p-4 flex flex-wrap items-center gap-4"
        style={{ background: "white", border: "1px solid #E2E8F0" }}
      >
        {/* Pollutant Selector */}
        <div className="flex items-center gap-1">
          <span
            className="text-xs font-semibold mr-2 uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Pollutant
          </span>
          {(Object.keys(POLLUTANT_LABELS) as Pollutant[]).map((p) => (
            <button
              key={p}
              onClick={() => setPollutant(p)}
              className="px-3 py-1.5 text-xs font-medium rounded transition-colors"
              style={{
                background: pollutant === p ? "var(--mid-blue)" : "#F1F5F9",
                color: pollutant === p ? "#fff" : "var(--text-primary)",
                border: pollutant === p ? "1px solid var(--mid-blue)" : "1px solid #E2E8F0",
              }}
            >
              {POLLUTANT_LABELS[p].label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6" style={{ background: "#E2E8F0" }} />

        {/* Time Range */}
        <div className="flex items-center gap-1">
          <span
            className="text-xs font-semibold mr-2 uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Time
          </span>
          {(["now", "-6h", "-12h", "-24h"] as TimeRange[]).map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className="px-3 py-1.5 text-xs font-medium rounded transition-colors"
              style={{
                background: timeRange === t ? "var(--navy)" : "#F1F5F9",
                color: timeRange === t ? "#fff" : "var(--text-primary)",
                border: timeRange === t ? "1px solid var(--navy)" : "1px solid #E2E8F0",
              }}
            >
              {t === "now" ? "Now" : t}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6" style={{ background: "#E2E8F0" }} />

        {/* Heatmap Toggle */}
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="px-3 py-1.5 text-xs font-medium rounded transition-colors"
          style={{
            background: showHeatmap ? "var(--accent-teal)" : "#F1F5F9",
            color: showHeatmap ? "#fff" : "var(--text-primary)",
            border: showHeatmap ? "1px solid var(--accent-teal)" : "1px solid #E2E8F0",
          }}
        >
          Heatmap
        </button>

        {/* Right side: status */}
        <div className="ml-auto flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="font-mono">
            {source === "waqi" ? <><span className="live-dot" /> WAQI Live</> : <><span className="live-dot" /> Mock Data</>}
          </span>
          <span className="font-mono">
            Refreshing in {countdown}s
          </span>
          <span className="font-mono">
            Last: {lastFetch}
          </span>
        </div>
      </div>

      {/* ── Map ── */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "1px solid #E2E8F0", height: "520px" }}
      >
        <MapContainer
          center={[28.6139, 77.2090]}
          zoom={isDemo ? 12 : 11}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {showHeatmap && (
            <HeatmapLayer stations={getDisplayStations} pollutant={pollutant} />
          )}

          <MapBrandBadge />
          <StatusOverlayBadge source={source} />

          {getDisplayStations.map((s) => {
            const displayVal = s[pollutant];
            const markerColor = aqiColor(s.aqi);
            return (
              <CircleMarker
                key={s.id}
                center={[s.lat, s.lng]}
                radius={20}
                pathOptions={{
                  fillColor: markerColor,
                  fillOpacity: 0.85,
                  color: "#fff",
                  weight: 2,
                }}
              >
                <Tooltip permanent direction="top" offset={[0, -22]} opacity={1}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#0D1B2A' }}>
                      {s.name}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: '#fff',
                      background: markerColor,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      lineHeight: '1.4',
                    }}>
                      {s.aqi}
                    </span>
                  </span>
                </Tooltip>
                <Popup maxWidth={340} minWidth={280}>
                  <div style={{ fontFamily: "var(--font-body)" }}>
                    {/* Header */}
                    <div
                      className="flex items-center justify-between mb-2 pb-2"
                      style={{ borderBottom: "1px solid #E2E8F0" }}
                    >
                      <span className="font-semibold text-sm" style={{ color: "var(--navy)" }}>
                        {s.name}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ background: markerColor }}
                      >
                        AQI {s.aqi}
                      </span>
                    </div>

                    {/* Category */}
                    <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                      {aqiCategory(s.aqi)} ·{" "}
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                        style={{
                          background: freshnessColor(s.minutesAgo),
                          verticalAlign: "middle",
                        }}
                      />
                      {freshnessLabel(s.minutesAgo)} ({s.minutesAgo}m ago)
                    </p>

                    {/* Pollutant Table */}
                    <table
                      className="w-full text-xs"
                      style={{ borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                          <th className="text-left py-1 font-semibold" style={{ color: "var(--text-muted)" }}>
                            Pollutant
                          </th>
                          <th className="text-right py-1 font-semibold" style={{ color: "var(--text-muted)" }}>
                            Value
                          </th>
                          <th className="text-right py-1 font-semibold" style={{ color: "var(--text-muted)" }}>
                            Unit
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Object.keys(POLLUTANT_LABELS) as Pollutant[]).map(
                          (p) => (
                            <tr
                              key={p}
                              style={{
                                borderBottom: "1px solid #F1F5F9",
                                background: p === pollutant ? "#F0F9FF" : "transparent",
                              }}
                            >
                              <td className="py-1 font-medium" style={{ color: "var(--text-primary)" }}>
                                {POLLUTANT_LABELS[p].label}
                              </td>
                              <td
                                className="text-right py-1 font-mono font-semibold"
                                style={{ color: "var(--navy)" }}
                              >
                                {displayVal != null && p === pollutant
                                  ? displayVal
                                  : s[p] ?? "—"}
                              </td>
                              <td className="text-right py-1" style={{ color: "var(--text-muted)" }}>
                                {POLLUTANT_LABELS[p].unit}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* ── Legend ── */}
      <div
        className="flex flex-wrap items-center gap-4 px-4 py-2 rounded-lg text-xs"
        style={{ background: "white", border: "1px solid #E2E8F0" }}
      >
        <span className="font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          AQI Scale
        </span>
        {[
          { range: "0–50", color: "var(--safe-green)", label: "Good" },
          { range: "51–100", color: "#A8D08D", label: "Satisfactory" },
          { range: "101–200", color: "#FFC000", label: "Moderate" },
          { range: "201–300", color: "var(--critical-red)", label: "Poor" },
          { range: "301+", color: "#800000", label: "Severe" },
        ].map((l) => (
          <span key={l.range} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: l.color }}
            />
            <span style={{ color: "var(--text-primary)" }}>{l.range}</span>
            <span style={{ color: "var(--text-muted)" }}>{l.label}</span>
          </span>
        ))}

        <div className="w-px h-4 mx-2" style={{ background: "#E2E8F0" }} />

        <span className="font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Data Quality
        </span>
        {[
          { color: "var(--safe-green)", label: "Live (<5m)" },
          { color: "#FFC000", label: "Delayed" },
          { color: "var(--critical-red)", label: "Offline" },
        ].map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: l.color }}
            />
            <span style={{ color: "var(--text-muted)" }}>{l.label}</span>
          </span>
        ))}
      </div>

      {/* ── Station Comparison Table ── */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: "white", border: "1px solid #E2E8F0" }}
      >
        {/* Table Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid #E2E8F0" }}
        >
          <h3 className="text-base font-semibold" style={{ color: "var(--navy)" }}>
            Station Comparison
          </h3>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors"
            style={{
              background: "#F1F5F9",
              color: "var(--text-primary)",
              border: "1px solid #E2E8F0",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--mid-blue)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#F1F5F9";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {[
                  { field: "name" as SortField, label: "Station" },
                  { field: "aqi" as SortField, label: "AQI" },
                  { field: "pm25" as SortField, label: "PM2.5" },
                  { field: "no2" as SortField, label: "NO₂" },
                  { field: "co" as SortField, label: "CO" },
                  { field: "o3" as SortField, label: "O₃" },
                  { field: "updated" as SortField, label: "Updated" },
                ].map(({ field, label }) => (
                  <th
                    key={field}
                    className="text-left px-4 py-2.5 font-semibold cursor-pointer select-none whitespace-nowrap"
                    style={{
                      color: "var(--text-muted)",
                      borderBottom: "1px solid #E2E8F0",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                    onClick={() => toggleSort(field)}
                  >
                    {label}{" "}
                    <span className="text-[10px] opacity-60">{sortIcon(field)}</span>
                  </th>
                ))}
                <th
                  className="text-center px-4 py-2.5 font-semibold whitespace-nowrap"
                  style={{
                    color: "var(--text-muted)",
                    borderBottom: "1px solid #E2E8F0",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStations.map((s, i) => (
                <tr
                  key={s.id}
                  style={{
                    background: i % 2 === 0 ? "white" : "#FAFBFC",
                    borderBottom: "1px solid #F1F5F9",
                  }}
                  className="hover:bg-blue-50/40 transition-colors"
                >
                  <td className="px-4 py-2.5 font-medium" style={{ color: "var(--navy)" }}>
                    {s.name}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white font-mono"
                      style={{ background: aqiColor(s.aqi) }}
                    >
                      {s.aqi}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-sm" style={{ color: "var(--text-primary)" }}>
                    {s.pm25 ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-sm" style={{ color: "var(--text-primary)" }}>
                    {s.no2 ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-sm" style={{ color: "var(--text-primary)" }}>
                    {s.co ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-sm" style={{ color: "var(--text-primary)" }}>
                    {s.o3 ?? "—"}
                  </td>
                  <td
                    className="px-4 py-2.5 font-mono text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {new Date(s.updated).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ background: freshnessColor(s.minutesAgo) }}
                      />
                      <span style={{ color: "var(--text-muted)" }}>
                        {freshnessLabel(s.minutesAgo)}
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div
          className="flex items-center justify-between px-5 py-2.5 text-xs"
          style={{
            background: "#F8FAFC",
            borderTop: "1px solid #E2E8F0",
            color: "var(--text-muted)",
          }}
        >
          <span>
            {sortedStations.length} stations ·{" "}
            {timeRange === "now" ? "Real-time" : `Historical (${timeRange})`}
          </span>
          <span className="font-mono">
            Avg AQI:{" "}
            {Math.round(
              sortedStations.reduce((sum, s) => sum + s.aqi, 0) / sortedStations.length
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
