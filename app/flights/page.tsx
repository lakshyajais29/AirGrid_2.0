"use client"

import React from "react"
import dynamic from "next/dynamic"

const LiveFlightMonitorDynamic = dynamic(
  () => import("@/components/dashboard/LiveFlightMonitor").then(m => ({ default: m.LiveFlightMonitor })),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "#8A9BB0", fontSize: "14px" }}>
        Loading flight monitor…
      </div>
    ),
  }
)

export default function FlightsPage() {
  return (
    <div style={{
      backgroundImage: "radial-gradient(circle, #c8d6e8 1px, transparent 1px)",
      backgroundSize: "28px 28px",
      backgroundColor: "#F4F6FA",
      minHeight: "100vh",
      padding: "28px",
    }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{
          background: "linear-gradient(135deg, #0D1B2A 0%, #1A3A5C 70%, #0F8B8D 100%)",
          borderRadius: "16px", padding: "20px 28px", marginBottom: "24px",
        }}>
          <div style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.25em", color: "#C9A84C", marginBottom: "6px" }}>
            AIRGRID OS · FLIGHT CORRIDOR MONITOR
          </div>
          <h1 style={{ color: "white", fontSize: "24px", fontWeight: 700, margin: 0 }}>
            Flight Corridor Monitor
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px", margin: 0 }}>
            Live route tracking · Altitude monitoring · CSV import · IGI Airport coverage
          </p>
        </div>

        <div className="panel-card p-6" style={{ borderTop: "3px solid var(--accent-teal)" }}>
          <LiveFlightMonitorDynamic />
        </div>
      </div>
    </div>
  )
}
