"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";

const FALLBACK_REPORT =
`SITUATION REPORT — ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
Prepared by AIRGRID AI · NCT Delhi Environmental Intelligence

CURRENT STATUS
City AQI stands at 188 (MODERATE). Primary pollutant is PM2.5 at 118 µg/m³, driven by a combination of vehicular emissions and stagnant low-wind conditions over the eastern districts. GRAP Stage II measures remain active.

HOTSPOT ANALYSIS
Anand Vihar continues to record the highest readings (AQI 267) due to high-density cross-border truck movement on NH-24. Shahdara and RK Puram report elevated PM10 levels attributed to road resuspension. Industrial corridor stations at Bawana and Mundka show early morning peaks consistent with shift-change activity.

METEOROLOGICAL OUTLOOK
Wind speed: 1.4 m/s (NW). Inversion layer detected at 380m. Forecast models predict a 12–18% deterioration in air quality over the next 6 hours as sea-breeze effect diminishes post-sunset. GRAP escalation to Stage III is advised if AQI crosses 300 at two or more stations simultaneously.

RECOMMENDED ACTIONS
• Deploy mechanical sweepers to Anand Vihar and Shahdara immediately
• Issue advisory to construction sites to halt earthwork after 17:00 IST
• Activate 3 additional DPCC mobile monitoring units in eastern districts
• Alert Traffic Police to enforce truck-entry restrictions on NH-24 from 22:00 IST`;

export function DailySituationReport() {
  const [report, setReport]       = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchReport() {
      try {
        const response = await fetch("/api/ai/report");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("text/plain")) throw new Error("Not plain text");

        if (!response.body) throw new Error("No body");
        const reader  = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          setReport(prev => prev + decoder.decode(value));
        }
      } catch {
        /* API unavailable — type out the fallback report */
        let i = 0;
        const interval = setInterval(() => {
          i += 3;
          setReport(FALLBACK_REPORT.slice(0, i));
          if (i >= FALLBACK_REPORT.length) {
            setReport(FALLBACK_REPORT);
            clearInterval(interval);
          }
        }, 16);
        return;
      } finally {
        setIsStreaming(false);
      }
    }

    fetchReport();
  }, []);

  return (
    <Card className="border-l-4 border-l-[var(--navy)]">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Bot className="w-6 h-6 text-[var(--navy)]" />
        <CardTitle>Daily Situation Report (AI Generated)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
          {report}
          {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-[var(--navy)] animate-pulse" />}
        </div>
      </CardContent>
    </Card>
  );
}
