"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Video } from "lucide-react";

export const DemoModeBanner = () => {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    // Client-side date generation to avoid hydration mismatch
    const now = new Date();
    setDateStr(now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }));
  }, []);

  if (!isDemo) return null;

  return (
    <div 
      style={{
        height: "40px",
        background: "#C9A84C",
        color: "#0D1B2A",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        zIndex: 50,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Video size={14} />
        LIVE DEMONSTRATION — AirGrid OS Pilot · Delhi NCR
      </div>
      
      <div style={{ opacity: 0.85 }}>
        All data is real-time · For official review only
      </div>
      
      <div style={{ opacity: 0.85 }}>
        Ward: Anand Vihar &nbsp;|&nbsp; Date: {dateStr}
      </div>
    </div>
  );
};
