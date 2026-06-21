// "use client" – this page renders a client‑side component
"use client"

import React from "react"
import { LiveFlightMonitor } from "@/components/dashboard/LiveFlightMonitor"

export default function FlightsPage() {
  return (
    <div className="min-h-screen bg-light-bg p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-navy mb-4">Live Flight Monitor</h1>
        <LiveFlightMonitor />
      </div>
    </div>
  )
}
