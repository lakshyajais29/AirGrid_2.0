import React from "react";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import type { IncidentData } from "./IncidentDrawer";

type SourceCategory = "Construction Dust" | "Open Burning" | "Vehicular" | "Industrial" | "Road Dust" | "DG Set";

interface Ward {
  name:       string;
  zone:       string;
  aqi:        number;
  pm25:       number;
  pm10:       number;
  no2:        number;
  delta:      number;
  source:     SourceCategory;
  confidence: number;
  lat:        number;
  lng:        number;
}

const SOURCE_STYLE: Record<SourceCategory, { bg: string; text: string; border: string }> = {
  "Construction Dust": { bg: "#FEF9C3", text: "#854D0E", border: "#FDE047" },
  "Open Burning":      { bg: "#FEF2F2", text: "#991B1B", border: "#FCA5A5" },
  "Vehicular":         { bg: "#EFF6FF", text: "#1D4ED8", border: "#93C5FD" },
  "Industrial":        { bg: "#FDF4FF", text: "#6B21A8", border: "#D8B4FE" },
  "Road Dust":         { bg: "#FFF7ED", text: "#9A3412", border: "#FDBA74" },
  "DG Set":            { bg: "#F0FDF4", text: "#14532D", border: "#86EFAC" },
};

/* Short display labels so tags don't overflow the 280px column */
const SOURCE_SHORT: Record<SourceCategory, string> = {
  "Construction Dust": "Construction",
  "Open Burning":      "Open Burning",
  "Vehicular":         "Vehicular",
  "Industrial":        "Industrial",
  "Road Dust":         "Road Dust",
  "DG Set":            "DG Set",
};

const WARDS: Ward[] = [
  { name: "Anand Vihar",  zone: "East",       aqi: 312, pm25: 198, pm10: 287, no2: 89,  delta: +24, source: "Vehicular",         confidence: 91, lat: 28.6468, lng: 77.3162 },
  { name: "Bawana",       zone: "North",      aqi: 287, pm25: 176, pm10: 254, no2: 72,  delta: +11, source: "Industrial",        confidence: 87, lat: 28.7965, lng: 77.0385 },
  { name: "Mundka",       zone: "West",       aqi: 268, pm25: 164, pm10: 238, no2: 68,  delta: -8,  source: "Construction Dust", confidence: 94, lat: 28.6695, lng: 77.0307 },
  { name: "Wazirpur",     zone: "North West", aqi: 254, pm25: 152, pm10: 219, no2: 61,  delta: +3,  source: "Industrial",        confidence: 83, lat: 28.7241, lng: 77.1635 },
  { name: "Jahangirpuri", zone: "North",      aqi: 241, pm25: 148, pm10: 208, no2: 54,  delta: +19, source: "Open Burning",      confidence: 78, lat: 28.7381, lng: 77.1673 },
];

function aqiColor(aqi: number) {
  if (aqi <= 50)  return "#55A84F";
  if (aqi <= 100) return "#A3C853";
  if (aqi <= 200) return "#FFC000";
  if (aqi <= 300) return "#F29C33";
  if (aqi <= 400) return "#E93F33";
  return "#AF2D24";
}

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 5)  return <TrendingUp  size={11} color="#DC2626" />;
  if (delta < -5) return <TrendingDown size={11} color="#16A34A" />;
  return <Minus size={11} color="#9CA3AF" />;
}

interface Props {
  onSelect?: (incident: IncidentData) => void;
  limit?:    number;
}

export const WorstWardsTable: React.FC<Props> = ({ onSelect, limit }) => {
  const rows = limit ? WARDS.slice(0, limit) : WARDS;
  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      <table style={{ borderCollapse: "collapse", tableLayout: "fixed", width: "100%" }}>
        {/* Fixed column widths that sum to fit inside 280px card (252px usable after padding) */}
        {/* Ward — takes remaining */}
        <colgroup>
          <col style={{ width: "28px" }} />
          <col />
          <col style={{ width: "42px" }} />
          <col style={{ width: "46px" }} />
          <col style={{ width: "82px" }} />
        </colgroup>
        <thead>
          <tr style={{ background: "var(--surface-alt)", borderBottom: "1px solid var(--border-faint)" }}>
            {["#", "Ward", "AQI", "Trend", "Source"].map(h => (
              <th key={h} style={{
                padding: h === "#" ? "7px 4px 7px 12px" : "7px 6px",
                fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "var(--text-muted)",
                textAlign: h === "AQI" || h === "Trend" ? "center" : "left",
                overflow: "hidden",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((w, i) => {
            const src     = SOURCE_STYLE[w.source];
            const isWorst = i === 0;

            return (
              <tr
                key={w.name}
                onClick={() => onSelect?.({
                  ward: w.name, zone: w.zone, aqi: w.aqi,
                  pm25: w.pm25, pm10: w.pm10, no2: w.no2,
                  source: w.source, confidence: w.confidence,
                  delta: w.delta, lat: w.lat, lng: w.lng,
                })}
                style={{
                  borderBottom: "1px solid rgba(13,27,42,0.04)",
                  borderLeft:   isWorst ? "3px solid #DC2626" : "3px solid transparent",
                  cursor:       onSelect ? "pointer" : "default",
                  background:   isWorst ? "rgba(220,38,38,0.025)" : "var(--surface)",
                  transition:   "background 0.13s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-alt)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isWorst ? "rgba(220,38,38,0.025)" : "var(--surface)"; }}
              >
                {/* # */}
                <td style={{ padding: "8px 4px 8px 12px" }}>
                  {isWorst
                    ? <AlertTriangle size={12} color="#DC2626" />
                    : <span style={{ fontSize: "10px", fontWeight: 600, color: "#CBD5E0", fontFamily: "var(--font-mono)" }}>{i + 1}</span>
                  }
                </td>

                {/* Ward */}
                <td style={{ padding: "8px 6px", overflow: "hidden" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {w.name}
                  </div>
                  <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "1px" }}>{w.zone}</div>
                </td>

                {/* AQI */}
                <td style={{ padding: "8px 4px", textAlign: "center" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "13px", color: aqiColor(w.aqi) }}>
                    {w.aqi}
                  </span>
                </td>

                {/* Trend */}
                <td style={{ padding: "8px 4px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                    <TrendIcon delta={w.delta} />
                    <span style={{
                      fontSize: "9px", fontFamily: "var(--font-mono)", fontWeight: 600,
                      color: w.delta > 5 ? "#DC2626" : w.delta < -5 ? "#16A34A" : "#9CA3AF",
                    }}>
                      {w.delta > 0 ? `+${w.delta}` : w.delta}
                    </span>
                  </div>
                </td>

                {/* Source — abbreviated label, no overflow */}
                <td style={{ padding: "8px 8px 8px 4px" }}>
                  <span style={{
                    display: "inline-block", maxWidth: "100%",
                    background: src.bg, color: src.text,
                    border: `1px solid ${src.border}`,
                    borderRadius: "5px", padding: "2px 5px",
                    fontSize: "8.5px", fontWeight: 700,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {SOURCE_SHORT[w.source]}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
