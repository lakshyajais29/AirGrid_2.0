"use client";

import { useEffect, useState } from "react";
import { Alert } from "../api/alerts/route";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Utility: Determine GRAP level from the highest AQI value among active alerts
// ---------------------------------------------------------------------------
function getGRAPLevel(alerts: Alert[]) {
  if (alerts.length === 0) return { level: 0, bg: "#16A34A", actions: [] as string[] };
  const maxAQI = Math.max(...alerts.map((a) => a.currentValue));
  if (maxAQI > 450)  return { level: 4, bg: "#7F1D1D", actions: ["Declare state of emergency", "Evacuate vulnerable populations", "Mobilise state resources"] };
  if (maxAQI > 400)  return { level: 3, bg: "#DC2626", actions: ["Close schools", "Issue health warnings", "Deploy air purifiers in critical areas"] };
  if (maxAQI > 300)  return { level: 2, bg: "#EA580C", actions: ["Activate emergency response", "Deploy mobile monitoring units", "Restrict outdoor activities"] };
  if (maxAQI >= 201) return { level: 1, bg: "#D97706", actions: ["Issue public advisory", "Increase monitoring frequency", "Notify ward officers"] };
  return { level: 0, bg: "#16A34A", actions: [] as string[] };
}

// ---------------------------------------------------------------------------
// GRAP Status Banner – Full‑width top section
// ---------------------------------------------------------------------------
function GRAPStatusBanner({ alerts }: { alerts: Alert[] }) {
  const { level, bg, actions } = getGRAPLevel(alerts);
  return (
    <div style={{ background: bg, color: "#fff", padding: "16px 24px", borderRadius: "10px", marginBottom: "4px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: level > 0 ? "8px" : 0 }}>
        {level === 0 ? "✅ Air Quality Within Limits · No Active GRAP Stage" : `⚠️ GRAP Stage ${level} Active`}
      </h2>
      {level > 0 && (
        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", lineHeight: "1.8" }}>
          {actions.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active Alerts Panel – Cards for each alert
// ---------------------------------------------------------------------------
function severityBadge(sev: Alert["severity"]) {
  const map = {
    Critical: "bg-red-600 text-white",
    High: "bg-orange-500 text-white",
    Medium: "bg-yellow-400 text-black",
  } as const;
  return <Badge className={map[sev]}>{sev}</Badge>;
}

function ActiveAlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <section className="mt-6">
      <h3 className="text-xl font-medium mb-4">Active Alerts</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alerts.map((a) => (
          <div
            key={a.id}
            className="border rounded-lg p-4 flex flex-col justify-between shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              {severityBadge(a.severity)}
              <span className="font-medium text-sm">{a.ward}</span>
            </div>
            <p className="text-sm">
              <strong>{a.pollutant}</strong>: {a.currentValue}{a.unit} (threshold:{" "}{a.threshold}{a.unit})
            </p>
            <p className="text-xs text-muted-foreground mt-1">Active for {a.duration}</p>
            <p className="text-xs mt-1">Officer: {a.assignedOfficer}</p>
            <div className="mt-3 flex space-x-2">
              <Button variant="outline" size="sm">
                Acknowledge
              </Button>
              <Button variant="destructive" size="sm">
                Escalate
              </Button>
              <Button variant="secondary" size="sm">
                View Data
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Alert Rule Builder – Simple form on the left side
// ---------------------------------------------------------------------------
function AlertRuleBuilder() {
  const wards = [
    "Anand Vihar",
    "Saket",
    "Laxmi Nagar",
    "Dwarka",
    "Rohini",
    "Karol Bagh",
    "Connaught Place",
    "Patel Nagar",
    "Janakpuri",
    "Mayur Vihar",
    "Gandhi Nagar",
    "South Delhi",
  ];
  const pollutants = ["PM2.5", "PM10", "NO₂", "SO₂", "O₃", "CO"];
  const operators = [">", ">="];
  const channels = ["Dashboard", "Email", "SMS"];

  const [ward, setWard] = useState(wards[0]);
  const [pollutant, setPollutant] = useState(pollutants[0]);
  const [operator, setOperator] = useState(operators[0]);
  const [threshold, setThreshold] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleSave = () => {
    // Placeholder – in a real app this would POST to an endpoint.
    alert(`Rule saved for ${ward} – ${pollutant} ${operator} ${threshold}\nChannels: ${selectedChannels.join(", ")}`);
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-medium mb-4">Create Alert Rule</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Ward</label>
          <Select value={ward} onValueChange={setWard}>
            <SelectTrigger>
              <SelectValue placeholder="Select ward" />
            </SelectTrigger>
            <SelectContent>
              {wards.map((w) => (
                <SelectItem key={w} value={w}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Pollutant</label>
          <Select value={pollutant} onValueChange={setPollutant}>
            <SelectTrigger>
              <SelectValue placeholder="Select pollutant" />
            </SelectTrigger>
            <SelectContent>
              {pollutants.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2 items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Operator</label>
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger>
                <SelectValue placeholder="Operator" />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op} value={op}>
                    {op}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Threshold</label>
            <Input
              type="number"
              placeholder="e.g. 150"
              value={threshold}
              onChange={(e: any) => setThreshold(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Channels</label>
          <div className="flex space-x-4">
            {channels.map((ch) => (
              <label key={ch} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedChannels.includes(ch)}
                  onCheckedChange={() => toggleChannel(ch)}
                />
                <span className="text-sm">{ch}</span>
              </label>
            ))}
          </div>
        </div>
        <Button onClick={handleSave}>Save Rule</Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Alert History Table – Right side (mock data for past 7 days)
// ---------------------------------------------------------------------------
type HistoryRow = {
  date: string;
  ward: string;
  pollutant: string;
  peakValue: number;
  duration: string;
  status: string;
};

const mockHistory: HistoryRow[] = [
  {
    date: "2026-06-20",
    ward: "Anand Vihar",
    pollutant: "PM2.5",
    peakValue: 310,
    duration: "2h 10m",
    status: "Resolved",
  },
  {
    date: "2026-06-19",
    ward: "Saket",
    pollutant: "NO₂",
    peakValue: 92,
    duration: "1h 45m",
    status: "Resolved",
  },
  {
    date: "2026-06-18",
    ward: "Dwarka",
    pollutant: "PM10",
    peakValue: 340,
    duration: "3h",
    status: "Resolved",
  },
];

function AlertHistoryTable() {
  const [filterSeverity, setFilterSeverity] = useState<string>("");
  const [filterWard, setFilterWard] = useState<string>("");

  const downloadCSV = () => {
    const header = ["Date", "Ward", "Pollutant", "Peak Value", "Duration", "Status"].join(",");
    const rows = mockHistory
      .map((r) => `${r.date},${r.ward},${r.pollutant},${r.peakValue},${r.duration},${r.status}`)
      .join("\n");
    const csvContent = `${header}\n${rows}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "alert_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simple filter – not fully implemented for brevity
  const filtered = mockHistory.filter((row) => {
    if (filterSeverity && row.status !== filterSeverity) return false;
    if (filterWard && row.ward !== filterWard) return false;
    // dateRange filter omitted for brevity
    return true;
  });

  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">Alert History (7 Days)</h3>
        <Button size="sm" onClick={downloadCSV}>
          Export CSV
        </Button>
      </div>
      {/* Filters */}
      <div className="flex space-x-4 mb-3">
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterWard} onValueChange={setFilterWard}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Ward" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            {/* Re‑use wards list */}
            {[
              "Anand Vihar",
              "Saket",
              "Laxmi Nagar",
              "Dwarka",
              "Rohini",
              "Karol Bagh",
              "Connaught Place",
              "Patel Nagar",
              "Janakpuri",
              "Mayur Vihar",
              "Gandhi Nagar",
              "South Delhi",
            ].map((w) => (
              <SelectItem key={w} value={w}>
                {w}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Date range picker could be added here */}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Ward</th>
              <th className="p-2 text-left">Pollutant</th>
              <th className="p-2 text-left">Peak Value</th>
              <th className="p-2 text-left">Duration</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="p-2">{row.date}</td>
                <td className="p-2">{row.ward}</td>
                <td className="p-2">{row.pollutant}</td>
                <td className="p-2">{row.peakValue}</td>
                <td className="p-2">{row.duration}</td>
                <td className="p-2">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Alerts Page Component
// ---------------------------------------------------------------------------
const SEED_ALERTS: Alert[] = [
  { id: "alert-1", ward: "Anand Vihar", pollutant: "PM2.5", currentValue: 285, threshold: 150, unit: "µg/m³", severity: "Critical", duration: "2h 15m", assignedOfficer: "Rajesh Kumar",  status: "Active", triggeredAt: new Date(Date.now() - 2 * 3600_000).toISOString() },
  { id: "alert-2", ward: "Saket",       pollutant: "NO₂",   currentValue: 85,  threshold: 60,  unit: "ppb",    severity: "High",     duration: "1h 40m", assignedOfficer: "Neha Sharma",   status: "Active", triggeredAt: new Date(Date.now() - 1.5 * 3600_000).toISOString() },
  { id: "alert-3", ward: "Laxmi Nagar", pollutant: "SO₂",   currentValue: 55,  threshold: 50,  unit: "ppb",    severity: "Medium",   duration: "45m",    assignedOfficer: "Amit Singh",    status: "Active", triggeredAt: new Date(Date.now() - 45 * 60_000).toISOString() },
  { id: "alert-4", ward: "Dwarka",      pollutant: "PM10",  currentValue: 320, threshold: 200, unit: "µg/m³", severity: "Critical", duration: "3h 10m", assignedOfficer: "Sunita Verma",  status: "Active", triggeredAt: new Date(Date.now() - 3 * 3600_000).toISOString() },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(SEED_ALERTS);
  const [loading] = useState(false);

  useEffect(() => {
    fetch("/api/alerts")
      .then((res) => res.json())
      .then((data) => { if (data.alerts?.length) setAlerts(data.alerts); })
      .catch(() => {});
  }, []);

  return (
    <main className="p-6 space-y-6">
      {/* 1️⃣ GRAP status banner */}
      <GRAPStatusBanner alerts={alerts} />

      {/* 2️⃣ Active alerts panel */}
      {loading ? (
        <p>Loading alerts…</p>
      ) : (
        <ActiveAlertsPanel alerts={alerts} />
      )}

      {/* 3️⃣ Two‑column area */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <AlertRuleBuilder />
        <AlertHistoryTable />
      </section>
    </main>
  );
}
