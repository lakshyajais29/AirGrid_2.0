"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

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
      } catch (e) {
        setReport("Failed to generate report. Please try again later.");
      } finally {
        setIsStreaming(false);
      }
    }

    fetchReport();
  }, []);

  return (
    <Card className="shadow-sm border-slate-200 overflow-hidden rounded-xl">
      <CardHeader className="flex flex-row items-center gap-3 bg-white border-b border-slate-100 py-4">
        <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
          <FileText className="w-5 h-5 text-[var(--accent)]" />
        </div>
        <CardTitle className="text-lg font-semibold text-slate-800">Situation Report</CardTitle>
      </CardHeader>
      <CardContent className="p-6 bg-white">
        <div className="prose prose-slate prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
          {report || (isStreaming ? "Gathering intelligence..." : "")}
          {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-[var(--accent)] animate-pulse" />}
        </div>
      </CardContent>
    </Card>
  );
}

