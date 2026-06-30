"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";

export function AnomalyExplainer() {
  const [data, setData] = useState<{ title: string, analysis: string, evidence: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchAnomaly() {
      try {
        const res = await fetch("/api/ai/anomaly");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setData({
          title: "System Unavailable",
          analysis: "Unable to run anomaly detection at this time.",
          evidence: "API connection failed.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchAnomaly();
  }, []);

  return (
    <Card className="shadow-sm border-slate-200 overflow-hidden rounded-xl">
      <CardHeader className="flex flex-row items-center gap-3 bg-red-50/50 border-b border-red-100 py-4">
        <div className="p-2 bg-red-100 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <CardTitle className="text-lg font-semibold text-red-900">
          {loading ? "Analyzing anomalies..." : (data?.title || "No Title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Scanning telemetry...</span>
          </div>
        ) : (
          <div className="text-sm text-slate-700 space-y-4">
            <div>
              <strong className="text-slate-900 font-semibold block mb-1">AI Analysis:</strong>
              <p className="leading-relaxed">{data?.analysis}</p>
            </div>
            <div>
              <strong className="text-slate-900 font-semibold block mb-1">Evidence:</strong>
              <p className="leading-relaxed">{data?.evidence}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

