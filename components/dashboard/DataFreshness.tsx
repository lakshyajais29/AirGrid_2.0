import React from "react";

export const DataFreshness: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-semibold mb-4 text-navy">Data Freshness</h2>
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span>WAQI API</span>
        <span className="font-mono text-safe-green">Live</span>
      </div>
      <div className="flex justify-between">
        <span>OpenSky Network</span>
        <span className="font-mono text-safe-green">Live</span>
      </div>
      <div className="flex justify-between">
        <span>CPCB Sensors</span>
        <span className="font-mono text-safe-green">9/12 Online</span>
      </div>
      <div className="flex justify-between">
        <span>Weather Service</span>
        <span className="font-mono text-safe-green">Live</span>
      </div>
    </div>
  </div>
);
