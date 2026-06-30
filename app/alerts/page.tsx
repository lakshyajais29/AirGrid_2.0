"use client";

import { useEffect, useState } from "react";
import { Alert } from "../api/alerts/route";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Siren,
  MapPin,
  Clock,
  User,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertOctagon,
  Download,
  Filter,
  Calendar,
  ChevronRight,
  ShieldAlert
} from "lucide-react";

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function getGRAPLevel(alerts: Alert[]) {
  if (alerts.length === 0) return { level: 0, bg: "bg-emerald-500", text: "text-white", border: "border-emerald-600", actions: [] as string[] };
  const maxAQI = Math.max(...alerts.map((a) => a.currentValue));
  if (maxAQI > 450)  return { level: 4, bg: "bg-red-950", text: "text-red-50", border: "border-red-900", actions: ["Declare state of emergency", "Evacuate vulnerable populations", "Mobilise state resources"] };
  if (maxAQI > 400)  return { level: 3, bg: "bg-red-700", text: "text-white", border: "border-red-800", actions: ["Close schools", "Issue health warnings", "Deploy air purifiers in critical areas"] };
  if (maxAQI > 300)  return { level: 2, bg: "bg-orange-600", text: "text-white", border: "border-orange-700", actions: ["Emergency Response", "Mobile Units Deployed", "Outdoor Restrictions"] };
  if (maxAQI >= 201) return { level: 1, bg: "bg-amber-500", text: "text-white", border: "border-amber-600", actions: ["Issue public advisory", "Increase monitoring frequency", "Notify ward officers"] };
  return { level: 0, bg: "bg-emerald-500", text: "text-white", border: "border-emerald-600", actions: [] as string[] };
}

// ---------------------------------------------------------------------------
// KPI Summary Cards
// ---------------------------------------------------------------------------
function KPISummary({ alerts }: { alerts: Alert[] }) {
  const critical = alerts.filter(a => a.severity === "Critical").length;
  const high = alerts.filter(a => a.severity === "High").length;
  const medium = alerts.filter(a => a.severity === "Medium").length;
  // Dummy resolved count
  const resolved = 12;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Critical Alerts</p>
          <h4 className="text-3xl font-semibold text-slate-900">{critical}</h4>
        </div>
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertOctagon className="h-6 w-6 text-red-600" />
        </div>
      </div>
      <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">High Alerts</p>
          <h4 className="text-3xl font-semibold text-slate-900">{high}</h4>
        </div>
        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
        </div>
      </div>
      <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Medium Alerts</p>
          <h4 className="text-3xl font-semibold text-slate-900">{medium}</h4>
        </div>
        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-amber-600" />
        </div>
      </div>
      <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Resolved Today</p>
          <h4 className="text-3xl font-semibold text-slate-900">{resolved}</h4>
        </div>
        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// GRAP Status Banner
// ---------------------------------------------------------------------------
function EmergencyStatusBanner({ alerts }: { alerts: Alert[] }) {
  const { level, bg, text, border, actions } = getGRAPLevel(alerts);
  
  if (level === 0) return null;

  return (
    <div className={`mb-8 flex flex-col md:flex-row items-start md:items-center justify-between ${bg} ${text} p-4 rounded-xl border ${border} shadow-sm gap-4`}>
      <div className="flex items-center space-x-3">
        <div className="bg-white/20 p-2 rounded-lg">
          <Siren className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">GRAP Stage {level} Active</h2>
          <p className="text-sm opacity-90">Emergency protocols are currently in effect across NCT Delhi.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((a, i) => (
          <span key={i} className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-xs font-medium whitespace-nowrap">
            <ShieldAlert className="h-3.5 w-3.5 mr-1.5 opacity-80" />
            {a}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active Alerts Panel
// ---------------------------------------------------------------------------
function severityStyles(sev: Alert["severity"]) {
  const map = {
    Critical: { badge: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200", card: "border-red-300 ring-1 ring-red-100", indicator: "bg-red-500" },
    High:     { badge: "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200", card: "border-orange-300 ring-1 ring-orange-50", indicator: "bg-orange-500" },
    Medium:   { badge: "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200", card: "border-amber-300 ring-1 ring-amber-50", indicator: "bg-amber-500" },
  } as const;
  return map[sev] || map["Medium"];
}

function ActiveAlertsPanel({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Active Alerts</h3>
        <Button variant="ghost" size="sm" className="text-slate-500">View All <ChevronRight className="h-4 w-4 ml-1"/></Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {alerts.map((a) => {
          const styles = severityStyles(a.severity);
          return (
            <div
              key={a.id}
              className={`bg-white rounded-xl p-5 shadow-sm flex flex-col justify-between ${styles.card} relative overflow-hidden transition-all hover:shadow-md`}
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${styles.indicator}`} />
              
              <div className="flex items-start justify-between mb-4 pl-3">
                <Badge variant="outline" className={`${styles.badge} font-semibold px-2.5 py-0.5`}>
                  {a.severity}
                </Badge>
                <div className="flex items-center text-slate-600 text-sm font-medium">
                  <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  {a.ward}
                </div>
              </div>
              
              <div className="pl-3 mb-5">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-slate-900 tracking-tight">{a.pollutant}</span>
                  <span className="text-2xl font-bold text-slate-700">{a.currentValue}<span className="text-lg font-medium text-slate-500 ml-0.5">{a.unit}</span></span>
                </div>
                <p className="text-sm text-slate-500 mt-1 font-medium">Threshold limit: {a.threshold}{a.unit}</p>
              </div>
              
              <div className="pl-3 grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center text-sm text-slate-600">
                  <Clock className="h-4 w-4 mr-2 text-slate-400" />
                  <span className="truncate">Active for {a.duration}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <User className="h-4 w-4 mr-2 text-slate-400" />
                  <span className="truncate" title={a.assignedOfficer}>{a.assignedOfficer}</span>
                </div>
              </div>
              
              <div className="pl-3 flex items-center space-x-3 mt-auto">
                <Button variant="outline" size="sm" className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-200">
                  Acknowledge
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-white hover:bg-red-50 text-red-600 border-red-200 hover:border-red-300">
                  Escalate
                </Button>
                <Button size="sm" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
                  Details
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Alert Rule Builder
// ---------------------------------------------------------------------------
function AlertRuleBuilder() {
  const wards = ["Anand Vihar", "Saket", "Laxmi Nagar", "Dwarka", "Rohini", "Karol Bagh", "Connaught Place", "Patel Nagar", "Janakpuri", "Mayur Vihar", "Gandhi Nagar", "South Delhi"];
  const pollutants = ["PM2.5", "PM10", "NO₂", "SO₂", "O₃", "CO"];
  const operators = [">", ">=", "<", "<="];
  const channels = ["Dashboard", "Email", "SMS", "Push"];

  const [ward, setWard] = useState(wards[0]);
  const [pollutant, setPollutant] = useState(pollutants[0]);
  const [operator, setOperator] = useState(operators[0]);
  const [threshold, setThreshold] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["Dashboard"]);

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleSave = () => {
    alert(`Rule saved for ${ward} – ${pollutant} ${operator} ${threshold}\nChannels: ${selectedChannels.join(", ")}`);
  };

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col h-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Create Alert Rule</h3>
        <p className="text-sm text-slate-500 mt-1">Configure automated notifications for specific areas.</p>
      </div>
      
      <div className="space-y-5 flex-grow">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Location</label>
            <Select value={ward} onValueChange={setWard}>
              <SelectTrigger className="w-full bg-slate-50">
                <SelectValue placeholder="Select ward" />
              </SelectTrigger>
              <SelectContent>
                {wards.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Pollutant</label>
            <Select value={pollutant} onValueChange={setPollutant}>
              <SelectTrigger className="w-full bg-slate-50">
                <SelectValue placeholder="Select pollutant" />
              </SelectTrigger>
              <SelectContent>
                {pollutants.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Condition</label>
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger className="w-full bg-slate-50">
                <SelectValue placeholder="Operator" />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => <SelectItem key={op} value={op}>{op}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Threshold</label>
            <Input
              type="number"
              placeholder="e.g. 150"
              value={threshold}
              onChange={(e: any) => setThreshold(e.target.value)}
              className="bg-slate-50"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-sm font-medium text-slate-700">Notification Channels</label>
          <div className="flex flex-wrap gap-2">
            {channels.map((ch) => {
              const isSelected = selectedChannels.includes(ch);
              return (
                <button
                  key={ch}
                  onClick={() => toggleChannel(ch)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    isSelected 
                      ? "bg-slate-900 text-white border-slate-900" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {ch}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-slate-100">
        <Button onClick={handleSave} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-medium px-8">
          Save Rule
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Alert History Table
// ---------------------------------------------------------------------------
type HistoryRow = {
  date: string;
  ward: string;
  pollutant: string;
  peakValue: number;
  duration: string;
  status: "Resolved" | "Active" | "Escalated";
};

const mockHistory: HistoryRow[] = [
  { date: "2026-06-20", ward: "Anand Vihar", pollutant: "PM2.5", peakValue: 310, duration: "2h 10m", status: "Resolved" },
  { date: "2026-06-19", ward: "Saket",       pollutant: "NO₂",   peakValue: 92,  duration: "1h 45m", status: "Resolved" },
  { date: "2026-06-18", ward: "Dwarka",      pollutant: "PM10",  peakValue: 340, duration: "3h",     status: "Escalated" },
  { date: "2026-06-18", ward: "Laxmi Nagar", pollutant: "SO₂",   peakValue: 65,  duration: "50m",    status: "Resolved" },
  { date: "2026-06-17", ward: "Rohini",      pollutant: "PM2.5", peakValue: 180, duration: "1h 15m", status: "Resolved" },
];

function statusBadge(status: string) {
  switch (status) {
    case "Resolved":  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Resolved</span>;
    case "Escalated": return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Escalated</span>;
    case "Active":    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Active</span>;
    default:          return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{status}</span>;
  }
}

function AlertHistoryTable() {
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");

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

  const filtered = mockHistory.filter((row) => {
    if (filterStatus && filterStatus !== "all" && row.status !== filterStatus) return false;
    if (search && !row.ward.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Alert History</h3>
          <p className="text-sm text-slate-500 mt-1">Past 7 days incident log.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="text-slate-600 bg-white border-slate-200">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button size="sm" onClick={downloadCSV} className="bg-slate-900 hover:bg-slate-800 text-white">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Search and Filters Bar */}
      <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by ward..." 
            className="pl-9 bg-white w-full border-slate-200" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px] bg-white border-slate-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Escalated">Escalated</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="bg-white border-slate-200 text-slate-500 shrink-0">
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto flex-grow">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Ward</th>
              <th className="px-6 py-4 font-medium">Pollutant</th>
              <th className="px-6 py-4 font-medium">Peak Value</th>
              <th className="px-6 py-4 font-medium">Duration</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">{row.date}</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{row.ward}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-semibold">{row.pollutant}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">{row.peakValue}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">{row.duration}</td>
                <td className="px-6 py-4 whitespace-nowrap">{statusBadge(row.status)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  No alerts found matching your criteria.
                </td>
              </tr>
            )}
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/alerts")
      .then((res) => res.json())
      .then((data) => { 
        if (data.alerts?.length) setAlerts(data.alerts); 
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
      
      {/* KPI Summary Cards */}
      <KPISummary alerts={alerts} />

      {/* GRAP status banner */}
      <EmergencyStatusBanner alerts={alerts} />

      {/* Active alerts panel */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 animate-pulse">Loading active alerts…</div>
      ) : (
        <ActiveAlertsPanel alerts={alerts} />
      )}

      {/* Bottom Section: Rule Builder & History */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AlertRuleBuilder />
        </div>
        <div className="lg:col-span-2">
          <AlertHistoryTable />
        </div>
      </section>
      
    </main>
  );
}
