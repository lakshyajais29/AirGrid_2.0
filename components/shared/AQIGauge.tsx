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
          r={radius}
          stroke="var(--light-bg)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--accent-teal)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="text-lg font-bold font-mono"
          fill="var(--text-primary)"
        >
          {display}
        </text>
      </svg>
      <span className="text-xs mt-1 text-muted">{getAQICategory(display)}</span>
    </div>
  );
};

export { AQIGauge };
