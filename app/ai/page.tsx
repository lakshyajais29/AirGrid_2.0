"use client";

import React from "react";
import { DailySituationReport } from "@/components/ai/DailySituationReport";
import { AnomalyExplainer } from "@/components/ai/AnomalyExplainer";
import { NaturalLanguageQuery } from "@/components/ai/NaturalLanguageQuery";
import { PolicyRecommendationPanel } from "@/components/ai/PolicyRecommendationPanel";

export default function AIPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-[var(--navy)] tracking-tight">AIRGRID AI Assistant</h1>
        <p className="text-slate-600 mt-2 text-sm max-w-3xl">
          Environmental intelligence driven by Anthropic Claude. Generates real-time anomaly explanations, 
          situational reports, and policy recommendations based on live telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <DailySituationReport />
          <AnomalyExplainer />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <PolicyRecommendationPanel />
          <NaturalLanguageQuery />
        </div>
      </div>
    </div>
  );
}
