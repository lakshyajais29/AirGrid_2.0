"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
import { renderToStaticMarkup } from "react-dom/server"
import {
  analyzePollution,
  type SensorInput,
  type PollutionAnalysis,
} from "@/lib/pollutionPredictor"
import { queryPhysicalSource, type PhysicalSource } from "@/lib/overpassQuery"
import {
  Activity, AlertTriangle, Droplets, Flame, Factory, MapPin, 
  Navigation, Thermometer, Wind, Download, Play, Square, 
  Map as MapIcon, ShieldAlert, CheckCircle, Car, Home, HardHat,
  CloudFog, FileSpreadsheet, Tractor, Trash2
} from "lucide-react"

const SourceIcon = ({ id, size = 24, color = "currentColor" }: { id: string, size?: number, color?: string }) => {
  switch (id) {
    case 'traffic': return <Car size={size} color={color} />
    case 'burning': return <Trash2 size={size} color={color} />
    case 'industrial': return <Factory size={size} color={color} />
    case 'construction': return <HardHat size={size} color={color} />
    case 'agri_burning': return <Tractor size={size} color={color} />
    case 'domestic': return <Home size={size} color={color} />
    case 'mixed': return <CloudFog size={size} color={color} />
    case 'clean_air': return <CheckCircle size={size} color={color} />
    default: return <Activity size={size} color={color} />
  }
}

// ─── Dynamic Leaflet imports (SSR-safe) ──────────────────────────────────────

const MapContainer  = dynamic(() => import("react-leaflet").then(m => m.MapContainer),  { ssr: false })
const TileLayer     = dynamic(() => import("react-leaflet").then(m => m.TileLayer),     { ssr: false })
const Marker        = dynamic(() => import("react-leaflet").then(m => m.Marker),        { ssr: false })
const CircleMarker  = dynamic(() => import("react-leaflet").then(m => m.CircleMarker),  { ssr: false })
const Circle        = dynamic(() => import("react-leaflet").then(m => m.Circle),        { ssr: false })
const Popup         = dynamic(() => import("react-leaflet").then(m => m.Popup),         { ssr: false })
const Polyline      = dynamic(() => import("react-leaflet").then(m => m.Polyline),      { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DronePoint {
  lat: number
  lng: number
  mq135: number
  mq9: number
  mq2: number
  satellites: number
  temperature: number
  humidity: number
  pm25: number
  pm10: number
  altitude: number
  aqi: number
  aqiLabel: string
  aqiColor: string
}

interface Hotspot {
  lat: number
  lng: number
  aqi: number
  point: DronePoint
  analysis: PollutionAnalysis
}

// ─── AQI helpers ──────────────────────────────────────────────────────────────

function mq135ToAQI(raw: number): number {
  if (raw <= 0)   return 0
  if (raw < 150)  return Math.round((raw / 150) * 50)
  if (raw < 200)  return Math.round(50  + ((raw - 150) / 50)  * 70)
  if (raw < 250)  return Math.round(120 + ((raw - 200) / 50)  * 80)
  if (raw < 300)  return Math.round(200 + ((raw - 250) / 50)  * 100)
  return Math.round(300 + (raw - 300))
}

function mq9Boost(mq9: number): number {
  if (mq9 <= 200) return 0
  if (mq9 <= 400) return Math.round((mq9 - 200) / 200 * 40)
  return 40 + Math.round((mq9 - 400) / 100 * 30)
}

function mq2Boost(mq2: number): number {
  if (mq2 <= 250) return 0
  if (mq2 <= 500) return Math.round((mq2 - 250) / 250 * 35)
  return 35 + Math.round((mq2 - 500) / 100 * 20)
}

function computeAQI(mq135: number, mq9: number, mq2: number): number {
  return Math.min(500, mq135ToAQI(mq135) + mq9Boost(mq9) + mq2Boost(mq2))
}

function droneAqiMeta(aqi: number): { label: string; color: string } {
  if (aqi <= 50)  return { label: "Good",        color: "#00C851" }
  if (aqi <= 100) return { label: "Satisfactory", color: "#FFD700" }
  if (aqi <= 200) return { label: "Moderate",    color: "#FF8C00" }
  if (aqi <= 300) return { label: "Poor",        color: "#FF4444" }
  if (aqi <= 400) return { label: "Very Poor",   color: "#922B21" }
  return            { label: "Severe",       color: "#5B0000" }
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseDroneCSV(text: string): DronePoint[] {
  const lines = text.split(/\r?\n/).filter(Boolean)
  const raw: DronePoint[] = []

  if (lines.length < 2) return raw;

  let headers = lines[0].split(",").map(c => c.trim().toLowerCase())
  let startIndex = 1;
  
  // Define fallback indices if header is missing or unrecognizable
  let latIdx = 1, lngIdx = 2, mq135Idx = 3, mq9Idx = 4, mq2Idx = 5, satsIdx = 6, tempIdx = 7, humIdx = 8, altIdx = -1, pm25Idx = -1, pm10Idx = -1;

  const getIdx = (names: string[]) => headers.findIndex(h => names.some(n => h === n || h.includes(n)));
  
  if (getIdx(['lat', 'latitude']) !== -1) {
    latIdx = getIdx(['lat', 'latitude']);
    lngIdx = getIdx(['lon', 'lng', 'longitude']);
    mq135Idx = getIdx(['mq135', 'mq-135']);
    mq9Idx = getIdx(['mq9', 'mq-9']);
    mq2Idx = getIdx(['mq2', 'mq-2']);
    satsIdx = getIdx(['sat', 'satellites']);
    tempIdx = getIdx(['temp', 'temperature']);
    humIdx = getIdx(['hum', 'humidity']);
    altIdx = getIdx(['alt', 'altitude']);
    pm25Idx = getIdx(['pm2.5', 'pm25']);
    pm10Idx = getIdx(['pm10']);
  } else {
    // legacy format without header
    startIndex = 0;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const cols = line.split(",").map(c => c.trim())
    if (cols.length < 2) continue
    
    // Skip duplicate headers
    if (cols[0].toLowerCase() === 'timestamp' || cols[0].toLowerCase() === 'latitude') continue

    const lat = parseFloat(cols[latIdx])
    const lng = parseFloat(cols[lngIdx])
    
    if (isNaN(lat) || isNaN(lng)) continue
    if (lat < 6 || lat > 38)     continue
    if (lng < 66 || lng > 100)   continue
    
    let mq135 = mq135Idx !== -1 && cols[mq135Idx] !== undefined ? parseFloat(cols[mq135Idx]) : 0;
    let mq9 = mq9Idx !== -1 && cols[mq9Idx] !== undefined ? parseFloat(cols[mq9Idx]) : 0;
    let mq2 = mq2Idx !== -1 && cols[mq2Idx] !== undefined ? parseFloat(cols[mq2Idx]) : 0;
    let temp = tempIdx !== -1 && cols[tempIdx] !== undefined ? parseFloat(cols[tempIdx]) : 0;
    let hum = humIdx !== -1 && cols[humIdx] !== undefined ? parseFloat(cols[humIdx]) : 0;
    let sats = satsIdx !== -1 && cols[satsIdx] !== undefined ? parseFloat(cols[satsIdx]) : 0;
    let alt = altIdx !== -1 && cols[altIdx] !== undefined ? parseFloat(cols[altIdx]) : 100;
    let pm25 = pm25Idx !== -1 && cols[pm25Idx] !== undefined ? parseFloat(cols[pm25Idx]) : 0;
    let pm10 = pm10Idx !== -1 && cols[pm10Idx] !== undefined ? parseFloat(cols[pm10Idx]) : 0;

    if (isNaN(mq135)) mq135 = 0;
    if (isNaN(mq9)) mq9 = 0;
    if (isNaN(mq2)) mq2 = 0;
    if (isNaN(temp)) temp = 0;
    if (isNaN(hum)) hum = 0;
    if (isNaN(sats)) sats = 0;
    if (isNaN(alt)) alt = 100;
    if (isNaN(pm25)) pm25 = 0;
    if (isNaN(pm10)) pm10 = 0;

    if (mq135 < 0 || mq135 > 1100) continue

    const aqi  = computeAQI(mq135, mq9, mq2)
    const meta = droneAqiMeta(aqi)

    raw.push({
      lat, lng,
      mq135, mq9, mq2,
      satellites: sats,
      temperature: temp,
      humidity: hum,
      pm25: pm25,
      pm10: pm10,
      altitude: alt,
      aqi,
      aqiLabel: meta.label,
      aqiColor: meta.color,
    })
  }

  if (raw.length < 2) return raw

  const cleaned: DronePoint[] = [raw[0]]
  for (let i = 1; i < raw.length; i++) {
    if (distKm(cleaned[cleaned.length - 1], raw[i]) <= 2)
      cleaned.push(raw[i])
  }
  return cleaned
}

// ─── Hotspot detection ────────────────────────────────────────────────────────

function detectHotspots(points: DronePoint[], maxCount = 8): Hotspot[] {
  if (!points.length) return []
  const CLUSTER_KM = 0.06

  const sorted = [...points].sort((a, b) => b.aqi - a.aqi)
  const used   = new Set<number>()
  const out: Hotspot[] = []

  for (const p of sorted) {
    const idx = points.indexOf(p)
    if (used.has(idx)) continue
    if (out.length >= maxCount) break

    points.forEach((q, qi) => {
      if (!used.has(qi) && distKm(p, q) <= CLUSTER_KM) used.add(qi)
    })

    const sensors: SensorInput = {
      mq135: p.mq135, mq9: p.mq9, mq2: p.mq2,
      temperature: p.temperature, humidity: p.humidity,
      pm25: p.pm25, pm10: p.pm10, altitude: p.altitude,
    }
    out.push({ lat: p.lat, lng: p.lng, aqi: p.aqi, point: p, analysis: analyzePollution(sensors, p.aqi) })
  }

  return out
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

function distKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R    = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x    = Math.sin(dLat / 2) ** 2
    + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function exportDroneCSV(points: DronePoint[]) {
  const header = "Index,Latitude,Longitude,MQ135,MQ9,MQ2,Satellites,Temperature,Humidity,AQI,AQI_Label\n"
  const rows   = points.map((p, i) =>
    `${i+1},${p.lat},${p.lng},${p.mq135},${p.mq9},${p.mq2},${p.satellites},${p.temperature},${p.humidity},${p.aqi},${p.aqiLabel}`
  ).join("\n")
  const blob = new Blob([header + rows], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a"); a.href = url; a.download = "drone_mission_aqi.csv"; a.click()
  URL.revokeObjectURL(url)
}

// ─── Map inner component ──────────────────────────────────────────────────────

interface DroneMapInnerProps {
  allPoints: DronePoint[]
  visiblePoints: DronePoint[]
  isReplaying: boolean
  hotspots: Hotspot[]
  showHeatmap: boolean
  showHotspots: boolean
  physicalSources: PhysicalSource[]
  searchRadius: number
}

function DroneMapInner({ allPoints, visiblePoints, isReplaying, hotspots, showHeatmap, showHotspots, physicalSources, searchRadius }: DroneMapInnerProps) {
  const { useMap } = require("react-leaflet") as typeof import("react-leaflet")
  const L          = require("leaflet") as typeof import("leaflet")
  const map        = useMap()
  const prevLen    = useRef(0)

  useEffect(() => {
    if (allPoints.length < 2) return
    const bounds = L.latLngBounds(allPoints.map(p => [p.lat, p.lng] as [number, number]))
    map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 18, duration: 1.5 })
  }, [allPoints, map, L])

  useEffect(() => {
    if (!isReplaying || visiblePoints.length === 0) return
    if (visiblePoints.length === prevLen.current) return
    prevLen.current = visiblePoints.length
    const last = visiblePoints[visiblePoints.length - 1]
    map.flyTo([last.lat, last.lng], 17, { duration: 0.4, easeLinearity: 0.5 })
  }, [visiblePoints.length, isReplaying, visiblePoints, map])

  useEffect(() => {
    if (isReplaying || allPoints.length < 2) return
    const bounds = L.latLngBounds(allPoints.map(p => [p.lat, p.lng] as [number, number]))
    map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 17, duration: 1.2 })
  }, [isReplaying, allPoints, map, L])

  // ── Mission badge ──
  const badgeRef = useRef<L.Control | null>(null)
  useEffect(() => {
    if (badgeRef.current) map.removeControl(badgeRef.current)
    const Ctrl = L.Control.extend({
      options: { position: "topleft" },
      onAdd() {
        const d = L.DomUtil.create("div")
        d.innerHTML = `<div style="display:flex;align-items:center;gap:6px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg> DRONE MISSION · ${allPoints.length} POINTS</div>`
        d.style.cssText = "background:rgba(15,23,42,0.95);color:white;font-family:monospace;padding:8px 16px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);font-size:12px;font-weight:bold;letter-spacing:0.05em;pointer-events:none;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.1)"
        return d
      },
    })
    const ctrl = new Ctrl() as unknown as L.Control
    ctrl.addTo(map); badgeRef.current = ctrl
    return () => { map.removeControl(ctrl) }
  }, [allPoints.length, map, L])

  // ── AQI legend ──
  const legendRef = useRef<L.Control | null>(null)
  useEffect(() => {
    if (legendRef.current) map.removeControl(legendRef.current)
    const Leg = L.Control.extend({
      options: { position: "bottomleft" },
      onAdd() {
        const d = L.DomUtil.create("div")
        d.style.cssText = "background:rgba(255,255,255,0.95);border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-family:sans-serif;font-size:11px;box-shadow:0 2px 12px rgba(13,27,42,0.1);pointer-events:none"
        d.innerHTML = `<div style="font-weight:800;font-size:10px;letter-spacing:0.1em;color:#4A5568;text-transform:uppercase;margin-bottom:8px">AQI (MQ-135+)</div>` +
          [["#00C851","Good","0–50"],["#FFD700","Satisfactory","51–100"],["#FF8C00","Moderate","101–200"],["#FF4444","Poor","201–300"],["#8B008B","Hazardous","300+"]].map(([c,l,r]) =>
            `<div style="display:flex;align-items:center;gap:7px;margin-bottom:4px"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${c}"></span><span style="color:#4A5568;font-weight:600">${l}</span><span style="color:#A0AEC0;margin-left:auto">${r}</span></div>`
          ).join("")
        return d
      },
    })
    const leg = new Leg() as unknown as L.Control
    leg.addTo(map); legendRef.current = leg
    return () => { map.removeControl(leg) }
  }, [map, L])

  if (visiblePoints.length === 0) return null

  const step      = Math.max(1, Math.floor(allPoints.length / 200))
  const heatPts   = allPoints.filter((_, i) => i % step === 0)
  const displayPts = visiblePoints.filter((_, i) => i % Math.max(1, Math.floor(visiblePoints.length / 120)) === 0 || i === visiblePoints.length - 1)

  return (
    <>
      {showHeatmap && heatPts.map((p, i) => (
        <Circle
          key={`heat-${i}`}
          center={[p.lat, p.lng]}
          radius={90}
          pathOptions={{ fillColor: p.aqiColor, color: "transparent", fillOpacity: 0.10 }}
        />
      ))}

      {showHotspots && hotspots.map((h, i) => (
        <Circle
          key={`zone-${i}`}
          center={[h.lat, h.lng]}
          radius={searchRadius}
          pathOptions={{
            color: h.analysis.top3[0].color,
            weight: 2,
            dashArray: "8 8",
            fillOpacity: 0,
            opacity: 0.8,
          }}
        />
      ))}

      {visiblePoints.slice(0, -1).map((p, i) => (
        <Polyline
          key={`seg-${i}`}
          positions={[[p.lat, p.lng], [visiblePoints[i+1].lat, visiblePoints[i+1].lng]]}
          pathOptions={{ color: p.aqiColor, weight: 4, opacity: 0.88 }}
        />
      ))}

      {displayPts.map((p, i) => (
        <CircleMarker
          key={`dot-${i}`}
          center={[p.lat, p.lng]}
          radius={4}
          pathOptions={{ fillColor: p.aqiColor, color: "#fff", weight: 1, fillOpacity: 0.85 }}
        >
          <Popup>
            <div style={{ fontFamily: "sans-serif", minWidth: "160px" }}>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={14}/> Reading</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 800, fontFamily: "monospace", fontSize: 15, color: p.aqiColor }}>{p.aqi}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: p.aqiColor }}>{p.aqiLabel}</span>
              </div>
              <table style={{ fontSize: 12, borderCollapse: "collapse" }}>
                <tbody>
                  {[["MQ-135", p.mq135], ["MQ-9", p.mq9], ["MQ-2", p.mq2], ["PM2.5", p.pm25], ["PM10", p.pm10], ["Temp", `${p.temperature.toFixed(1)}°C`], ["Humidity", `${p.humidity.toFixed(1)}%`], ["Alt", `${p.altitude}m`], ["Lat", p.lat.toFixed(5)], ["Lng", p.lng.toFixed(5)]].map(([k, v]) => (
                    <tr key={String(k)}>
                      <td style={{ color: "var(--text-muted)", paddingRight: 8, paddingBottom: 3 }}>{k}</td>
                      <td style={{ fontWeight: 600, fontFamily: "monospace" }}>{String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {showHotspots && hotspots.map((h, i) => {
        const top = h.analysis.top3[0]
        return (
          <Marker
            key={`hs-${i}`}
            position={[h.lat, h.lng]}
            icon={L.divIcon({ html: renderToStaticMarkup(<div style={{ background: top.color, width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", border: "2px solid white", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}><SourceIcon id={top.id} size={18} color="white" /></div>), className: "", iconSize: [32, 32], iconAnchor: [16, 16] })}
          >
            <Popup maxWidth={320}>
              <div style={{ fontFamily: "sans-serif", minWidth: 280 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #e2e8f0" }}>
                  <SourceIcon id={top.id} size={24} color={top.color} />
                  <div>
                    <div style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: 13 }}>{top.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>AI Estimated Source · Hotspot #{i+1}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 22, color: h.point.aqiColor }}>{h.aqi}</span>
                  <span style={{ fontWeight: 700, color: h.point.aqiColor, fontSize: 12 }}>AQI · {h.point.aqiLabel}</span>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Top 3 Predictions</div>
                  {h.analysis.top3.map((pred) => (
                    <div key={pred.id} style={{ marginBottom: 5 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, alignItems: "center" }}>
                        <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <SourceIcon id={pred.id} size={14} color={pred.color} /> 
                          {pred.name}
                        </span>
                        <span style={{ fontWeight: 700, color: pred.color }}>{pred.confidence.toFixed(0)}%</span>
                      </div>
                      <div style={{ height: 5, background: "#f0f0f0", borderRadius: 3 }}>
                        <div style={{ width: `${pred.confidence}%`, height: "100%", background: pred.color, borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
                  {[["MQ-135", h.point.mq135], ["MQ-9", h.point.mq9], ["MQ-2", h.point.mq2], ["PM2.5", h.point.pm25], ["PM10", h.point.pm10], ["Alt", `${h.point.altitude}m`], ["Temp", `${h.point.temperature.toFixed(1)}°C`], ["Humidity", `${h.point.humidity.toFixed(0)}%`], ["Satellites", h.point.satellites]].map(([k, v]) => (
                    <div key={String(k)} style={{ background: "#f8faff", borderRadius: 6, padding: "4px 7px" }}>
                      <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>{k}</div>
                      <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12 }}>{String(v)}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 11, color: "#4A5568", background: "#f8faff", borderRadius: 8, padding: "7px 9px", lineHeight: 1.5 }}>
                  {top.explanation}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {showHotspots && physicalSources.map((src, i) => (
        <Marker
          key={`ps-${i}`}
          position={[src.lat, src.lng]}
          icon={L.divIcon({ html: renderToStaticMarkup(<div style={{ background: "var(--surface)", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid #0f172a`, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}><SourceIcon id={src.type} size={14} color="#0f172a" /></div>), className: "", iconSize: [28, 28], iconAnchor: [14, 14] })}
        >
          <Popup>
            <div style={{ fontFamily: "sans-serif", fontSize: 13, minWidth: 160 }}>
              <div style={{ fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>{src.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize", marginBottom: 8 }}>Identified Physical Source</div>
              {Object.entries(src.tags).slice(0, 3).map(([k, v]) => (
                <div key={k} style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>
                  <strong style={{ color: "var(--text-primary)" }}>{k}:</strong> {v as string}
                </div>
              ))}
            </div>
          </Popup>
        </Marker>
      ))}

      <CircleMarker
        center={[visiblePoints[0].lat, visiblePoints[0].lng]}
        radius={11}
        pathOptions={{ fillColor: "#10b981", color: "#047857", weight: 2.5, fillOpacity: 1 }}
      >
        <Popup><div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><Play size={14} /> Mission Start</div></Popup>
      </CircleMarker>

      {visiblePoints.length > 1 && (
        <CircleMarker
          center={[visiblePoints[visiblePoints.length - 1].lat, visiblePoints[visiblePoints.length - 1].lng]}
          radius={11}
          pathOptions={{ fillColor: isReplaying ? "#eab308" : "#ef4444", color: "#fff", weight: 2.5, fillOpacity: 1 }}
        >
          <Popup>
            <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              {isReplaying ? <Navigation size={14} /> : <Square size={14} />} 
              {isReplaying ? "Drone (live)" : "Mission End"}
            </div>
          </Popup>
        </CircleMarker>
      )}
    </>
  )
}

function DroneMapInnerWrapper(props: DroneMapInnerProps) {
  const [Comp, setComp] = useState<React.ComponentType<DroneMapInnerProps> | null>(null)
  useEffect(() => { import("react-leaflet").then(() => setComp(() => DroneMapInner)) }, [])
  if (!Comp) return null
  return <Comp {...props} />
}

// ─── AI Prediction Panel ──────────────────────────────────────────────────────

function AIPredictionPanel({ analysis }: { analysis: PollutionAnalysis }) {
  const { top3 } = analysis

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Probable Source Cards */}
      {[top3[0], top3[1]].filter(Boolean).map((source, index) => (
        <div key={source.id} style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border-faint)", padding: 18, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
           <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase" }}>
              {index === 0 ? "Most Probable Source" : "Secondary Probable Source"}
            </div>
            <div style={{ background: `${source.color}15`, padding: 10, borderRadius: 12 }}>
              <SourceIcon id={source.id} size={24} color={source.color} />
            </div>
          </div>

          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", marginBottom: 14, lineHeight: 1.2 }}>
            {source.name}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-alt)", padding: "10px 14px", borderRadius: 12, border: "1px solid var(--border-faint)" }}>
             <div>
               <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 2 }}>Confidence</div>
               <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "monospace", color: source.color }}>{source.confidence.toFixed(0)}%</div>
             </div>
             <div style={{ width: "60%", height: 6, background: "var(--surface-alt)", borderRadius: 3, overflow: "hidden", border: "1px solid var(--border-faint)" }}>
               <div style={{ width: `${source.confidence}%`, height: "100%", background: source.color, borderRadius: 3 }} />
             </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Sensor Readings Panel ────────────────────────────────────────────────────

function SensorReadingsPanel({ point }: { point: DronePoint }) {
  const sensors = [
    { label: "MQ-135", value: point.mq135, desc: "Air Quality", color: "#8B5CF6", icon: CloudFog },
    { label: "MQ-9",   value: point.mq9,   desc: "CO Gas", color: "#EF4444", icon: AlertTriangle },
    { label: "MQ-2",   value: point.mq2,   desc: "Smoke",  color: "#F97316", icon: Flame },
  ]

  return (
    <div style={{ background: "transparent" }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12, marginLeft: 4 }}>Live Sensors</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {sensors.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border-faint)", padding: "16px 12px", textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                <Icon size={24} color={s.color} strokeWidth={2.5} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.value.toFixed(0)}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>{s.desc}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Alerts Panel ─────────────────────────────────────────────────────────────

function AlertsPanel({ analysis }: { analysis: PollutionAnalysis }) {
  if (!analysis.alerts.length) {
    return (
      <div style={{ background: "#f0fdf4", borderRadius: 16, border: "1px solid #bbf7d0", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <CheckCircle size={24} color="#16a34a" />
        <div style={{ fontSize: 14, fontWeight: 600, color: "#166534" }}>All sensor levels within normal range</div>
      </div>
    )
  }
  return (
    <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border-faint)", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
      <div style={{ background: "#fefce8", borderBottom: "1px solid #fef08a", padding: "12px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#a16207", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>
        <ShieldAlert size={16} />
        Active Alerts ({analysis.alerts.length})
      </div>
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {analysis.alerts.map((a, i) => (
          <div key={i} style={{
            background: a.level === 'critical' ? "#fef2f2" : "#fffbeb",
            border: `1px solid ${a.level === 'critical' ? "#fecaca" : "#fde047"}`,
            borderRadius: 8, padding: "10px 12px", fontSize: 12, fontWeight: 600,
            color: a.level === 'critical' ? "#991b1b" : "#854d0e",
            display: "flex", alignItems: "flex-start", gap: 8
          }}>
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{a.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const LiveFlightMonitor: React.FC = () => {
  const [isMounted,      setIsMounted]      = useState(false)
  const [dronePoints,    setDronePoints]    = useState<DronePoint[]>([])
  const [droneFiles,     setDroneFiles]     = useState<string[]>([])
  const [isDragging,     setIsDragging]     = useState(false)
  const [replayIdx,      setReplayIdx]      = useState<number | null>(null)
  const [isReplaying,    setIsReplaying]    = useState(false)
  const [playbackSpeed,  setPlaybackSpeed]  = useState<number>(1)
  const [searchRadius,   setSearchRadius]   = useState<number>(1000)
  const [showHeatmap,    setShowHeatmap]    = useState(false)
  const [showHotspots,   setShowHotspots]   = useState(true)
  const [physicalSources, setPhysicalSources] = useState<PhysicalSource[]>([])
  const replayRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const speedRef     = useRef<number>(1)
  const droneInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setIsMounted(true) }, [])
  useEffect(() => () => { if (replayRef.current) clearInterval(replayRef.current) }, [])

  // ── File handling ─────────────────────────────────────────────────────────
  const processFiles = useCallback((fileList: FileList) => {
    const readers = Array.from(fileList)
      .filter(f => f.name.endsWith(".csv"))
      .map(f => new Promise<{ name: string; text: string }>(res => {
        const r = new FileReader()
        r.onload = e => res({ name: f.name, text: e.target?.result as string })
        r.readAsText(f)
      }))
    Promise.all(readers).then(results => {
      const all = results.flatMap(r => parseDroneCSV(r.text))
      setDroneFiles(results.map(r => r.name))
      setDronePoints(all)
      setReplayIdx(null)
      setIsReplaying(false)
    })
  }, [])

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false)
    processFiles(e.dataTransfer.files)
  }

  // ── Replay ────────────────────────────────────────────────────────────────
  const startReplay = () => {
    if (!dronePoints.length) return
    if (replayRef.current) clearInterval(replayRef.current)
    setReplayIdx(0); setIsReplaying(true)
    let i = 0
    speedRef.current = playbackSpeed
    replayRef.current = setInterval(() => {
      i += 1
      if (i >= dronePoints.length) { clearInterval(replayRef.current!); setIsReplaying(false); setReplayIdx(null) }
      else setReplayIdx(i)
    }, 40 / speedRef.current)
  }

  // Update speed dynamically if already playing
  useEffect(() => {
    if (isReplaying) {
      speedRef.current = playbackSpeed;
      if (replayRef.current) clearInterval(replayRef.current)
      let i = replayIdx || 0
      replayRef.current = setInterval(() => {
        i += 1
        if (i >= dronePoints.length) { clearInterval(replayRef.current!); setIsReplaying(false); setReplayIdx(null) }
        else setReplayIdx(i)
      }, 40 / speedRef.current)
    }
  }, [playbackSpeed, isReplaying, dronePoints.length])

  const stopReplay = () => {
    if (replayRef.current) clearInterval(replayRef.current)
    setIsReplaying(false); setReplayIdx(null)
  }

  const visiblePoints = replayIdx !== null ? dronePoints.slice(0, replayIdx + 1) : dronePoints

  // ── Derived data ──────────────────────────────────────────────────────────
  const hotspots = useMemo(() => detectHotspots(dronePoints), [dronePoints])

  useEffect(() => {
    if (!hotspots.length) {
      setPhysicalSources([])
      return
    }
    const fetchSources = async () => {
      const allSources: PhysicalSource[] = []
      for (const h of hotspots) {
        const predictionId = h.analysis.top3[0].id
        const sources = await queryPhysicalSource(h.lat, h.lng, predictionId, searchRadius)
        if (sources.length > 0) {
           allSources.push(sources[0])
        }
      }
      setPhysicalSources(allSources)
    }
    fetchSources()
  }, [hotspots, searchRadius])

  const peakPoint = useMemo(() =>
    dronePoints.length ? dronePoints.reduce((b, p) => p.aqi > b.aqi ? p : b, dronePoints[0]) : null,
    [dronePoints]
  )

  const peakAnalysis = useMemo(() => {
    if (!peakPoint) return null
    return analyzePollution({ mq135: peakPoint.mq135, mq9: peakPoint.mq9, mq2: peakPoint.mq2, temperature: peakPoint.temperature, humidity: peakPoint.humidity, pm25: peakPoint.pm25, pm10: peakPoint.pm10, altitude: peakPoint.altitude }, peakPoint.aqi)
  }, [peakPoint])

  const currentPoint = useMemo(() => {
    if (!dronePoints.length) return null
    if (replayIdx !== null) return dronePoints[replayIdx]
    return dronePoints[dronePoints.length - 1]
  }, [dronePoints, replayIdx])

  const stats = useMemo(() => {
    if (!dronePoints.length) return null
    const avgAQI  = Math.round(avg(dronePoints.map(p => p.aqi)))
    const maxAQI  = Math.max(...dronePoints.map(p => p.aqi))
    const avgTemp = +avg(dronePoints.map(p => p.temperature)).toFixed(1)
    const avgHum  = +avg(dronePoints.map(p => p.humidity)).toFixed(1)
    let dist = 0
    for (let i = 1; i < dronePoints.length; i++) dist += distKm(dronePoints[i-1], dronePoints[i])
    return { total: dronePoints.length, avgAQI, maxAQI, avgTemp, avgHum, dist: dist.toFixed(2) }
  }, [dronePoints])

  const droneCenter: [number, number] = dronePoints.length > 0
    ? [avg(dronePoints.map(p => p.lat)), avg(dronePoints.map(p => p.lng))]
    : [28.753, 77.498]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "var(--font-sans, sans-serif)", paddingBottom: 40 }}>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => droneInputRef.current?.click()}
        style={{ border: `2px dashed ${isDragging ? "var(--accent)" : "var(--border-faint)"}`, borderRadius: 16, padding: "24px", textAlign: "center", cursor: "pointer", background: isDragging ? "var(--surface-alt)" : "var(--surface)", transition: "all 0.2s ease", marginBottom: 24 }}
      >
        <input ref={droneInputRef} type="file" accept=".csv" multiple style={{ display: "none" }} onChange={e => { if (e.target.files) processFiles(e.target.files) }} />
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div style={{ background: "var(--surface-alt)", padding: 16, borderRadius: "50%" }}>
            <FileSpreadsheet size={32} color="var(--text-muted)" />
          </div>
        </div>
        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 16, marginBottom: 4 }}>Drop drone CSV files here or click to browse</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: droneFiles.length ? 12 : 0 }}>
          Schema: Latitude, Longitude, Temperature, Humidity, Altitude, MQ2, MQ9, MQ135, PM2.5, PM10
        </div>
        {droneFiles.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {droneFiles.map((f, i) => (
              <span key={i} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle size={14} /> {f}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {dronePoints.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border-faint)" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <MapIcon size={48} color="#cbd5e1" strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>No drone data loaded yet</div>
          <div style={{ fontSize: 14 }}>Upload your drone hardware CSV to start the monitoring dashboard</div>
        </div>
      )}

      {/* ─── Dashboard ─── */}
      {dronePoints.length > 0 && stats && (
        <>
          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Data Points", value: stats.total,   unit: "",    Icon: MapPin, color: "#0F8B8D" },
              { label: "Avg AQI",     value: stats.avgAQI,  unit: "",    Icon: Wind, color: droneAqiMeta(stats.avgAQI).color },
              { label: "Peak AQI",    value: stats.maxAQI,  unit: "",    Icon: AlertTriangle, color: droneAqiMeta(stats.maxAQI).color },
              { label: "Avg Temp",    value: stats.avgTemp, unit: "°C",  Icon: Thermometer, color: "#E67E22" },
              { label: "Avg Humidity",value: stats.avgHum,  unit: "%",   Icon: Droplets, color: "#2980B9" },
              { label: "Distance",    value: stats.dist,    unit: " km", Icon: Navigation, color: "#8E44AD" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border-faint)", padding: "20px 16px", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                  <s.Icon size={18} color={s.color} />
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>
                  {s.value}<span style={{ fontSize: 16, color: "var(--text-muted)", marginLeft: 2, fontFamily: "var(--font-sans, sans-serif)", fontWeight: 700 }}>{s.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Map + AI Panel row */}
          <div style={{ display: "grid", gridTemplateColumns: "65% 1fr", gap: 24, marginBottom: 24 }}>

            {/* Map Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Replay controls */}
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", background: "var(--surface)", padding: "10px 12px", borderRadius: 16, border: "1px solid var(--border-faint)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                {isReplaying ? (
                  <button onClick={stopReplay} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: "#fef2f2", color: "#ef4444", fontWeight: 700, fontSize: 13, cursor: "pointer", border: "none" }}>
                    <Square size={16} fill="currentColor" /> Stop Replay
                  </button>
                ) : (
                  <button onClick={startReplay} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: "#f0fdfa", color: "#0d9488", fontWeight: 700, fontSize: 13, cursor: "pointer", border: "none" }}>
                    <Play size={16} fill="currentColor" /> Replay Mission
                  </button>
                )}
                <div style={{ width: 1, height: 24, background: "var(--border-faint)", margin: "0 4px" }} />

                <select 
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  style={{
                    padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border-faint)", 
                    background: "var(--surface-alt)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", outline: "none"
                  }}
                >
                  <option value={0.5}>0.5x Speed</option>
                  <option value={1}>1.0x Speed</option>
                  <option value={2}>2.0x Speed</option>
                  <option value={4}>4.0x Speed</option>
                  <option value={10}>10.0x Speed</option>
                  <option value={20}>20.0x Speed</option>
                </select>

                <select 
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  style={{
                    padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border-faint)", 
                    background: "var(--surface-alt)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", outline: "none"
                  }}
                >
                  <option value={500}>500m Radius</option>
                  <option value={1000}>1km Radius</option>
                  <option value={2000}>2km Radius</option>
                  <option value={5000}>5km Radius</option>
                </select>

                <div style={{ width: 1, height: 24, background: "var(--border-faint)", margin: "0 4px" }} />

                <button onClick={() => setShowHeatmap(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "1px solid", borderColor: showHeatmap ? "#f97316" : "transparent", background: showHeatmap ? "#fff7ed" : "transparent", color: showHeatmap ? "#ea580c" : "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
                  <MapIcon size={16} /> Heatmap
                </button>

                <button onClick={() => setShowHotspots(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "1px solid", borderColor: showHotspots ? "#ef4444" : "transparent", background: showHotspots ? "#fef2f2" : "transparent", color: showHotspots ? "#dc2626" : "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
                  <Flame size={16} /> Hotspots
                </button>

                {replayIdx !== null && (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "0 16px" }}>
                    <div style={{ flex: 1, height: 6, background: "var(--surface-alt)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${((replayIdx + 1) / dronePoints.length) * 100}%`, height: "100%", background: "#0d9488", transition: "width 0.1s" }} />
                    </div>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", fontFamily: "monospace", fontWeight: 700 }}>
                      {replayIdx + 1} / {dronePoints.length}
                    </span>
                  </div>
                )}

              </div>

              {/* Map container */}
              <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border-faint)", height: 650, position: "relative", boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
                {isMounted && (
                  <MapContainer center={droneCenter} zoom={15} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                    <TileLayer attribution='&copy; <a href="https://carto.com/">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <DroneMapInnerWrapper
                      allPoints={dronePoints}
                      visiblePoints={visiblePoints}
                      isReplaying={isReplaying}
                      hotspots={hotspots}
                      showHeatmap={showHeatmap}
                      showHotspots={showHotspots}
                      physicalSources={physicalSources}
                      searchRadius={searchRadius}
                    />
                  </MapContainer>
                )}

                {/* Hotspot legend */}
                {showHotspots && hotspots.length > 0 && (
                  <div style={{ position: "absolute", bottom: 24, right: 24, zIndex: 800, background: "rgba(255,255,255,0.95)", borderRadius: 12, padding: "12px 16px", border: "1px solid var(--border-faint)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", maxWidth: 200 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Hotspot Sources</div>
                    {Array.from(new Map(hotspots.map(h => [h.analysis.top3[0].id, h.analysis.top3[0]])).values()).slice(0, 4).map(src => (
                      <div key={src.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: src.color, flexShrink: 0 }} />
                        <span>{src.name.split("/")[0].trim()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI right panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", maxHeight: 720, paddingRight: 4 }}>
              {peakAnalysis && <AIPredictionPanel analysis={peakAnalysis} />}
              {currentPoint && <SensorReadingsPanel point={currentPoint} />}
              {peakAnalysis && <AlertsPanel analysis={peakAnalysis} />}
            </div>
          </div>

          {/* Data table */}
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border-faint)", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8 }}>
              <FileSpreadsheet size={18} color="#64748b" />
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Mission Log (first 200 records)</div>
            </div>
            <div style={{ overflowX: "auto", maxHeight: 400, overflowY: "auto" }}>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--surface-alt)", position: "sticky", top: 0, boxShadow: "0 1px 0 #e2e8f0" }}>
                    {["#", "Lat", "Lng", "MQ-135", "MQ-9", "MQ-2", "Sats", "Temp °C", "Hum %", "AQI", "Status"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dronePoints.slice(0, 200).map((p, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: "var(--surface)" }}>
                      <td style={{ padding: "10px 16px", color: "#94a3b8", fontFamily: "monospace" }}>{i + 1}</td>
                      <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "var(--text-secondary)" }}>{p.lat.toFixed(5)}</td>
                      <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "var(--text-secondary)" }}>{p.lng.toFixed(5)}</td>
                      <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "var(--text-primary)", fontWeight: 600 }}>{p.mq135.toFixed(0)}</td>
                      <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "var(--text-primary)", fontWeight: 600 }}>{p.mq9.toFixed(0)}</td>
                      <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "var(--text-primary)", fontWeight: 600 }}>{p.mq2.toFixed(0)}</td>
                      <td style={{ padding: "10px 16px", color: "var(--text-secondary)" }}>{p.satellites}</td>
                      <td style={{ padding: "10px 16px", color: "var(--text-secondary)" }}>{p.temperature.toFixed(1)}</td>
                      <td style={{ padding: "10px 16px", color: "var(--text-secondary)" }}>{p.humidity.toFixed(1)}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 800, color: p.aqiColor, background: `${p.aqiColor}15`, borderRadius: 12, padding: "4px 10px" }}>{p.aqi}</span>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ fontWeight: 700, fontSize: 11, color: p.aqiColor, background: `${p.aqiColor}15`, border: `1px solid ${p.aqiColor}40`, borderRadius: 12, padding: "4px 10px", display: "inline-block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {p.aqiLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dronePoints.length > 200 && (
                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: 16, fontWeight: 500, background: "var(--surface-alt)" }}>
                  Showing 200 of {dronePoints.length} records
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
