"use client";

import React from "react";
import { DailySituationReport } from "@/components/ai/DailySituationReport";
import { AnomalyExplainer } from "@/components/ai/AnomalyExplainer";
import { NaturalLanguageQuery } from "@/components/ai/NaturalLanguageQuery";
import { PolicyRecommendationPanel } from "@/components/ai/PolicyRecommendationPanel";
import { Sparkles } from "lucide-react";

export default function AIPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[var(--accent)]/10 rounded-xl">
          <Sparkles className="w-8 h-8 text-[var(--accent)]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">AIRGRID AI Assistant</h1>
          <p className="text-slate-500 mt-1 text-sm max-w-2xl leading-relaxed">
            Environmental intelligence powered by Google Gemini. Generates real-time anomaly explanations, 
            situational reports, and policy recommendations based on live city telemetry.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8 flex flex-col">
          <DailySituationReport />
          <AnomalyExplainer />
        </div>
        <div className="lg:col-span-1 space-y-8 flex flex-col">
          <PolicyRecommendationPanel />
          <NaturalLanguageQuery />
        </div>
      </div>
    </div>
  );
}
