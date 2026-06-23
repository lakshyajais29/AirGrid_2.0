import { NextResponse } from "next/server";

export async function GET() {
  const headers = "Date,Ward,AQI,PM2.5,NO2,Flight_Volume_LTO\n";
  const rows = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return `${d.toISOString().split('T')[0]},Palam,${100 + i},${50 + i * 0.5},${30 + i * 0.2},${400 + i * 5}`;
  }).join("\n");

  const csv = headers + rows;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=\"airgrid_bulk_export.csv\"",
    },
  });
}
