// Pollution source prediction engine for drone sensor data
// Re-written to match exact Python training logic (aqi_sensor_log_100000.xlsx)
// Approach: explicit scoring based on ML rules, with softmax normalization → top-3 probabilities

export interface SensorInput {
  mq135: number
  mq9: number
  mq2: number
  temperature: number
  humidity: number
  pm25: number
  pm10: number
  altitude: number
}

export interface SourcePrediction {
  id: string
  name: string
  icon: string
  color: string
  mapColor: string       // for map overlay rendering
  sourceRadius: number   // estimated influence radius in meters
  confidence: number     // 0–100
  explanation: string
}

export type Severity = 'Low' | 'Moderate' | 'High' | 'Critical'

export interface PollutionAnalysis {
  top3: SourcePrediction[]
  severity: Severity
  severityColor: string
  summary: string
  alerts: Alert[]
  limitedData: boolean
}

export interface Alert {
  level: 'warn' | 'critical'
  message: string
}

// ─── Softmax ──────────────────────────────────────────────────────────────────
function softmax(scores: number[], t = 1.8): number[] {
  const exps = scores.map(s => Math.exp(Math.max(-30, Math.min(30, s / t))))
  const sum  = exps.reduce((a, b) => a + b, 0) || 1
  return exps.map(e => e / sum)
}

// ─── Source definitions ───────────────────────────────────────────────────────

type ScorerFn = (s: SensorInput) => number

interface SourceDef {
  id: string
  name: string
  icon: string
  color: string
  mapColor: string
  sourceRadius: number
  scorer: ScorerFn
  explainer: (s: SensorInput) => string
}

const SOURCES: SourceDef[] = [
  {
    id: 'clean_air',
    name: 'Clean Air',
    icon: '🍃',
    color: '#00C851',
    mapColor: 'rgba(0,200,81,0.18)',
    sourceRadius: 50,
    scorer: (s) => {
      let score = 0;
      if (s.pm25 < 80) score += 3;
      if (s.pm10 < 120) score += 2;
      if (s.mq2 < 100) score += 2;
      if (s.mq9 < 80) score += 2;
      if (s.mq135 < 220) score += 1;
      return score;
    },
    explainer: () => "All sensor readings are within safe limits. No significant pollution source detected.",
  },
  {
    id: 'traffic',
    name: 'Vehicle / Traffic Exhaust',
    icon: '🚗',
    color: '#E74C3C',
    mapColor: 'rgba(231,76,60,0.18)',
    sourceRadius: 120,
    scorer: (s) => {
      let score = 0;
      if (s.mq9 > 180) score += 3;
      if (s.mq135 > 300) score += 3;
      if (s.pm25 > 80 && s.pm25 < 280) score += 2;
      if (s.mq2 < 300) score += 1;
      if (s.altitude < 45) score += 2;
      return score;
    },
    explainer: () => "Elevated carbon monoxide and NOx detected. Sensor pattern consistent with combustion engine exhaust.",
  },
  {
    id: 'burning',
    name: 'Waste / Open Burning',
    icon: '🔥',
    color: '#E67E22',
    mapColor: 'rgba(230,126,34,0.18)',
    sourceRadius: 200,
    scorer: (s) => {
      let score = 0;
      if (s.mq2 > 300) score += 4;
      if (s.pm25 > 250) score += 3;
      if (s.humidity < 55) score += 2;
      if (s.mq9 > 180) score += 2;
      return score;
    },
    explainer: () => "Smoke concentration is significantly elevated. High carbon monoxide and dense fine particulate matter observed.",
  },
  {
    id: 'construction',
    name: 'Construction / Road Dust',
    icon: '🏗️',
    color: '#D4AC0D',
    mapColor: 'rgba(212,172,13,0.18)',
    sourceRadius: 150,
    scorer: (s) => {
      let score = 0;
      const ratio = s.pm10 / (s.pm25 + 1);
      const pm_diff = s.pm10 - s.pm25;
      if (ratio > 2.0) score += 4;
      if (pm_diff > 150) score += 3;
      if (s.pm10 > 350) score += 2;
      if (s.mq2 < 200) score += 2;
      if (s.mq9 < 180) score += 1;
      return score;
    },
    explainer: () => "Coarse particulate matter (PM10) is exceptionally high. Low carbon monoxide confirms non-burning source.",
  },
  {
    id: 'industrial',
    name: 'Industrial Emission',
    icon: '🏭',
    color: '#8E44AD',
    mapColor: 'rgba(142,68,173,0.18)',
    sourceRadius: 500,
    scorer: (s) => {
      let score = 0;
      if (s.mq135 > 500) score += 4;
      if (s.pm25 > 180) score += 3;
      if (s.mq2 > 200) score += 2;
      if (s.mq9 > 150) score += 1;
      return score;
    },
    explainer: () => "Elevated NOx and NH3 levels detected by MQ135. Combined gas and particle signature indicates industrial source.",
  },
  {
    id: 'agri_burning',
    name: 'Agricultural / Crop Burning',
    icon: '🌾',
    color: '#1E8449',
    mapColor: 'rgba(30,132,73,0.18)',
    sourceRadius: 400,
    scorer: (s) => {
      let score = 0;
      if (s.mq2 > 250) score += 3;
      if (s.pm25 > 200) score += 2;
      if (s.humidity > 60) score += 3;
      if (s.mq9 > 120) score += 2;
      return score;
    },
    explainer: () => "Significant smoke concentration from organic material detected. Particulate matter pattern matches field burning.",
  },
  {
    id: 'mixed',
    name: 'Mixed Pollution',
    icon: '🌫️',
    color: '#607D8B',
    mapColor: 'rgba(96,125,139,0.18)',
    sourceRadius: 200,
    scorer: () => 4.5, // Base threshold: if no other source hits 5, this wins!
    explainer: () => "Multiple pollution indicators elevated simultaneously or signals are unclear. Possible overlap of sources.",
  }
]

// ─── Severity ─────────────────────────────────────────────────────────────────

export function getSeverityMeta(aqi: number): { severity: Severity; color: string } {
  if (aqi <= 50)  return { severity: 'Low',      color: '#00C851' }
  if (aqi <= 100) return { severity: 'Moderate',  color: '#FFD700' }
  if (aqi <= 200) return { severity: 'High',      color: '#FF8C00' }
  return               { severity: 'Critical',  color: '#FF4444' }
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

function buildAlerts(s: SensorInput, aqi: number): Alert[] {
  const out: Alert[] = []
  if (aqi > 300)       out.push({ level: 'critical', message: `AQI ${aqi} — Hazardous conditions. Immediate review recommended.` })
  else if (aqi > 200)  out.push({ level: 'warn',     message: `AQI ${aqi} — Very poor air quality detected.` })
  if (s.mq9 > 450)     out.push({ level: 'critical', message: `High CO (MQ-9: ${s.mq9}) — Strong exhaust or combustion nearby.` })
  else if (s.mq9 > 300) out.push({ level: 'warn',    message: `Elevated CO (MQ-9: ${s.mq9}) — Vehicle traffic or gas source.` })
  if (s.mq2 > 500)     out.push({ level: 'critical', message: `Heavy smoke (MQ-2: ${s.mq2}) — Active burning detected.` })
  else if (s.mq2 > 350) out.push({ level: 'warn',    message: `Smoke present (MQ-2: ${s.mq2}) — Burning activity in area.` })
  if (s.mq135 > 420)   out.push({ level: 'critical', message: `Very high mixed pollutants (MQ-135: ${s.mq135}) — Multi-source contamination.` })
  if (s.temperature > 38) out.push({ level: 'warn',  message: `High temp (${s.temperature.toFixed(1)}°C) — Enhanced photochemical smog risk.` })
  if (s.humidity < 25) out.push({ level: 'warn',     message: `Low humidity (${s.humidity.toFixed(0)}%) — Elevated dust suspension.` })
  return out
}

// ─── Summary text ─────────────────────────────────────────────────────────────

function buildSummary(top3: SourcePrediction[], aqi: number, s: SensorInput): string {
  const [p1, p2] = top3
  const { severity } = getSeverityMeta(aqi)
  return (
    `${severity} air quality detected (AQI ${aqi}). ` +
    `The most probable pollution source is ${p1.name} (${p1.confidence.toFixed(0)}% confidence), ` +
    `with ${p2.name} as a secondary contributor (${p2.confidence.toFixed(0)}%). ` +
    `MQ-135: ${s.mq135} · MQ-9: ${s.mq9} · MQ-2: ${s.mq2} · ` +
    `${s.temperature.toFixed(1)}°C · ${s.humidity.toFixed(0)}% RH.`
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function analyzePollution(sensors: SensorInput, aqi: number): PollutionAnalysis {
  const rawScores = SOURCES.map(src => src.scorer(sensors))
  
  // If the max score is below 5, we give "Mixed Pollution" a huge boost so it confidently wins
  const maxScore = Math.max(...rawScores.slice(0, 6)); // Ignore the last one (Mixed)
  if (maxScore < 5) {
      rawScores[6] += 5; // Boost mixed
  }

  const probs = softmax(rawScores, 1.2) // t=1.2 to slightly sharpen the distribution

  const predictions: SourcePrediction[] = SOURCES
    .map((src, i) => ({
      id:           src.id,
      name:         src.name,
      icon:         src.icon,
      color:        src.color,
      mapColor:     src.mapColor,
      sourceRadius: src.sourceRadius,
      confidence:   probs[i] * 100,
      explanation:  src.explainer(sensors),
    }))
    .sort((a, b) => b.confidence - a.confidence)

  const top3 = predictions.slice(0, 3)
  const { severity, color: severityColor } = getSeverityMeta(aqi)

  return {
    top3,
    severity,
    severityColor,
    summary:     buildSummary(top3, aqi, sensors),
    alerts:      buildAlerts(sensors, aqi),
    limitedData: false,
  }
}
