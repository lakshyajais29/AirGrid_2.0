import { NextResponse } from "next/server";

export async function GET() {
  const encoder = new TextEncoder();
  
  // Simulated streaming delay helper
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // The 3-paragraph summary to stream
  const reportText = `SITUATION REPORT - ${new Date().toISOString().split('T')[0]}\n\n` +
    `Current Air Quality Index (AQI) stands at 245 (POOR) across the National Capital Region. The dominant pollutant remains PM2.5, primarily driven by localized meteorological stagnation and a 15% increase in aviation traffic at IGI Airport over the last 24 hours. The Graded Response Action Plan (GRAP) is currently active at Stage II.\n\n` +
    `Aviation emissions from LTO cycles contributed approximately 12.4% to the localized NOx inventory today. A minor anomaly was detected at 08:00 IST where NO2 levels spiked by 40 µg/m³; our models correlate this with a concentrated block of wide-body aircraft departures during low-dispersion wind conditions.\n\n` +
    `RECOMMENDATION: Advise immediate deployment of mechanical sweepers around Sector 8 Dwarka and request ATC to optimize taxi times. If AQI exceeds 300 within the next 48 hours, GRAP Stage III restrictions should be considered for non-essential diesel generators.`;

  const stream = new ReadableStream({
    async start(controller) {
      const words = reportText.split(' ');
      for (const word of words) {
        controller.enqueue(encoder.encode(word + ' '));
        // Randomize delay to make it feel like an AI typing
        await delay(20 + Math.random() * 50);
      }
      controller.close();
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
