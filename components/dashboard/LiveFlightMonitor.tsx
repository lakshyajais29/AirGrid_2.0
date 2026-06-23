"use client"

import React, { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"

// Dynamically import Leaflet components to avoid SSR window errors
const MapContainer = dynamic(
  () => import("react-leaflet").then(m => m.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then(m => m.TileLayer),
  { ssr: false }
)
const CircleMarker = dynamic(
  () => import("react-leaflet").then(m => m.CircleMarker),
  { ssr: false }
)
const Popup = dynamic(
  () => import("react-leaflet").then(m => m.Popup),
  { ssr: false }
)
const Polyline = dynamic(
  () => import("react-leaflet").then(m => m.Polyline),
  { ssr: false }
)

import "leaflet/dist/leaflet.css"

interface Flight {
  id: string
  callsign: string
  origin: string
  destination: string
  origin_lat?: number
  origin_lon?: number
  dest_lat?: number
  dest_lon?: number
  altitude: number
  speed: number
  status?: "on-time" | "delayed" | "diverted"
  airline?: string
}

const mockFlights: Flight[] = [
  { id: "1", callsign: "AI-101", airline: "Air India", origin: "DEL", destination: "BOM", origin_lat: 28.5562, origin_lon: 77.0999, dest_lat: 19.0896, dest_lon: 72.8656, altitude: 35000, speed: 460, status: "on-time" },
  { id: "2", callsign: "SG-202", airline: "SpiceJet", origin: "MAA", destination: "BLR", origin_lat: 12.9941, origin_lon: 80.1709, dest_lat: 13.1986, dest_lon: 77.7066, altitude: 30000, speed: 430, status: "delayed" },
  { id: "3", callsign: "UK-303", airline: "Vistara", origin: "LHR", destination: "DEL", origin_lat: 51.4700, origin_lon: -0.4543, dest_lat: 28.5562, dest_lon: 77.0999, altitude: 38000, speed: 500, status: "on-time" },
]

function altitudeCategory(alt: number): { label: string; color: string } {
  if (alt >= 35000) return { label: "Cruising", color: "#0F8B8D" }
  if (alt >= 20000) return { label: "Climb/Descent", color: "#FFC000" }
  return { label: "Low Altitude", color: "#C0392B" }
}

function statusColor(status?: string) {
  if (status === "on-time") return "#1E8449"
  if (status === "delayed") return "#FFC000"
  if (status === "diverted") return "#C0392B"
  return "#8A9BB0"
}

// Map badge rendered imperatively (inside useMap context)
function MapBadgeInner({ count, csvLoaded }: { count: number; csvLoaded: boolean }) {
  const { useMap } = require("react-leaflet")
  const map = useMap()
  const controlRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return
      const L = (await import("leaflet")).default
      if (controlRef.current) map.removeControl(controlRef.current)
      const CustomControl = L.Control.extend({
        options: { position: "topleft" },
        onAdd: function () {
          const div = L.DomUtil.create("div", "leaflet-bar leaflet-control")
          div.innerHTML = `✈ ${count} FLIGHTS${csvLoaded ? " (CSV)" : " (DEMO)"}`
          div.style.background = "rgba(13,27,42,0.88)"
          div.style.color = "white"
          div.style.fontFamily = "monospace"
          div.style.padding = "6px 14px"
          div.style.borderRadius = "6px"
          div.style.border = csvLoaded ? "1px solid rgba(0,245,212,0.5)" : "1px solid rgba(201,168,76,0.4)"
          div.style.fontSize = "12px"
          div.style.fontWeight = "bold"
          div.style.pointerEvents = "none"
          return div
        },
      })
      const control = new CustomControl()
      control.addTo(map)
      controlRef.current = control
    })()
    return () => {
      cancelled = true
      if (controlRef.current) map.removeControl(controlRef.current)
    }
  }, [map, count, csvLoaded])
  return null
}

export const LiveFlightMonitor: React.FC = () => {
  const [flights, setFlights] = useState<Flight[]>(mockFlights)
  const [isMounted, setIsMounted] = useState(false)
  const [csvLoaded, setCsvLoaded] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"callsign" | "altitude" | "speed">("altitude")

  useEffect(() => { setIsMounted(true) }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    const records = lines.slice(1).map(line => {
      const cols = line.split(',')
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => obj[h] = cols[i]?.trim() || '')
      return {
        id: obj.id || Math.random().toString(),
        callsign: obj.callsign || '',
        airline: obj.airline || '',
        origin: obj.origin || '',
        destination: obj.destination || '',
        origin_lat: obj.origin_lat ? parseFloat(obj.origin_lat) : undefined,
        origin_lon: obj.origin_lon ? parseFloat(obj.origin_lon) : undefined,
        dest_lat: obj.dest_lat ? parseFloat(obj.dest_lat) : undefined,
        dest_lon: obj.dest_lon ? parseFloat(obj.dest_lon) : undefined,
        altitude: parseFloat(obj.altitude) || 0,
        speed: parseFloat(obj.speed) || 0,
        status: (obj.status as Flight["status"]) || "on-time",
      } as Flight
    })
    setFlights(records)
    setCsvLoaded(true)
  }

  const filteredFlights = flights
    .filter(f => filterStatus === "all" || f.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === "altitude") return b.altitude - a.altitude
      if (sortBy === "speed") return b.speed - a.speed
      return a.callsign.localeCompare(b.callsign)
    })

  const stats = {
    total: flights.length,
    onTime: flights.filter(f => f.status === "on-time").length,
    delayed: flights.filter(f => f.status === "delayed").length,
    avgAlt: flights.length ? Math.round(flights.reduce((s, f) => s + f.altitude, 0) / flights.length) : 0,
  }

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <div className="section-label">Air Traffic Control</div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0D1B2A", margin: 0 }}>
            Flight Corridor Monitor
          </h2>
        </div>
        <label style={{
          cursor: "pointer", background: "#1A3A5C", color: "white",
          padding: "8px 16px", borderRadius: "8px", fontSize: "13px",
          fontWeight: 600, display: "flex", alignItems: "center", gap: "6px",
          border: "1px solid rgba(0,245,212,0.3)", transition: "background 0.2s",
        }}>
          <span>📂</span> Upload Flight CSV
          <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleFileUpload} />
        </label>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { label: "Total Flights", value: stats.total, color: "#0F8B8D" },
          { label: "On Time", value: stats.onTime, color: "#1E8449" },
          { label: "Delayed", value: stats.delayed, color: "#FFC000" },
          { label: "Avg Altitude", value: `${stats.avgAlt.toLocaleString()} ft`, color: "#1A3A5C" },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, minWidth: "100px", background: "white", borderRadius: "10px",
            padding: "12px 16px", border: "1px solid #E2E8F0",
            borderTop: `3px solid ${s.color}`,
          }}>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#8A9BB0", textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontFamily: "monospace", fontSize: "1.5rem", fontWeight: 800, color: s.color, lineHeight: 1.2, marginTop: "4px" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Left: filters + table */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Filter + sort controls */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#8A9BB0", textTransform: "uppercase", letterSpacing: "0.1em" }}>Filter:</span>
            {["all", "on-time", "delayed", "diverted"].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                  border: "1px solid",
                  borderColor: filterStatus === s ? statusColor(s) : "#E2E8F0",
                  background: filterStatus === s ? statusColor(s) : "white",
                  color: filterStatus === s ? "white" : "#8A9BB0",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "#8A9BB0" }}>Sort:</span>
              {(["altitude", "speed", "callsign"] as const).map(k => (
                <button
                  key={k}
                  onClick={() => setSortBy(k)}
                  style={{
                    padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                    border: "1px solid #E2E8F0",
                    background: sortBy === k ? "#0D1B2A" : "white",
                    color: sortBy === k ? "white" : "#8A9BB0",
                    cursor: "pointer",
                  }}
                >
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Flight table */}
          <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", overflow: "hidden", maxHeight: "380px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "linear-gradient(90deg, #0D1B2A, #1A3A5C)", color: "white", position: "sticky", top: 0, zIndex: 2 }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em" }}>Callsign</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: "11px" }}>Route</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "11px" }}>Alt (ft)</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "11px" }}>Spd (kt)</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, fontSize: "11px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlights.map((f, i) => {
                  const altCat = altitudeCategory(f.altitude)
                  const isSelected = selectedFlight?.id === f.id
                  return (
                    <tr
                      key={f.id || i}
                      onClick={() => setSelectedFlight(isSelected ? null : f)}
                      style={{
                        background: isSelected ? "#EFF6FF" : i % 2 === 0 ? "white" : "#F8FAFF",
                        borderBottom: "1px solid #F1F5F9",
                        cursor: "pointer",
                        borderLeft: isSelected ? "3px solid #0F8B8D" : "3px solid transparent",
                        transition: "background 0.1s",
                      }}
                    >
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0D1B2A", fontFamily: "monospace" }}>{f.callsign}</td>
                      <td style={{ padding: "10px 12px", color: "#4A5568", fontSize: "12px" }}>
                        <span style={{ fontWeight: 600 }}>{f.origin}</span>
                        <span style={{ margin: "0 4px", color: "#CBD5E0" }}>→</span>
                        <span style={{ fontWeight: 600 }}>{f.destination}</span>
                        {f.airline && <div style={{ fontSize: "10px", color: "#8A9BB0", marginTop: "1px" }}>{f.airline}</div>}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", color: altCat.color, fontWeight: 600 }}>
                        {f.altitude.toLocaleString()}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", color: "#4A5568" }}>
                        {f.speed}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span style={{
                          fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px",
                          background: `${statusColor(f.status)}18`,
                          color: statusColor(f.status),
                          border: `1px solid ${statusColor(f.status)}40`,
                          textTransform: "uppercase",
                        }}>
                          {f.status ?? "—"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Selected flight detail card */}
          {selectedFlight && (
            <div style={{
              border: "1px solid #0F8B8D", borderRadius: "10px", padding: "16px",
              background: "#F0FDFC", borderLeft: "4px solid #0F8B8D",
            }}>
              <div style={{ fontWeight: 700, color: "#0D1B2A", fontSize: "14px", marginBottom: "10px" }}>
                ✈ {selectedFlight.callsign} — Flight Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
                {[
                  ["Route", `${selectedFlight.origin} → ${selectedFlight.destination}`],
                  ["Airline", selectedFlight.airline || "—"],
                  ["Altitude", `${selectedFlight.altitude.toLocaleString()} ft (${altitudeCategory(selectedFlight.altitude).label})`],
                  ["Speed", `${selectedFlight.speed} kt`],
                  ["Status", selectedFlight.status ?? "—"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ color: "#8A9BB0", fontWeight: 600, fontSize: "10px", textTransform: "uppercase" }}>{k}</div>
                    <div style={{ color: "#0D1B2A", fontWeight: 600, marginTop: "2px" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Map */}
        <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #E2E8F0", height: "480px", position: "relative" }}>
          {isMounted && (
            <MapContainer
              center={[22.5, 78.0]}
              zoom={4}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              {/* Map badge injected via inner component */}
              <MapBadgeWrapper count={flights.length} csvLoaded={csvLoaded} />
              {filteredFlights.map((f, i) => {
                if (f.origin_lat === undefined || f.dest_lat === undefined) return null
                const isSelected = selectedFlight?.id === f.id
                return (
                  <React.Fragment key={f.id || i}>
                    <Polyline
                      positions={[[f.origin_lat!, f.origin_lon!], [f.dest_lat!, f.dest_lon!]]}
                      color={isSelected ? "#FFC000" : "#00f5d4"}
                      weight={isSelected ? 3 : 1.5}
                      dashArray={isSelected ? "8,4" : "5,5"}
                      opacity={isSelected ? 1 : 0.6}
                    />
                    <CircleMarker
                      center={[f.origin_lat!, f.origin_lon!]}
                      radius={isSelected ? 7 : 5}
                      pathOptions={{ fillColor: "#f7b731", color: "#fff", weight: 2, fillOpacity: 1 }}
                    >
                      <Popup>
                        <div style={{ fontFamily: "sans-serif", minWidth: "160px" }}>
                          <div style={{ fontWeight: 700, marginBottom: "6px", color: "#0D1B2A" }}>{f.callsign}</div>
                          <div style={{ fontSize: "12px", color: "#4A5568" }}>
                            <div>Origin: <strong>{f.origin}</strong></div>
                            <div>Alt: <strong>{f.altitude.toLocaleString()} ft</strong></div>
                            <div>Speed: <strong>{f.speed} kt</strong></div>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                    <CircleMarker
                      center={[f.dest_lat!, f.dest_lon!]}
                      radius={isSelected ? 7 : 5}
                      pathOptions={{ fillColor: "#00f5d4", color: "#fff", weight: 2, fillOpacity: 1 }}
                    >
                      <Popup>
                        <div style={{ fontFamily: "sans-serif" }}>
                          <div style={{ fontWeight: 700, color: "#0D1B2A" }}>{f.callsign}</div>
                          <div style={{ fontSize: "12px", color: "#4A5568" }}>Destination: <strong>{f.destination}</strong></div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  </React.Fragment>
                )
              })}
            </MapContainer>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        marginTop: "16px", display: "flex", gap: "20px", flexWrap: "wrap",
        padding: "10px 16px", background: "white", borderRadius: "8px",
        border: "1px solid #E2E8F0", fontSize: "11px", color: "#8A9BB0",
      }}>
        <span style={{ fontWeight: 700, color: "#4A5568" }}>LEGEND:</span>
        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: "#f7b731" }} /> Origin
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: "#00f5d4" }} /> Destination
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ display: "inline-block", width: "24px", height: "2px", background: "#00f5d4", borderTop: "2px dashed #00f5d4" }} /> Route
        </span>
        <span style={{ marginLeft: "auto", fontStyle: "italic" }}>Click a row to highlight on map</span>
      </div>
    </div>
  )
}

// Wrapper needed to use useMap hook which requires MapContainer context
function MapBadgeWrapper({ count, csvLoaded }: { count: number; csvLoaded: boolean }) {
  const [MapBadge, setMapBadge] = React.useState<React.ComponentType<any> | null>(null)
  React.useEffect(() => {
    import("react-leaflet").then(m => {
      const InnerBadge = ({ count, csvLoaded }: { count: number; csvLoaded: boolean }) => {
        const map = m.useMap()
        const controlRef = useRef<any>(null)
        useEffect(() => {
          let cancelled = false;
          (async () => {
            if (cancelled) return
            const L = (await import("leaflet")).default
            if (controlRef.current) map.removeControl(controlRef.current)
            const CC = L.Control.extend({
              options: { position: "topleft" },
              onAdd: function () {
                const div = L.DomUtil.create("div", "leaflet-bar leaflet-control")
                div.innerHTML = `✈ ${count} FLIGHTS${csvLoaded ? " (CSV)" : " (DEMO)"}`
                div.style.cssText = `background:rgba(13,27,42,0.88);color:white;font-family:monospace;padding:6px 14px;border-radius:6px;border:1px solid rgba(0,245,212,0.4);font-size:12px;font-weight:bold;pointer-events:none`
                return div
              },
            })
            const ctrl = new CC()
            ctrl.addTo(map)
            controlRef.current = ctrl
          })()
          return () => {
            cancelled = true
            if (controlRef.current) map.removeControl(controlRef.current)
          }
        }, [map, count, csvLoaded])
        return null
      }
      setMapBadge(() => InnerBadge)
    })
  }, [])
  if (!MapBadge) return null
  return <MapBadge count={count} csvLoaded={csvLoaded} />
}
