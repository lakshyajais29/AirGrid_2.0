import React from "react";

const WARDS = [
  { name: "Anand Vihar", zone: "East", aqi: 312, pm25: 198 },
  { name: "Bawana", zone: "North", aqi: 287, pm25: 176 },
  { name: "Mundka", zone: "West", aqi: 268, pm25: 164 },
  { name: "Wazirpur", zone: "North West", aqi: 254, pm25: 152 },
  { name: "Jahangirpuri", zone: "North", aqi: 241, pm25: 148 },
];

export const WorstWardsTable: React.FC = () => (
  <div className="panel-card p-6" style={{ borderTop: '3px solid var(--accent-teal)' }}>
    <div className="section-label">Critical Zones</div>
    <h2 className="text-xl font-semibold mb-4 text-navy">Worst 5 Wards</h2>
    <table className="w-full text-sm">
      <thead>
        <tr style={{ background: 'linear-gradient(90deg, #0D1B2A, #1A3A5C)', color: 'white' }}>
          <th className="text-left py-2 px-3 font-semibold rounded-tl-md">Ward</th>
          <th className="text-left py-2 px-3 font-semibold">Zone</th>
          <th className="text-right py-2 px-3 font-semibold">AQI</th>
          <th className="text-right py-2 px-3 font-semibold rounded-tr-md">PM2.5</th>
        </tr>
      </thead>
      <tbody>
        {WARDS.map((w, i) => (
          <tr key={w.name} className={i % 2 === 0 ? "bg-white" : "bg-[#f8faff]"} style={{ borderBottom: "1px solid #F1F5F9", borderLeft: i === 0 ? '4px solid var(--accent-teal)' : '4px solid transparent' }}>
            <td className="py-2 px-3 font-medium" style={{ color: "var(--navy)" }}>{w.name}</td>
            <td className="py-2 px-3" style={{ color: "var(--text-muted)" }}>{w.zone}</td>
            <td className="py-2 px-3 text-right">
              <div className="inline-block text-center font-mono font-semibold" style={{ color: "var(--critical-red)", backgroundColor: "rgba(192,57,43,0.1)", borderRadius: '20px', minWidth: '48px', padding: '2px 8px' }}>{w.aqi}</div>
            </td>
            <td className="py-2 px-3 text-right font-mono" style={{ color: "var(--text-primary)" }}>{w.pm25}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
