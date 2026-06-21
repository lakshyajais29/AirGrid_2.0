import { NextResponse } from 'next/server';
import { Weather } from '../weather/current/route';
import { IGI_COORDS, DEFAULT_Q } from '@/lib/emission-constants';

/**
 * Simple Gaussian plume model (ground level) for a 30x30 km grid centred on IGI Airport.
 * Parameters:
 *   stability - Pasquill stability class (A‑F). Currently only 'D' is implemented; others map to D.
 *   Q - emission rate in g/s (default 500).
 */
export type PlumePoint = {
  lat: number;
  lng: number;
  concentration: number; // µg/m³ (approx)
};

// Pasquill D coefficients (km)
function dispersionCoeffs(x: number) {
  // x is downwind distance in km
  const sy = 0.22 * x * Math.pow(1 + 0.0001 * x, -0.5);
  const sz = 0.16 * x * Math.pow(1 + 0.0001 * x, -0.5);
  return { sy, sz };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const stability = url.searchParams.get('stability')?.toUpperCase() ?? 'D';
  const Q = Number(url.searchParams.get('Q')) || DEFAULT_Q;

  // Fetch weather for wind speed and direction
  const weatherRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/weather/current`);
  const weather: Weather = (await weatherRes.json()) as Weather;
  const U = weather.windSpeed; // m/s
  const windDirRad = (weather.windDirection * Math.PI) / 180;

  const gridSize = 30; // km
  const spacing = 1; // km per cell
  const half = (gridSize / 2) * spacing;
  const points: PlumePoint[] = [];

  // Convert km to degrees (approx 1 km ≈ 0.009 degrees latitude)
  const kmToDeg = 0.009;

  for (let i = -half; i <= half; i += spacing) {
    for (let j = -half; j <= half; j += spacing) {
      // Rotate coordinates to align with wind direction (x downwind, y crosswind)
      const x = i * Math.cos(windDirRad) + j * Math.sin(windDirRad);
      const y = -i * Math.sin(windDirRad) + j * Math.cos(windDirRad);
      if (x <= 0) continue; // upwind side yields negligible concentration
      const { sy, sz } = dispersionCoeffs(x);
      // Ground‑level concentration (simplified)
      const C = (Q) / (Math.PI * U * sy * sz) * Math.exp(-(y * y) / (2 * sy * sy));
      const lat = IGI_COORDS[0] + (i * kmToDeg);
      const lng = IGI_COORDS[1] + (j * kmToDeg);
      points.push({ lat, lng, concentration: C });
    }
  }

  return NextResponse.json({ grid: points }, { status: 200 });
}
