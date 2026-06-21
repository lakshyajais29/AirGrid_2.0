"use client";

import React from "react";

interface Props {
  data: number[];
}

export const AQITrendSparkline: React.FC<Props> = ({ data }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 60;
  const w = 300;
  const step = w / (data.length - 1);

  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 10)}`)
    .join(" ");

  return (
    <div className="flex items-center gap-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: "80px" }}>
        <polyline
          points={points}
          fill="none"
          stroke="var(--mid-blue)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      <div className="text-right whitespace-nowrap">
        <p className="text-2xl font-mono font-bold" style={{ color: "var(--navy)" }}>
          {data[data.length - 1]}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Current AQI
        </p>
      </div>
    </div>
  );
};
