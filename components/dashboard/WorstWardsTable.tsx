import React from "react";

const WARDS = [
  { name: "Anand Vihar", zone: "East", aqi: 312, pm25: 198 },
  { name: "Bawana", zone: "North", aqi: 287, pm25: 176 },
  { name: "Mundka", zone: "West", aqi: 268, pm25: 164 },
  { name: "Wazirpur", zone: "North West", aqi: 254, pm25: 152 },
  { name: "Jahangirpuri", zone: "North", aqi: 241, pm25: 148 },
];

export const WorstWardsTable: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-semibold mb-4 text-navy">Worst 5 Wards</h2>
    <table className="w-full text-sm">
      <thead>
        <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
          <th className="text-left py-2 font-semibold" style={{ color: "var(--text-muted)" }}>Ward</th>
          <th className="text-left py-2 font-semibold" style={{ color: "var(--text-muted)" }}>Zone</th>
          <th className="text-right py-2 font-semibold" style={{ color: "var(--text-muted)" }}>AQI</th>
          <th className="text-right py-2 font-semibold" style={{ color: "var(--text-muted)" }}>PM2.5</th>
        </tr>
      </thead>
      <tbody>
        {WARDS.map((w) => (
          <tr key={w.name} style={{ borderBottom: "1px solid #F1F5F9" }}>
            <td className="py-2 font-medium" style={{ color: "var(--navy)" }}>{w.name}</td>
            <td className="py-2" style={{ color: "var(--text-muted)" }}>{w.zone}</td>
            <td className="py-2 text-right font-mono font-semibold" style={{ color: "var(--critical-red)" }}>{w.aqi}</td>
            <td className="py-2 text-right font-mono" style={{ color: "var(--text-primary)" }}>{w.pm25}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
