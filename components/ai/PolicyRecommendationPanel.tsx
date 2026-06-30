"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, Lightbulb } from "lucide-react";

export function PolicyRecommendationPanel() {
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchPolicy() {
      try {
        const res = await fetch("/api/ai/policy");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setActions(json.actions || []);
      } catch (err) {
        setActions(["AI system unavailable. Proceed with standard GRAP protocols."]);
      } finally {
        setLoading(false);
      }
    }
    fetchPolicy();
  }, []);

  const renderActionText = (text: string) => {
    // Split by ** and render odd indices as bold
    const parts = text.split("**");
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="text-slate-900 font-bold bg-[var(--safe-green)]/10 px-1 rounded-sm">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <Card className="shadow-sm border-slate-200 overflow-hidden rounded-xl">
      <CardHeader className="flex flex-row items-center gap-3 bg-white border-b border-slate-100 py-4">
        <div className="p-2 bg-[var(--safe-green)]/10 rounded-lg">
          <Lightbulb className="w-5 h-5 text-[var(--safe-green)]" />
        </div>
        <CardTitle className="text-lg font-semibold text-slate-800">Action Plan</CardTitle>
      </CardHeader>
      <CardContent className="p-6 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Formulating policy...</span>
          </div>
        ) : (
          <ul className="space-y-4">
            {actions.map((action, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[var(--safe-green)] shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 leading-snug font-medium">
                  {renderActionText(action)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}


