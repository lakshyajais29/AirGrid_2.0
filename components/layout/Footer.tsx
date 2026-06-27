"use client";

const Footer = () => (
  <footer
    style={{
      background:  "var(--navy)",
      height:      "36px",
      borderTop:   "1px solid rgba(255,255,255,0.05)",
      flexShrink:  0,
      display:     "flex",
      alignItems:  "center",
      justifyContent: "space-between",
      padding:     "0 20px",
    }}
  >
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em" }}>
      ⬡ AIRGRID OS v2.0
    </span>
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "rgba(255,255,255,0.18)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
      WAQI · CPCB · DPCC · OpenWeatherMap
    </span>
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "rgba(255,255,255,0.18)", letterSpacing: "0.08em" }}>
      © 2026 GOVERNMENT OF NCT OF DELHI
    </span>
  </footer>
);

export default Footer;
