"use client";

import React, { useEffect, useState } from "react";

interface AQIGaugeProps {
  value: number;
  size?: number;
  color?: string;
}

const getAQICategory = (value: number): string => {
  if (value <= 50) return "Good";
  if (value <= 100) return "Satisfactory";
  if (value <= 200) return "Moderate";
  if (value <= 300) return "Poor";
  if (value <= 400) return "Very Poor";
  return "Severe";
};

function aqiColor(aqi: number) {
  if (aqi <= 50)  return "#55A84F";
  if (aqi <= 100) return "#A3C853";
  if (aqi <= 200) return "#FFF833";
  if (aqi <= 300) return "#F29C33";
  if (aqi <= 400) return "#E93F33";
  return "#AF2D24";
}

const AQIGauge: React.FC<AQIGaugeProps> = ({ value, size = 80 }) => {
  const [display, setDisplay] = useState(0);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (display / 500) * circumference;

  useEffect(() => {
    const start = performance.now();
    const duration = 1000;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(value * progress));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius + 6}
          stroke="var(--border-faint)"
          strokeWidth={1}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border-faint)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={aqiColor(display)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <text
          x="50%"
          y="46%"
          dominantBaseline="middle"
          textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 800, fill: aqiColor(display) }}
        >
          {display}
        </text>
        <text
          x="50%"
          y="63%"
          dominantBaseline="middle"
          textAnchor="middle"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, fill: 'var(--text-muted)', letterSpacing: '0.08em' }}
        >
          AQI
        </text>
      </svg>
      <span style={{ fontSize: '11px', marginTop: '8px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {getAQICategory(display)}
      </span>
    </div>
  );
};

export { AQIGauge };
