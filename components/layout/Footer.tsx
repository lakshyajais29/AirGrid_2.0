"use client";

const Footer = () => (
  <footer
    style={{
      background:  "var(--shell-bg)",
      height:      "36px",
      borderTop:   "1px solid var(--shell-border)",
      flexShrink:  0,
      display:     "flex",
      alignItems:  "center",
      justifyContent: "space-between",
      padding:     "0 20px",
    }}
  >
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--shell-text-faint)", letterSpacing: "0.12em" }}>
      ⬡ AIRGRID OS v2.0
    </span>
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--shell-text-faint)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
      WAQI · CPCB · DPCC · OpenWeatherMap
    </span>
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--shell-text-faint)", letterSpacing: "0.08em" }}>
      © 2026 GOVERNMENT OF NCT OF DELHI
    </span>
  </footer>
);

export default Footer;
