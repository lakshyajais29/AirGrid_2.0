import { NextResponse } from 'next/server';

// Define the shape of an alert
export type Alert = {
  id: string;
  ward: string;
  pollutant: string;
  currentValue: number;
  threshold: number;
  unit: string;
  severity: 'Critical' | 'High' | 'Medium';
  duration: string; // e.g., "2h 15m"
  assignedOfficer: string;
  status: 'Active' | 'Resolved' | 'Acknowledged';
  triggeredAt: string; // ISO timestamp
};

// Mock active alerts for Delhi zones
const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    ward: 'Anand Vihar',
    pollutant: 'PM2.5',
    currentValue: 285,
    threshold: 150,
    unit: 'µg/m³',
    severity: 'Critical',
    duration: '2h 15m',
    assignedOfficer: 'Rajesh Kumar',
    status: 'Active',
    triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-2',
    ward: 'Saket',
    pollutant: 'NO₂',
    currentValue: 85,
    threshold: 60,
    unit: 'ppb',
    severity: 'High',
    duration: '1h 40m',
    assignedOfficer: 'Neha Sharma',
    status: 'Active',
    triggeredAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-3',
    ward: 'Laxmi Nagar',
    pollutant: 'SO₂',
    currentValue: 55,
    threshold: 50,
    unit: 'ppb',
    severity: 'Medium',
    duration: '45m',
    assignedOfficer: 'Amit Singh',
    status: 'Active',
    triggeredAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-4',
    ward: 'Dwarka',
    pollutant: 'PM10',
    currentValue: 320,
    threshold: 200,
    unit: 'µg/m³',
    severity: 'Critical',
    duration: '3h 10m',
    assignedOfficer: 'Sunita Verma',
    status: 'Active',
    triggeredAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

export async function GET() {
  // In a real implementation you would query a DB or service.
  // Here we simply return the static mock list.
  return NextResponse.json({ alerts: mockAlerts }, { status: 200 });
}
