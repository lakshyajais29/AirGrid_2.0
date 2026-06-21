import React from "react";

export const LiveFlightCounter: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-semibold mb-2 text-navy">Live Flights</h2>
    <p className="text-4xl font-mono font-bold" style={{ color: "var(--mid-blue)" }}>
      142
    </p>
    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
      Aircraft in Delhi FIR
    </p>
  </div>
);
