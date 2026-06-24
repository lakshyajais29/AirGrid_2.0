"use client"

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"

// ─── Dynamic Leaflet imports (SSR-safe) ──────────────────────────────────────

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
)
const CircleMarker = dynamic(
  () => import("react-leaflet").then((m) => m.CircleMarker),
  { ssr: false }
)
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
)
const Polyline = dynamic(
  () => import("react-leaflet").then((m) => m.Polyline),
  { ssr: false }
)

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Waypoint {
  lat: number
  lon: number
  altitude_ft: number
  aqi: number
  temperature_c: number
  pm25: number
  pm10: number
  no2: number
  co: number
  timestamp: string
  waypoint_name: string
}

/** Drone CSV data point (from actual hardware log) */
export interface DronePoint {
  timestamp: number    // col A
  lat: number          // col B
  lng: number          // col C
  mq135: number        // col D – MQ135 raw (gas sensor)
  satellites: number   // col E
  col6: number
  col7: number
  temperature: number  // col H (~29°C)
  humidity: number     // col I (~48%)
  col10: number
  // Derived
  aqi: number
  aqiLabel: string
  aqiColor: string
}

type PollutantKey = "aqi" | "pm25" | "pm10" | "no2" | "co" | "temperature_c"
type ActiveTab = "flight" | "drone"

interface PollutantTab {
  key: PollutantKey
  label: string
  unit: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POLLUTANT_TABS: PollutantTab[] = [
  { key: "aqi",           label: "AQI",        unit: "" },
  { key: "pm25",          label: "PM2.5",       unit: "µg/m³" },
  { key: "pm10",          label: "PM10",        unit: "µg/m³" },
  { key: "no2",           label: "NO₂",         unit: "µg/m³" },
  { key: "co",            label: "CO",          unit: "mg/m³" },
  { key: "temperature_c", label: "Temperature", unit: "°C" },
]

const SAMPLE_CSV = `lat,lon,altitude_ft,aqi,temperature_c,pm25,pm10,no2,co,timestamp,waypoint_name
28.5562,77.0999,800,145,28.3,67.2,89.1,34.2,1.2,2024-01-15T08:00:00,IGI_Departure
28.5701,77.1234,2500,178,26.1,89.4,112.3,45.1,1.8,2024-01-15T08:04:00,Dwarka_Sector21
28.6139,77.2090,5000,134,24.8,55.3,78.2,28.9,1.1,2024-01-15T08:09:00,Connaught_Place
28.6517,77.2219,7000,98,22.3,41.2,56.8,19.4,0.8,2024-01-15T08:14:00,Civil_Lines
28.7041,77.1025,9000,67,19.8,28.4,42.1,14.2,0.5,2024-01-15T08:20:00,Rohini_Sector12`

// ─── Color helpers ────────────────────────────────────────────────────────────

function aqiColor(value: number): string {
  if (value <= 50)  return "#00C851"
  if (value <= 100) return "#FFD700"
  if (value <= 200) return "#FF8C00"
  if (value <= 300) return "#FF4444"
  return "#8B008B"
}

function aqiLabel(value: number): string {
  if (value <= 50)  return "Good"
  if (value <= 100) return "Moderate"
  if (value <= 200) return "Poor"
  if (value <= 300) return "Very Poor"
  return "Hazardous"
}

function pollutantColor(val: number, key: PollutantKey): string {
  if (key === "aqi")          return aqiColor(val)
  if (key === "temperature_c") {
    if (val <= 15) return "#00C851"
    if (val <= 25) return "#FFD700"
    if (val <= 35) return "#FF8C00"
    return "#FF4444"
  }
  const thresholds: Record<PollutantKey, [number, number, number, number]> = {
    pm25:          [12, 35, 55, 150],
    pm10:          [54, 154, 254, 354],
    no2:           [40, 80, 180, 280],
    co:            [1, 2, 10, 17],
    aqi:           [50, 100, 200, 300],
    temperature_c: [15, 25, 35, 45],
  }
  const [t1, t2, t3, t4] = thresholds[key]
  if (val <= t1) return "#00C851"
  if (val <= t2) return "#FFD700"
  if (val <= t3) return "#FF8C00"
  if (val <= t4) return "#FF4444"
  return "#8B008B"
}

function aqiBg(value: number): string {
  if (value <= 50)  return "rgba(0,200,81,0.15)"
  if (value <= 100) return "rgba(255,215,0,0.15)"
  if (value <= 200) return "rgba(255,140,0,0.15)"
  if (value <= 300) return "rgba(255,68,68,0.15)"
  return "rgba(139,0,139,0.15)"
}

// ─── Drone AQI conversion ──────────────────────────────────────────────────────

function mq135ToAQI(raw: number): number {
  if (raw <= 0) return 0
  if (raw < 150) return Math.round((raw / 150) * 50)
  if (raw < 200) return Math.round(50 + ((raw - 150) / 50) * 70)
  if (raw < 250) return Math.round(120 + ((raw - 200) / 50) * 80)
  if (raw < 300) return Math.round(200 + ((raw - 250) / 50) * 100)
  return Math.round(300 + (raw - 300))
}

function droneAqiMeta(aqi: number): { label: string; color: string } {
  if (aqi <= 50)  return { label: "Good",        color: "#00C851" }
  if (aqi <= 100) return { label: "Satisfactory", color: "#FFD700" }
  if (aqi <= 200) return { label: "Moderate",    color: "#FF8C00" }
  if (aqi <= 300) return { label: "Poor",        color: "#FF4444" }
  if (aqi <= 400) return { label: "Very Poor",   color: "#922B21" }
  return            { label: "Severe",       color: "#5B0000" }
}

// ─── CSV parsers ──────────────────────────────────────────────────────────────

function parseFlightCSV(text: string): Waypoint[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const cols = line.split(",")
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = (cols[i] ?? "").trim() })
    return {
      lat:           parseFloat(obj.lat)           || 0,
      lon:           parseFloat(obj.lon)           || 0,
      altitude_ft:   parseFloat(obj.altitude_ft)   || 0,
      aqi:           parseFloat(obj.aqi)           || 0,
      temperature_c: parseFloat(obj.temperature_c) || 0,
      pm25:          parseFloat(obj.pm25)          || 0,
      pm10:          parseFloat(obj.pm10)          || 0,
      no2:           parseFloat(obj.no2)           || 0,
      co:            parseFloat(obj.co)            || 0,
      timestamp:     obj.timestamp || "",
      waypoint_name: obj.waypoint_name || `WP-${cols[0]}`,
    }
  }).filter((w) => w.lat !== 0 && w.lon !== 0)
}

function parseDroneCSV(text: string): DronePoint[] {
  const lines = text.split(/\r?\n/).filter(Boolean)
  const raw: DronePoint[] = []

  for (const line of lines) {
    const cols = line.split(",").map((c) => c.trim())
    if (cols.length < 5) continue
    // Skip header/text rows
    if (isNaN(Number(cols[0])) || isNaN(Number(cols[1]))) continue

    const lat = parseFloat(cols[1])
    const lng = parseFloat(cols[2])

    // ── Strict India geographic bounds (covers all of India + 2° buffer) ──
    // Lat: 6°N – 38°N   |   Lng: 66°E – 100°E
    if (isNaN(lat) || isNaN(lng)) continue
    if (lat < 6 || lat > 38)   continue   // rejects -1 rows, Middle-East drift, etc.
    if (lng < 66 || lng > 100) continue   // rejects rows with lng ~45-55 (Middle East)

    // Sanity-check MQ135: sensor physically can't give >1000 raw in normal air
    const mq135raw = parseFloat(cols[3]) || 0
    if (mq135raw < 0 || mq135raw > 1000) continue

    const aqi  = mq135ToAQI(mq135raw)
    const meta = droneAqiMeta(aqi)
    raw.push({
      timestamp:   parseFloat(cols[0]) || 0,
      lat, lng,
      mq135:       mq135raw,
      satellites:  parseFloat(cols[4]) || 0,
      col6:        parseFloat(cols[5]) || 0,
      col7:        parseFloat(cols[6]) || 0,
      temperature: parseFloat(cols[7]) || 0,
      humidity:    parseFloat(cols[8]) || 0,
      col10:       parseFloat(cols[9]) || 0,
      aqi,
      aqiLabel: meta.label,
      aqiColor:  meta.color,
    })
  }

  // ── Remove teleport outliers: skip any point that jumps >2 km from last valid ──
  if (raw.length < 2) return raw
  const cleaned: DronePoint[] = [raw[0]]
  for (let i = 1; i < raw.length; i++) {
    const prev = cleaned[cleaned.length - 1]
    if (distKm(prev, raw[i]) <= 2) cleaned.push(raw[i])
    // else: silently drop the teleport point
  }
  return cleaned
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts)
    const h = d.getHours()
    const m = d.getMinutes().toString().padStart(2, "0")
    const ampm = h >= 12 ? "PM" : "AM"
    const h12 = ((h % 12) || 12).toString().padStart(2, "0")
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return `${h12}:${m} ${ampm} · ${months[d.getMonth()]} ${d.getDate()}`
  } catch { return ts }
}

function flightDuration(waypoints: Waypoint[]): string {
  if (waypoints.length < 2) return "—"
  try {
    const start = new Date(waypoints[0].timestamp).getTime()
    const end   = new Date(waypoints[waypoints.length - 1].timestamp).getTime()
    const mins  = Math.round((end - start) / 60000)
    if (mins < 60) return `${mins} min`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  } catch { return "—" }
}

function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

function distKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2
    + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180)
    * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href     = url
  a.download = "sample_flight_path.csv"
  a.click()
  URL.revokeObjectURL(url)
}

function exportDroneCSV(points: DronePoint[]) {
  const header = "Index,Timestamp,Latitude,Longitude,MQ135_Raw,Satellites,Temperature,Humidity,AQI,AQI_Label\n"
  const rows = points.map((p, i) =>
    `${i+1},${p.timestamp},${p.lat},${p.lng},${p.mq135},${p.satellites},${p.temperature},${p.humidity},${p.aqi},${p.aqiLabel}`
  ).join("\n")
  const blob = new Blob([header + rows], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = "drone_path_aqi.csv"; a.click()
  URL.revokeObjectURL(url)
}

// ─── Flight corridor map controls ────────────────────────────────────────────

interface MapControlsProps {
  waypoints: Waypoint[]
  pollutant: PollutantKey
  focusIndex: number | null
}

function MapControls({ waypoints, pollutant, focusIndex }: MapControlsProps) {
  const { useMap } = require("react-leaflet") as typeof import("react-leaflet")
  const L = require("leaflet") as typeof import("leaflet")
  const map = useMap()

  useEffect(() => {
    if (waypoints.length < 2) return
    const bounds = L.latLngBounds(waypoints.map((w) => [w.lat, w.lon] as [number, number]))
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [waypoints, map, L])

  useEffect(() => {
    if (focusIndex === null) return
    const wp = waypoints[focusIndex]
    if (!wp) return
    map.flyTo([wp.lat, wp.lon], 14, { duration: 0.8 })
  }, [focusIndex, waypoints, map])

  const badgeRef = useRef<L.Control | null>(null)
  useEffect(() => {
    if (badgeRef.current) map.removeControl(badgeRef.current)
    const count = waypoints.length
    const CustomControl = L.Control.extend({
      options: { position: "topleft" },
      onAdd() {
        const div = L.DomUtil.create("div")
        div.innerHTML = `✈ FLIGHT CORRIDOR · ${count} WAYPOINTS`
        div.style.cssText = [
          "background:rgba(13,27,42,0.88)", "color:white", "font-family:monospace",
          "padding:7px 14px", "border-radius:8px", "border:1px solid rgba(15,139,141,0.5)",
          "font-size:11px", "font-weight:bold", "letter-spacing:0.06em",
          "pointer-events:none", "white-space:nowrap",
        ].join(";")
        return div
      },
    })
    const ctrl = new CustomControl() as unknown as L.Control
    ctrl.addTo(map)
    badgeRef.current = ctrl
    return () => { map.removeControl(ctrl) }
  }, [waypoints.length, map, L])

  const legendRef = useRef<L.Control | null>(null)
  useEffect(() => {
    if (legendRef.current) map.removeControl(legendRef.current)
    const LegendControl = L.Control.extend({
      options: { position: "bottomleft" },
      onAdd() {
        const div = L.DomUtil.create("div")
        div.style.cssText = [
          "background:rgba(255,255,255,0.95)", "border:1px solid #e2e8f0",
          "border-radius:10px", "padding:10px 14px", "font-family:sans-serif",
          "font-size:11px", "box-shadow:0 2px 12px rgba(13,27,42,0.1)",
          "pointer-events:none", "min-width:120px",
        ].join(";")
        div.innerHTML = `
          <div style="font-weight:800;font-size:10px;letter-spacing:0.1em;color:#4A5568;text-transform:uppercase;margin-bottom:8px">AQI Scale</div>
          ${[
            ["#00C851","Good","0–50"],
            ["#FFD700","Moderate","51–100"],
            ["#FF8C00","Poor","101–200"],
            ["#FF4444","Very Poor","201–300"],
            ["#8B008B","Hazardous","300+"],
          ].map(([c, l, r]) => `
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px">
              <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${c};flex-shrink:0"></span>
              <span style="color:#4A5568;font-weight:600">${l}</span>
              <span style="color:#A0AEC0;margin-left:auto">${r}</span>
            </div>
          `).join("")}
        `
        return div
      },
    })
    const legend = new LegendControl() as unknown as L.Control
    legend.addTo(map)
    legendRef.current = legend
    return () => { map.removeControl(legend) }
  }, [map, L])

  if (waypoints.length === 0) return null

  return (
    <>
      {waypoints.slice(0, -1).map((wp, i) => {
        const nextWp = waypoints[i + 1]
        const val = wp[pollutant] as number
        const color = pollutantColor(val, pollutant)
        return (
          <Polyline
            key={`seg-${i}`}
            positions={[[wp.lat, wp.lon], [nextWp.lat, nextWp.lon]]}
            pathOptions={{ color, weight: 4, opacity: 0.85 }}
          />
        )
      })}
      {waypoints.map((wp, i) => {
        const isStart = i === 0
        const isEnd   = i === waypoints.length - 1
        const val     = wp[pollutant] as number
        const color   = pollutantColor(val, pollutant)
        const radius  = isStart || isEnd ? 10 : 6
        const fillColor = isStart ? "#00C851" : isEnd ? "#FF4444" : color
        return (
          <CircleMarker
            key={`wp-${i}`}
            center={[wp.lat, wp.lon]}
            radius={radius}
            pathOptions={{ fillColor, color: "#ffffff", weight: 2, fillOpacity: 1 }}
          >
            <Popup>
              <div style={{ fontFamily: "var(--font-sans, sans-serif)", minWidth: "200px", padding: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#0D1B2A" }}>
                    {isStart ? "✈ DEPARTURE — " : isEnd ? "🛬 ARRIVAL — " : "📍 "}{wp.waypoint_name.replace(/_/g, " ")}
                  </div>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: aqiBg(wp.aqi), border: `1px solid ${aqiColor(wp.aqi)}40`, borderRadius: "8px", padding: "4px 10px", marginBottom: "10px" }}>
                  <span style={{ fontWeight: 800, fontFamily: "monospace", fontSize: "16px", color: aqiColor(wp.aqi) }}>{wp.aqi}</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: aqiColor(wp.aqi) }}>AQI — {aqiLabel(wp.aqi)}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: "12px", marginBottom: "8px" }}>
                  {[["PM2.5", `${wp.pm25} µg/m³`], ["PM10", `${wp.pm10} µg/m³`], ["NO₂", `${wp.no2} µg/m³`], ["CO", `${wp.co} mg/m³`], ["Temp", `${wp.temperature_c}°C`], ["Alt", `${wp.altitude_ft.toLocaleString()} ft`]].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ color: "#8A9BB0", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>{k}</div>
                      <div style={{ color: "#0D1B2A", fontWeight: 600, fontFamily: "monospace" }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: "11px", color: "#A0AEC0", fontFamily: "monospace", borderTop: "1px solid #E2E8F0", paddingTop: "6px" }}>
                  🕐 {formatTimestamp(wp.timestamp)}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </>
  )
}

function MapControlsWrapper(props: MapControlsProps) {
  const [Comp, setComp] = useState<React.ComponentType<MapControlsProps> | null>(null)
  useEffect(() => {
    import("react-leaflet").then(() => { setComp(() => MapControls) })
  }, [])
  if (!Comp) return null
  return <Comp {...props} />
}

// ─── Drone map inner component (zoom-animated replay) ────────────────────────

interface DroneMapInnerProps {
  allPoints: DronePoint[]
  visiblePoints: DronePoint[]
  isReplaying: boolean
}

function DroneMapInner({ allPoints, visiblePoints, isReplaying }: DroneMapInnerProps) {
  const { useMap } = require("react-leaflet") as typeof import("react-leaflet")
  const L = require("leaflet") as typeof import("leaflet")
  const map = useMap()
  const prevLen = useRef(0)

  // Fit bounds when data first loads — animated fly-to
  useEffect(() => {
    if (allPoints.length < 2) return
    const bounds = L.latLngBounds(allPoints.map((p) => [p.lat, p.lng] as [number, number]))
    // flyToBounds for smooth animated entry; cap zoom so we stay street-level
    map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 18, duration: 1.5 })
  }, [allPoints, map, L])

  // Zoom-follow during replay: fly to latest visible point
  useEffect(() => {
    if (!isReplaying) return
    if (visiblePoints.length === 0) return
    if (visiblePoints.length === prevLen.current) return
    prevLen.current = visiblePoints.length
    const last = visiblePoints[visiblePoints.length - 1]
    map.flyTo([last.lat, last.lng], 17, { duration: 0.4, easeLinearity: 0.5 })
  }, [visiblePoints.length, isReplaying, visiblePoints, map])

  // When replay stops, zoom back to full path
  useEffect(() => {
    if (isReplaying) return
    if (allPoints.length < 2) return
    const bounds = L.latLngBounds(allPoints.map((p) => [p.lat, p.lng] as [number, number]))
    map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 17, duration: 1.2 })
  }, [isReplaying, allPoints, map, L])

  // Badge
  const badgeRef = useRef<L.Control | null>(null)
  useEffect(() => {
    if (badgeRef.current) map.removeControl(badgeRef.current)
    const CustomControl = L.Control.extend({
      options: { position: "topleft" },
      onAdd() {
        const div = L.DomUtil.create("div")
        div.innerHTML = `🛸 DRONE MISSION · ${allPoints.length} POINTS`
        div.style.cssText = [
          "background:rgba(13,27,42,0.88)", "color:white", "font-family:monospace",
          "padding:7px 14px", "border-radius:8px", "border:1px solid rgba(201,168,76,0.6)",
          "font-size:11px", "font-weight:bold", "letter-spacing:0.06em",
          "pointer-events:none", "white-space:nowrap",
        ].join(";")
        return div
      },
    })
    const ctrl = new CustomControl() as unknown as L.Control
    ctrl.addTo(map)
    badgeRef.current = ctrl
    return () => { map.removeControl(ctrl) }
  }, [allPoints.length, map, L])

  // Legend
  const legendRef = useRef<L.Control | null>(null)
  useEffect(() => {
    if (legendRef.current) map.removeControl(legendRef.current)
    const LegendControl = L.Control.extend({
      options: { position: "bottomleft" },
      onAdd() {
        const div = L.DomUtil.create("div")
        div.style.cssText = [
          "background:rgba(255,255,255,0.95)", "border:1px solid #e2e8f0",
          "border-radius:10px", "padding:10px 14px", "font-family:sans-serif",
          "font-size:11px", "box-shadow:0 2px 12px rgba(13,27,42,0.1)",
          "pointer-events:none",
        ].join(";")
        div.innerHTML = `
          <div style="font-weight:800;font-size:10px;letter-spacing:0.1em;color:#4A5568;text-transform:uppercase;margin-bottom:8px">AQI (MQ135)</div>
          ${[["#00C851","Good","0–50"],["#FFD700","Moderate","51–100"],["#FF8C00","Poor","101–200"],["#FF4444","Very Poor","201–300"],["#8B008B","Hazardous","300+"]].map(([c,l,r]) => `
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
              <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${c}"></span>
              <span style="color:#4A5568;font-weight:600">${l}</span>
              <span style="color:#A0AEC0;margin-left:auto">${r}</span>
            </div>`).join("")}
        `
        return div
      },
    })
    const legend = new LegendControl() as unknown as L.Control
    legend.addTo(map)
    legendRef.current = legend
    return () => { map.removeControl(legend) }
  }, [map, L])

  if (visiblePoints.length === 0) return null

  // Sample display markers – every N-th for performance (max 120 markers)
  const step = Math.max(1, Math.floor(visiblePoints.length / 120))
  const displayPts = visiblePoints.filter((_, i) => i % step === 0 || i === visiblePoints.length - 1)

  return (
    <>
      {/* Colored polyline segments */}
      {visiblePoints.slice(0, -1).map((p, i) => {
        const next = visiblePoints[i + 1]
        return (
          <Polyline
            key={`dp-seg-${i}`}
            positions={[[p.lat, p.lng], [next.lat, next.lng]]}
            pathOptions={{ color: p.aqiColor, weight: 4, opacity: 0.88 }}
          />
        )
      })}

      {/* Dot markers */}
      {displayPts.map((p, i) => (
        <CircleMarker
          key={`dp-dot-${i}`}
          center={[p.lat, p.lng]}
          radius={5}
          pathOptions={{ fillColor: p.aqiColor, color: "#fff", weight: 1.5, fillOpacity: 0.9 }}
        >
          <Popup>
            <div style={{ fontFamily: "sans-serif", minWidth: "180px" }}>
              <div style={{ fontWeight: 700, marginBottom: "6px", color: "#0D1B2A" }}>📍 Point #{i + 1}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: `${p.aqiColor}18`, border: `1px solid ${p.aqiColor}50`, borderRadius: "8px", padding: "3px 10px", marginBottom: "8px" }}>
                <span style={{ fontWeight: 800, fontFamily: "monospace", fontSize: "15px", color: p.aqiColor }}>{p.aqi}</span>
                <span style={{ fontSize: "11px", fontWeight: 600, color: p.aqiColor }}>{p.aqiLabel}</span>
              </div>
              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                <tbody>
                  {[["MQ135", p.mq135.toFixed(2)], ["Temp", `${p.temperature.toFixed(1)}°C`], ["Humidity", `${p.humidity.toFixed(1)}%`], ["Satellites", p.satellites], ["Lat", p.lat.toFixed(5)], ["Lng", p.lng.toFixed(5)]].map(([k, v]) => (
                    <tr key={String(k)}>
                      <td style={{ color: "#8A9BB0", paddingRight: "8px", paddingBottom: "3px" }}>{k}</td>
                      <td style={{ fontWeight: 600, fontFamily: "monospace" }}>{String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Start marker */}
      <CircleMarker
        center={[visiblePoints[0].lat, visiblePoints[0].lng]}
        radius={11}
        pathOptions={{ fillColor: "#00f5d4", color: "#0F8B8D", weight: 2.5, fillOpacity: 1 }}
      >
        <Popup><strong>🛸 Mission Start</strong></Popup>
      </CircleMarker>

      {/* Live / End marker */}
      {visiblePoints.length > 1 && (
        <CircleMarker
          center={[visiblePoints[visiblePoints.length - 1].lat, visiblePoints[visiblePoints.length - 1].lng]}
          radius={11}
          pathOptions={{ fillColor: isReplaying ? "#FFC000" : "#FF4444", color: "#fff", weight: 2.5, fillOpacity: 1 }}
        >
          <Popup>{isReplaying ? "🛸 Drone (live)" : "🏁 Mission End"}</Popup>
        </CircleMarker>
      )}
    </>
  )
}

function DroneMapInnerWrapper(props: DroneMapInnerProps) {
  const [Comp, setComp] = useState<React.ComponentType<DroneMapInnerProps> | null>(null)
  useEffect(() => {
    import("react-leaflet").then(() => { setComp(() => DroneMapInner) })
  }, [])
  if (!Comp) return null
  return <Comp {...props} />
}

// ─── AQI Sparkline ────────────────────────────────────────────────────────────

function AQISparklineFull({ data }: { data: number[] }) {
  if (data.length < 2) return null
  const w = 900, h = 72
  const mn = Math.min(...data), mx = Math.max(...data)
  const range = mx - mn || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - 8 - ((v - mn) / range) * (h - 16)
    return `${x},${y}`
  }).join(" ")
  const fillPts = `0,${h} ${pts} ${w},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "72px", display: "block" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="aqiFill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F8B8D" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0F8B8D" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="aqiLine2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00C851" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FF4444" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill="url(#aqiFill2)" />
      <polyline points={pts} fill="none" stroke="url(#aqiLine2)" strokeWidth="2" strokeLinejoin="round" />
      <text x="4" y={h - 4} fontSize="10" fill="#8A9BB0">AQI {mn}</text>
      <text x="4" y="12" fontSize="10" fill="#8A9BB0">AQI {mx}</text>
    </svg>
  )
}

// ─── Shared style helpers ─────────────────────────────────────────────────────

const S = {
  container: { fontFamily: "var(--font-sans, sans-serif)" } as React.CSSProperties,
  grid: { display: "grid", gridTemplateColumns: "40% 60%", gap: "20px", alignItems: "start" } as React.CSSProperties,
  leftPanel: { display: "flex", flexDirection: "column" as const, gap: "16px" } as React.CSSProperties,
  sectionLabel: { fontSize: "10px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "var(--accent-teal, #0F8B8D)", marginBottom: "4px" } as React.CSSProperties,
  panelCard: { background: "linear-gradient(135deg, #ffffff, #f0f4ff)", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 2px 12px rgba(13,27,42,0.07)", padding: "16px" } as React.CSSProperties,
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const LiveFlightMonitor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("flight")
  const [isMounted, setIsMounted] = useState(false)

  // Flight tab state
  const [waypoints,    setWaypoints]    = useState<Waypoint[]>([])
  const [fileName,     setFileName]     = useState<string | null>(null)
  const [pollutant,    setPollutant]    = useState<PollutantKey>("aqi")
  const [focusIndex,   setFocusIndex]   = useState<number | null>(null)
  const [isDragging,   setIsDragging]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Drone tab state
  const [dronePoints,      setDronePoints]      = useState<DronePoint[]>([])
  const [droneFiles,       setDroneFiles]        = useState<string[]>([])
  const [isDroneDragging,  setIsDroneDragging]  = useState(false)
  const [replayIdx,        setReplayIdx]         = useState<number | null>(null)
  const [isReplaying,      setIsReplaying]       = useState(false)
  const replayRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const droneInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setIsMounted(true) }, [])
  useEffect(() => () => { if (replayRef.current) clearInterval(replayRef.current) }, [])

  // ── Flight file handling ──────────────────────────────────────────────────
  const processFlightFile = useCallback((file: File) => {
    setFileName(file.name)
    file.text().then((text) => {
      setWaypoints(parseFlightCSV(text))
      setFocusIndex(null)
    })
  }, [])

  const handleFlightDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.endsWith(".csv")) processFlightFile(file)
  }

  // ── Drone file handling ───────────────────────────────────────────────────
  const processDroneFiles = useCallback((fileList: FileList) => {
    const readers: Promise<{ name: string; text: string }>[] = []
    Array.from(fileList).forEach((file) => {
      if (!file.name.endsWith(".csv")) return
      readers.push(new Promise((res) => {
        const r = new FileReader()
        r.onload = (e) => res({ name: file.name, text: e.target?.result as string })
        r.readAsText(file)
      }))
    })
    Promise.all(readers).then((results) => {
      const all = results.flatMap((r) => parseDroneCSV(r.text))
      setDroneFiles(results.map((r) => r.name))
      setDronePoints(all)
      setReplayIdx(null)
      setIsReplaying(false)
    })
  }, [])

  const handleDroneDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDroneDragging(false)
    processDroneFiles(e.dataTransfer.files)
  }

  // ── Replay ────────────────────────────────────────────────────────────────
  const startReplay = () => {
    if (dronePoints.length === 0) return
    if (replayRef.current) clearInterval(replayRef.current)
    setReplayIdx(0)
    setIsReplaying(true)
    let i = 0
    replayRef.current = setInterval(() => {
      i += 1
      if (i >= dronePoints.length) {
        clearInterval(replayRef.current!)
        setIsReplaying(false)
        setReplayIdx(null)
      } else {
        setReplayIdx(i)
      }
    }, 40) // ~25 fps
  }

  const stopReplay = () => {
    if (replayRef.current) clearInterval(replayRef.current)
    setIsReplaying(false)
    setReplayIdx(null)
  }

  const visibleDronePoints = replayIdx !== null ? dronePoints.slice(0, replayIdx + 1) : dronePoints

  // ── Drone stats ───────────────────────────────────────────────────────────
  const droneStats = useMemo(() => {
    if (!dronePoints.length) return null
    const avgAQI = Math.round(avg(dronePoints.map((p) => p.aqi)))
    const maxAQI = Math.max(...dronePoints.map((p) => p.aqi))
    const minAQI = Math.min(...dronePoints.map((p) => p.aqi))
    const avgTemp = +avg(dronePoints.map((p) => p.temperature)).toFixed(1)
    const avgHum  = +avg(dronePoints.map((p) => p.humidity)).toFixed(1)
    let dist = 0
    for (let i = 1; i < dronePoints.length; i++)
      dist += distKm(dronePoints[i - 1], dronePoints[i])
    return { avgAQI, maxAQI, minAQI, avgTemp, avgHum, dist: dist.toFixed(2), total: dronePoints.length }
  }, [dronePoints])

  // ── Flight stats ──────────────────────────────────────────────────────────
  const flightStats = useMemo(() => {
    if (!waypoints.length) return null
    const maxAQI = Math.max(...waypoints.map((w) => w.aqi))
    const avgTemp = waypoints.reduce((s, w) => s + w.temperature_c, 0) / waypoints.length
    return {
      total:    waypoints.length,
      maxAQI,
      maxAQIWp: waypoints.find((w) => w.aqi === maxAQI)?.waypoint_name.replace(/_/g, " ") ?? "",
      avgTemp:  avgTemp.toFixed(1),
      duration: flightDuration(waypoints),
    }
  }, [waypoints])

  const worstAQIIndex = useMemo(
    () => waypoints.reduce((best, w, i) => (w.aqi > (waypoints[best]?.aqi ?? 0) ? i : best), 0),
    [waypoints]
  )

  const droneCenter: [number, number] = dronePoints.length > 0
    ? [avg(dronePoints.map((p) => p.lat)), avg(dronePoints.map((p) => p.lng))]
    : [28.753, 77.498]

  // ── Tab button style ──────────────────────────────────────────────────────
  const tabBtn = (tab: ActiveTab): React.CSSProperties => ({
    padding: "9px 22px",
    borderRadius: "10px 10px 0 0",
    border: "1px solid",
    borderBottom: activeTab === tab ? "1px solid transparent" : "1px solid #E2E8F0",
    borderColor: activeTab === tab ? "#0F8B8D" : "#E2E8F0",
    background: activeTab === tab ? "#0F8B8D" : "rgba(244,246,250,0.8)",
    color: activeTab === tab ? "white" : "#4A6080",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    marginRight: "4px",
    position: "relative",
    zIndex: 2,
  })

  return (
    <div style={S.container}>
      {/* ── Tab bar ── */}
      <div style={{ display: "flex", alignItems: "flex-end", borderBottom: "1px solid #E2E8F0", marginBottom: "20px" }}>
        <button style={tabBtn("flight")} onClick={() => setActiveTab("flight")}>
          ✈ Flight Corridor
        </button>
        <button style={tabBtn("drone")} onClick={() => setActiveTab("drone")}>
          🛸 Drone CSV Log
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: Flight Corridor
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "flight" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div>
              <div style={S.sectionLabel}>Pollution Mapping</div>
              <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0D1B2A", margin: 0 }}>Flight Path Air Quality</h2>
              {fileName && (
                <div style={{ fontSize: "13px", color: "#0F8B8D", fontFamily: "monospace", marginTop: "4px", fontWeight: 600 }}>
                  ✈ {fileName} · {waypoints.length} waypoints loaded
                </div>
              )}
            </div>
          </div>

          <div style={S.grid}>
            <div style={S.leftPanel}>
              {/* Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFlightDrop}
                style={{ border: `2px dashed ${isDragging ? "#0F8B8D" : "#CBD5E0"}`, borderRadius: "12px", padding: "28px 16px", textAlign: "center", cursor: "pointer", background: isDragging ? "rgba(15,139,141,0.05)" : "rgba(244,246,250,0.7)", transition: "all 0.2s ease" }}
              >
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>✈</div>
                <div style={{ fontWeight: 600, color: "#1C2B3A", fontSize: "14px", marginBottom: "4px" }}>Drop flight CSV here or click to browse</div>
                <div style={{ fontSize: "12px", color: "#8A9BB0", marginBottom: "12px" }}>Columns: lat, lon, altitude_ft, aqi, temperature_c, pm25, pm10, no₂, co, timestamp, waypoint_name</div>
                <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) processFlightFile(f) }} />
                <button onClick={(e) => { e.stopPropagation(); downloadSample() }} style={{ background: "none", border: "1px solid #CBD5E0", borderRadius: "8px", padding: "5px 14px", fontSize: "12px", color: "#4A6080", cursor: "pointer", fontWeight: 600 }}>
                  📥 Download sample CSV format
                </button>
              </div>

              {/* Flight stats */}
              {flightStats && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[
                    { label: "Total Waypoints", value: flightStats.total,    color: "#0F8B8D" },
                    { label: "Max AQI",         value: flightStats.maxAQI,   color: aqiColor(flightStats.maxAQI), sub: flightStats.maxAQIWp },
                    { label: "Avg Temperature", value: `${flightStats.avgTemp}°C`, color: "#1A3A5C" },
                    { label: "Flight Duration", value: flightStats.duration, color: "#C9A84C" },
                  ].map((s) => (
                    <div key={s.label} style={{ ...S.panelCard, borderTop: `3px solid ${s.color}`, padding: "12px 14px" }}>
                      <div style={{ ...S.sectionLabel, marginBottom: "2px" }}>{s.label}</div>
                      <div style={{ fontFamily: "monospace", fontSize: "1.5rem", fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                      {s.sub && <div style={{ fontSize: "10px", color: "#8A9BB0", marginTop: "2px", fontWeight: 600 }}>{s.sub}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Pollutant selector */}
              {waypoints.length > 0 && (
                <div style={S.panelCard}>
                  <div style={S.sectionLabel}>Color Map By</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {POLLUTANT_TABS.map((tab) => {
                      const active = pollutant === tab.key
                      return (
                        <button key={tab.key} onClick={() => setPollutant(tab.key)} style={{ padding: "5px 12px", borderRadius: "7px", border: "1px solid", borderColor: active ? "#0F8B8D" : "#E2E8F0", background: active ? "#0F8B8D" : "white", color: active ? "white" : "#4A6080", fontWeight: 600, fontSize: "12px", cursor: "pointer", transition: "all 0.15s" }}>
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Waypoint table */}
              {waypoints.length > 0 && (
                <div style={{ ...S.panelCard, padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid #E2E8F0" }}>
                    <div style={S.sectionLabel}>Waypoint Log</div>
                  </div>
                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ background: "linear-gradient(90deg, #0D1B2A, #1A3A5C)", color: "white", position: "sticky", top: 0, zIndex: 2 }}>
                          {["#", "Name", "AQI", "PM2.5", "Temp", "Alt (ft)"].map((h) => (
                            <th key={h} style={{ padding: "8px 10px", textAlign: h === "#" ? "center" : "left", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {waypoints.map((wp, i) => {
                          const isWorst   = i === worstAQIIndex
                          const isFocused = focusIndex === i
                          const color     = aqiColor(wp.aqi)
                          return (
                            <tr key={i} onClick={() => setFocusIndex(isFocused ? null : i)} style={{ background: isWorst ? "rgba(255,68,68,0.07)" : isFocused ? "rgba(15,139,141,0.08)" : i % 2 === 0 ? "white" : "#F8FAFF", borderBottom: "1px solid #F1F5F9", borderLeft: `3px solid ${isFocused ? "#0F8B8D" : "transparent"}`, cursor: "pointer" }}>
                              <td style={{ padding: "8px 10px", textAlign: "center", color: "#8A9BB0", fontWeight: 700, fontFamily: "monospace", fontSize: "10px" }}>{i === 0 ? "🛫" : i === waypoints.length - 1 ? "🛬" : i + 1}</td>
                              <td style={{ padding: "8px 10px", fontWeight: 600, color: "#0D1B2A", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wp.waypoint_name.replace(/_/g, " ")}</td>
                              <td style={{ padding: "8px 10px" }}>
                                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "11px", color, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: "5px", padding: "1px 6px" }}>{wp.aqi}</span>
                              </td>
                              <td style={{ padding: "8px 10px", fontFamily: "monospace", color: "#4A5568", fontSize: "11px" }}>{wp.pm25}</td>
                              <td style={{ padding: "8px 10px", fontFamily: "monospace", color: "#4A5568", fontSize: "11px" }}>{wp.temperature_c}°</td>
                              <td style={{ padding: "8px 10px", fontFamily: "monospace", color: "#4A5568", fontSize: "11px" }}>{wp.altitude_ft.toLocaleString()}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Map */}
            <div style={{ borderRadius: "14px", overflow: "hidden", border: "1px solid #E2E8F0", height: "620px", position: "relative", boxShadow: "0 2px 12px rgba(13,27,42,0.08)" }}>
              {isMounted && (
                <MapContainer center={[28.5562, 77.0999]} zoom={11} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                  <TileLayer attribution='&copy; <a href="https://carto.com/">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                  <MapControlsWrapper waypoints={waypoints} pollutant={pollutant} focusIndex={focusIndex} />
                </MapContainer>
              )}
              {waypoints.length === 0 && (
                <div style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", background: "rgba(13,27,42,0.82)", color: "white", borderRadius: "10px", padding: "10px 20px", fontSize: "13px", fontWeight: 600, border: "1px solid rgba(15,139,141,0.4)", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 1000 }}>
                  ✈ Upload a CSV to visualise the flight path
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: Drone CSV Log
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "drone" && (
        <>
          <div style={{ marginBottom: "20px" }}>
            <div style={S.sectionLabel}>Drone Sensor Log</div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0D1B2A", margin: 0 }}>
              Drone Path & Air Quality Replay
            </h2>
            <p style={{ color: "#8A9BB0", fontSize: "13px", marginTop: "4px", marginBottom: 0 }}>
              Upload your hardware drone CSV → see the path on map with AQI colour-coding · Use replay to zoom-follow the drone
            </p>
          </div>

          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDroneDragging(true) }}
            onDragLeave={() => setIsDroneDragging(false)}
            onDrop={handleDroneDrop}
            onClick={() => droneInputRef.current?.click()}
            style={{ border: `2px dashed ${isDroneDragging ? "#C9A84C" : "#CBD5E0"}`, borderRadius: "12px", padding: "24px", textAlign: "center", cursor: "pointer", background: isDroneDragging ? "rgba(201,168,76,0.05)" : "rgba(244,246,250,0.7)", transition: "all 0.2s ease", marginBottom: "20px" }}
          >
            <input ref={droneInputRef} type="file" accept=".csv" multiple style={{ display: "none" }} onChange={(e) => { if (e.target.files) processDroneFiles(e.target.files) }} />
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>🛸</div>
            <div style={{ fontWeight: 600, color: "#1C2B3A", fontSize: "14px", marginBottom: "4px" }}>Drop drone CSV files here or click to browse</div>
            <div style={{ fontSize: "12px", color: "#8A9BB0", marginBottom: droneFiles.length ? "12px" : 0 }}>
              Format: Timestamp, Latitude, Longitude, MQ135_Raw, Satellites, Col6, Col7, Temperature, Humidity, Col10
            </div>
            {droneFiles.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                {droneFiles.map((f, i) => (
                  <span key={i} style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C", padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>✓ {f}</span>
                ))}
              </div>
            )}
          </div>

          {dronePoints.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", background: "rgba(255,255,255,0.7)", borderRadius: "16px" }}>
              <div style={{ fontSize: "56px", marginBottom: "12px" }}>📂</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#0D1B2A", marginBottom: "6px" }}>No drone data loaded yet</div>
              <div style={{ fontSize: "13px" }}>Upload your drone hardware CSV to visualize the path and AQI conditions</div>
            </div>
          )}

          {dronePoints.length > 0 && (
            <>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                {[
                  { label: "Data Points",  value: droneStats!.total,   unit: "",    icon: "📍", color: "#0F8B8D" },
                  { label: "Avg AQI",      value: droneStats!.avgAQI,  unit: "",    icon: "💨", color: droneAqiMeta(droneStats!.avgAQI).color },
                  { label: "Max AQI",      value: droneStats!.maxAQI,  unit: "",    icon: "⚠️", color: droneAqiMeta(droneStats!.maxAQI).color },
                  { label: "Avg Temp",     value: droneStats!.avgTemp, unit: "°C",  icon: "🌡️", color: "#E67E22" },
                  { label: "Avg Humidity", value: droneStats!.avgHum,  unit: "%",   icon: "💧", color: "#2980B9" },
                  { label: "Distance",     value: droneStats!.dist,    unit: " km", icon: "🛤️", color: "#8E44AD" },
                ].map((s) => (
                  <div key={s.label} style={{ background: "rgba(255,255,255,0.95)", borderRadius: "12px", padding: "14px 16px", borderTop: `3px solid ${s.color}`, boxShadow: "0 2px 8px rgba(13,27,42,0.06)" }}>
                    <div style={{ fontSize: "18px", marginBottom: "4px" }}>{s.icon}</div>
                    <div style={{ fontSize: "10px", color: "#8A9BB0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                    <div style={{ fontFamily: "monospace", fontSize: "20px", fontWeight: 900, color: s.color, lineHeight: 1.2 }}>{s.value}{s.unit}</div>
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
                {isReplaying ? (
                  <button onClick={stopReplay} style={{ padding: "8px 20px", borderRadius: "8px", border: "1px solid rgba(255,68,68,0.4)", background: "rgba(255,68,68,0.12)", color: "#FF4444", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                    ⏹ Stop Replay
                  </button>
                ) : (
                  <button onClick={startReplay} style={{ padding: "8px 20px", borderRadius: "8px", border: "1px solid rgba(15,139,141,0.4)", background: "rgba(15,139,141,0.12)", color: "#0F8B8D", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                    ▶ Replay Flight (Zoom Follow)
                  </button>
                )}
                {replayIdx !== null && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                    <div style={{ flex: 1, height: "6px", background: "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${((replayIdx + 1) / dronePoints.length) * 100}%`, height: "100%", background: "linear-gradient(90deg, #00C851, #FFD700, #FF4444)", borderRadius: "3px", transition: "width 0.1s" }} />
                    </div>
                    <span style={{ fontSize: "12px", color: "#8A9BB0", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                      {replayIdx + 1} / {dronePoints.length}
                    </span>
                  </div>
                )}
                <button onClick={() => exportDroneCSV(dronePoints)} style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: "8px", background: "linear-gradient(135deg, #0D1B2A, #1A3A5C)", color: "white", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                  ⬇ Export CSV
                </button>
              </div>

              {/* Map */}
              <div style={{ borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(201,168,76,0.3)", height: "500px", position: "relative", boxShadow: "0 4px 24px rgba(13,27,42,0.1)", marginBottom: "20px" }}>
                {isMounted && (
                  <MapContainer center={droneCenter} zoom={15} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                    <TileLayer attribution='&copy; <a href="https://carto.com/">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <DroneMapInnerWrapper allPoints={dronePoints} visiblePoints={visibleDronePoints} isReplaying={isReplaying} />
                  </MapContainer>
                )}
              </div>

              {/* AQI Legend */}
              <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: "12px", padding: "12px 20px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", marginBottom: "20px", boxShadow: "0 2px 8px rgba(13,27,42,0.06)" }}>
                <span style={{ fontWeight: 700, fontSize: "12px", color: "#0D1B2A" }}>AQI (from MQ135):</span>
                {[["#00C851","Good ≤50"],["#FFD700","Moderate ≤100"],["#FF8C00","Poor ≤200"],["#FF4444","Very Poor ≤300"],["#8B008B","Hazardous 300+"]].map(([c, l]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: c }} />
                    <span style={{ fontSize: "12px", color: "#1C2B3A" }}>{l}</span>
                  </div>
                ))}
              </div>

              {/* Sparkline */}
              <div style={{ ...S.panelCard, marginBottom: "20px" }}>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "#0D1B2A", marginBottom: "10px" }}>📈 AQI Timeline</div>
                <AQISparklineFull data={dronePoints.map((p) => p.aqi)} />
              </div>

              {/* Data table */}
              <div style={{ ...S.panelCard, padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "#0D1B2A" }}>📋 Flight Log (first 200 records)</div>
                </div>
                <div style={{ overflowX: "auto", maxHeight: "360px", overflowY: "auto" }}>
                  <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "linear-gradient(90deg, #0D1B2A, #1A3A5C)", color: "white", position: "sticky", top: 0 }}>
                        {["#","Timestamp","Latitude","Longitude","MQ135","Sats","Temp °C","Humidity %","AQI","Status"].map((h) => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap", fontSize: "11px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dronePoints.slice(0, 200).map((p, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8faff", borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "6px 12px", color: "#8A9BB0", fontFamily: "monospace" }}>{i + 1}</td>
                          <td style={{ padding: "6px 12px", fontFamily: "monospace" }}>{p.timestamp}</td>
                          <td style={{ padding: "6px 12px", fontFamily: "monospace" }}>{p.lat.toFixed(5)}</td>
                          <td style={{ padding: "6px 12px", fontFamily: "monospace" }}>{p.lng.toFixed(5)}</td>
                          <td style={{ padding: "6px 12px", fontFamily: "monospace" }}>{p.mq135.toFixed(2)}</td>
                          <td style={{ padding: "6px 12px" }}>{p.satellites}</td>
                          <td style={{ padding: "6px 12px" }}>{p.temperature.toFixed(1)}</td>
                          <td style={{ padding: "6px 12px" }}>{p.humidity.toFixed(1)}</td>
                          <td style={{ padding: "6px 12px" }}>
                            <span style={{ fontFamily: "monospace", fontWeight: 700, color: p.aqiColor, background: `${p.aqiColor}18`, borderRadius: "20px", padding: "2px 8px" }}>{p.aqi}</span>
                          </td>
                          <td style={{ padding: "6px 12px", fontWeight: 700, fontSize: "11px", color: p.aqiColor }}>{p.aqiLabel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dronePoints.length > 200 && (
                    <div style={{ textAlign: "center", color: "#8A9BB0", fontSize: "12px", padding: "10px" }}>
                      Showing 200 of {dronePoints.length} records
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
