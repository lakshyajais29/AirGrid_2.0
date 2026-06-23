"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";

export function DailySituationReport() {
  const [report, setReport] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchReport() {
      try {
        const response = await fetch("/api/ai/report");
        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          setReport((prev) => prev + chunk);
        }
      } catch (error) {
        console.error("Failed to fetch report", error);
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
