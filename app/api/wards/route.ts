import { NextResponse } from 'next/server';

/**
 * Mock data for Delhi zones (12 zones).
 */
export type Ward = {
  id: string;
  name: string;
  aqi: number; // Air Quality Index
  dominantPollutant: string;
  aviationExposureScore: number; // 1‑10
  population: number;
  trend: 'up' | 'down' | 'stable';
};

const zones: Ward[] = [
  { id: '1', name: 'North', aqi: 180, dominantPollutant: 'PM2.5', aviationExposureScore: 2, population: 250000, trend: 'up' },
  { id: '2', name: 'North-West', aqi: 150, dominantPollutant: 'PM10', aviationExposureScore: 2, population: 180000, trend: 'stable' },
  { id: '3', name: 'North-East', aqi: 170, dominantPollutant: 'NO2', aviationExposureScore: 3, population: 210000, trend: 'down' },
  { id: '4', name: 'West', aqi: 210, dominantPollutant: 'PM2.5', aviationExposureScore: 7, population: 300000, trend: 'up' },
  { id: '5', name: 'Central', aqi: 200, dominantPollutant: 'O3', aviationExposureScore: 6, population: 350000, trend: 'up' },
  { id: '6', name: 'New Delhi', aqi: 190, dominantPollutant: 'PM2.5', aviationExposureScore: 4, population: 400000, trend: 'stable' },
  { id: '7', name: 'East', aqi: 160, dominantPollutant: 'NO2', aviationExposureScore: 3, population: 270000, trend: 'down' },
  { id: '8', name: 'South-West', aqi: 230, dominantPollutant: 'PM2.5', aviationExposureScore: 9, population: 320000, trend: 'up' },
  { id: '9', name: 'South', aqi: 220, dominantPollutant: 'PM10', aviationExposureScore: 8, population: 340000, trend: 'up' },
  { id: '10', name: 'Shahdara', aqi: 175, dominantPollutant: 'NO2', aviationExposureScore: 3, population: 190000, trend: 'stable' },
  { id: '11', name: 'Outer', aqi: 140, dominantPollutant: 'PM2.5', aviationExposureScore: 2, population: 220000, trend: 'down' },
  { id: '12', name: 'Outer-North', aqi: 145, dominantPollutant: 'PM10', aviationExposureScore: 2, population: 200000, trend: 'stable' },
];

export async function GET() {
  return NextResponse.json({ zones }, { status: 200 });
}
