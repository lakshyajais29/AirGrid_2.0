import React from "react";

/* Recent enforcement actions — most recent first */
const TIMELINE = [
  { time: "14:32", ward: "Mundka",       action: "Team Dispatched",    dept: "MCD North",  emoji: "🚔", color: "#0F8B8D" },
  { time: "13:50", ward: "Dwarka",       action: "Drone Deployed",     dept: "AG-01",       emoji: "✈️", color: "#7C3AED" },
  { time: "12:45", ward: "Anand Vihar",  action: "Site Sealed",        dept: "DPCC",        emoji: "🔒", color: "#DC2626" },
  { time: "11:30", ward: "Saket",        action: "Alert Acknowledged", dept: "ICCC",        emoji: "✅", color: "#D97706" },
  { time: "10:20", ward: "Rohini",       action: "Report Filed",       dept: "CAQM",        emoji: "📋", color: "#16A34A" },
];

export function EnforcementTimeline() {
  return (
    <div style={{ padding: "10px 14px 12px" }}>
      <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "10px" }}>
        Recent Actions
      </span>

      {TIMELINE.map((ev, i) => (
        <div key={i} style={{ display: "flex", gap: "10px", position: "relative" }}>
          {/* Vertical connector line */}
          {i < TIMELINE.length - 1 && (
            <div style={{
              position: "absolute", left: "13px", top: "26px",
              width: "1px", height: "calc(100% - 8px)",
              background: "var(--border-faint)",
            }} />
          )}

          {/* Emoji dot */}
          <div style={{
            width: "26px", height: "26px", flexShrink: 0,
            borderRadius: "50%",
            background: ev.color + "15",
            border: `1.5px solid ${ev.color}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", lineHeight: 1,
            zIndex: 1,
          }}>
            {ev.emoji}
          </div>

          {/* Content */}
          <div style={{ paddingBottom: "12px", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
                {ev.action}
              </div>
              <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", flexShrink: 0, marginLeft: "6px" }}>
                {ev.time}
              </span>
            </div>
            <div style={{ display: "flex", gap: "5px", marginTop: "3px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{ev.ward}</span>
              <span style={{ fontSize: "10px", color: "var(--text-disabled)" }}>·</span>
              <span style={{
                fontSize: "9px", fontWeight: 700,
                color: ev.color,
                background: ev.color + "12",
                padding: "1px 6px", borderRadius: "4px",
              }}>
                {ev.dept}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
