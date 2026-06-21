import { NextResponse } from 'next/server';

/**
 * Mock correlation data for the past 30 days.
 */
export type CorrelationRecord = {
  date: string; // ISO date string
  hourlyFlights: number;
  avgAQI: number;
  no2: number; // ppb
  nox: number; // ppb
};

const generateMock = (): CorrelationRecord[] => {
  const records: CorrelationRecord[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    // simple pattern: more flights -> higher AQI, NO2, NOx
    const hourlyFlights = Math.floor(Math.random() * 50) + 10; // 10‑60
    const avgAQI = Math.round(100 + hourlyFlights * 2 + Math.random() * 30);
    const no2 = Math.round(30 + hourlyFlights * 0.5 + Math.random() * 10);
    const nox = Math.round(20 + hourlyFlights * 0.4 + Math.random() * 8);
    records.push({
      date: d.toISOString().split('T')[0],
      hourlyFlights,
      avgAQI,
      no2,
      nox,
    });
  }
  return records;
};

const mockData = generateMock();

export async function GET() {
  return NextResponse.json({ data: mockData }, { status: 200 });
}
