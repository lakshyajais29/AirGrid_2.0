"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function PolicyRecommendationPanel() {
  const actions = [
    "GRAP Stage II: Increase frequency of mechanized sweeping and water sprinkling on roads.",
    "GRAP Stage II: Enforce strict ban on use of coal/firewood in tandoors in hotels/restaurants.",
    "Airport Specific: Direct ATC to minimize queueing delays for departing aircraft during 06:00-09:00 IST.",
    "Airport Specific: Mandate use of Fixed Electrical Ground Power (FEGP) to reduce APU usage at gates."
  ];

  return (
    <Card>
      <CardHeader className="bg-[var(--navy)] text-white">
        <CardTitle>Recommended Actions</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ul className="space-y-4">
          {actions.map((action, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[var(--safe-green)] shrink-0 mt-0.5" />
              <span className="text-sm text-slate-700 leading-snug font-medium">{action}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
