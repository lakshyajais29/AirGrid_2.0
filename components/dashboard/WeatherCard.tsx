"use client";

import React, { useEffect, useState } from "react";
import type { Weather } from "@/app/api/weather/current/route";

const getCompassDirection = (deg: number) => {
  const val = Math.floor(deg / 45 + 0.5);
  const arr = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return arr[val % 8];
};

export const WeatherCard: React.FC = () => {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("/api/weather/current");
        if (res.ok) {
          const data = await res.json();
          setWeather(data);
        }
      } catch (err) {
        console.error("Failed to fetch weather data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  if (loading || !weather) {
    return (
      <div className="bg-navy/90 border border-accent-teal/30 p-6 rounded-xl flex items-center justify-center h-48 animate-pulse shadow-card">
        <span className="text-accent-teal font-mono text-sm">LOADING ATMOSPHERICS...</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-navy to-deep-blue border border-accent-teal/30 p-5 rounded-xl shadow-card text-white relative overflow-hidden backdrop-blur-md">
      {/* Background decoration */}
      <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.1325 20.177 10.2016 17.8687 10.0232C17.4338 6.62688 14.5367 4 11 4C7.13401 4 4 7.13401 4 11C4 11.238 4.01185 11.4732 4.03487 11.7049C1.77665 12.128 0 14.1132 0 16.5C0 19.5376 2.46243 22 5.5 22H17.5Z" />
        </svg>
      </div>

      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="section-label !text-accent-teal !mb-0 !text-[9px]">Atmospheric Conditions</div>
        <div className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${weather.isLive ? 'bg-safe-green/20 text-safe-green border border-safe-green/30' : 'bg-gov-gold/20 text-gov-gold border border-gov-gold/30'}`}>
          {weather.isLive ? "LIVE" : "MOCK"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div>
          <div className="text-xs text-muted mb-1 font-mono uppercase tracking-widest">Temperature</div>
          <div className="text-2xl font-bold text-white font-mono">{weather.temperature}<span className="text-sm text-accent-teal ml-1">°C</span></div>
        </div>
        <div>
          <div className="text-xs text-muted mb-1 font-mono uppercase tracking-widest">Humidity</div>
          <div className="text-2xl font-bold text-white font-mono">{weather.humidity}<span className="text-sm text-accent-teal ml-1">%</span></div>
        </div>
        <div>
          <div className="text-xs text-muted mb-1 font-mono uppercase tracking-widest">Wind</div>
          <div className="text-lg font-bold text-white font-mono">{weather.windSpeed} <span className="text-xs text-accent-teal font-sans font-normal uppercase">m/s</span> <span className="text-sm ml-1 text-white">{getCompassDirection(weather.windDirection)}</span></div>
        </div>
        <div>
          <div className="text-xs text-muted mb-1 font-mono uppercase tracking-widest">Visibility</div>
          <div className="text-lg font-bold text-white font-mono">{(weather.visibility / 1000).toFixed(1)} <span className="text-xs text-accent-teal font-sans font-normal uppercase">km</span></div>
        </div>
      </div>
    </div>
  );
};
