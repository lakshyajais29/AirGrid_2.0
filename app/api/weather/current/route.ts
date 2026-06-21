import { NextResponse } from 'next/server';

/**
 * Fetch current weather from OpenWeatherMap or return static mock data.
 * Expected query parameters are none – coordinates are fixed for IGI Airport.
 */
export type Weather = {
  windSpeed: number; // m/s
  windDirection: number; // degrees
  temperature: number; // Celsius
  humidity: number; // %
  visibility: number; // meters
  stability: string; // Pasquill stability class (default 'D')
};

const MOCK_WEATHER: Weather = {
  windSpeed: 3.2,
  windDirection: 225,
  temperature: 32,
  humidity: 45,
  visibility: 8000,
  stability: 'D',
};

export async function GET() {
  const apiKey = process.env.OWM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(MOCK_WEATHER, { status: 200 });
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=28.5561&lon=77.1000&units=metric&appid=${apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch OWM');
    const data = await res.json();
    const weather: Weather = {
      windSpeed: data.wind?.speed ?? MOCK_WEATHER.windSpeed,
      windDirection: data.wind?.deg ?? MOCK_WEATHER.windDirection,
      temperature: data.main?.temp ?? MOCK_WEATHER.temperature,
      humidity: data.main?.humidity ?? MOCK_WEATHER.humidity,
      visibility: data.visibility ?? MOCK_WEATHER.visibility,
      stability: 'D', // default stability for now
    };
    return NextResponse.json(weather, { status: 200 });
  } catch (e) {
    // On any error fall back to mock
    return NextResponse.json(MOCK_WEATHER, { status: 200 });
  }
}
