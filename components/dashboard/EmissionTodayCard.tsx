import React from "react";

export const EmissionTodayCard: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-semibold mb-2 text-navy">Emissions Today</h2>
    <p className="text-3xl font-mono font-bold" style={{ color: "var(--critical-red)" }}>
      4.8 <span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>tonnes CO₂</span>
    </p>
    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
      Aviation emissions over Delhi NCR
    </p>
  </div>
);
