import React from "react";

interface Alert {
  id: number;
  ward: string;
  pollutant: string;
  value: number;
  threshold: number;
  time: string;
}

const mockAlerts: Alert[] = [
  { id: 1, ward: "Mahipalpur", pollutant: "PM2.5", value: 245, threshold: 200, time: "14:30" },
  { id: 2, ward: "Vasant Kunj", pollutant: "NO2", value: 189, threshold: 180, time: "15:15" },
];

export const AlertCommandStrip: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-4 overflow-x-auto whitespace-nowrap">
      <h2 className="text-lg font-semibold mb-2 text-navy">Active Alerts</h2>
      <div className="flex space-x-4">
        {mockAlerts.map((a) => (
          <div key={a.id} className="flex items-center bg-critical-red/10 text-critical-red px-3 py-1 rounded">
            <span className="font-medium">{a.ward} Ward</span>
            <span className="mx-2">|</span>
            <span>{a.pollutant}: {a.value}µg/m³ ({'>'}{a.threshold})</span>
            <span className="ml-2 text-xs">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
