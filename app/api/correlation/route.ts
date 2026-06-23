import { NextResponse } from "next/server";

export async function GET() {
  const scatterData = Array.from({ length: 50 }).map(() => {
    const flights = Math.floor(Math.random() * 50) + 10;
    return {
      flights,
      aqi: flights * 1.5 + Math.random() * 20, // positive correlation
    };
  });

  const emissionData = Array.from({ length: 50 }).map(() => {
    const estimatedNOx = Math.random() * 500 + 100;
    return {
      estimatedNOx,
      measuredNO2: estimatedNOx * 0.3 + Math.random() * 10,
    };
  });

  return NextResponse.json({
    correlationMatrix: {
      labels: ["Flights", "AQI", "NO2", "PM2.5", "CO"],
      data: [
        [1.0, 0.7, 0.85, 0.65, 0.4],
        [0.7, 1.0, 0.8, 0.9, 0.6],
        [0.85, 0.8, 1.0, 0.7, 0.5],
        [0.65, 0.9, 0.7, 1.0, 0.8],
        [0.4, 0.6, 0.5, 0.8, 1.0],
      ],
    },
    laggedCorrelation: [
      { lag: "0h", r: 0.4 },
      { lag: "1h", r: 0.6 },
      { lag: "2h", r: 0.7 }, // peak correlation at 2h lag
      { lag: "3h", r: 0.5 },
      { lag: "4h", r: 0.3 },
    ],
    scatterData,
    emissionData,
    stats: {
      pearsonR: 0.7, // Mock data r=0.7 as requested
      pVal: 0.001,
      r2: 0.49,
    },
  });
}
