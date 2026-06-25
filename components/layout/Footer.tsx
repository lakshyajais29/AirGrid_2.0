"use client";

import React from "react";

const Footer = () => {
  return (
    <footer
      className="flex items-center justify-between px-6"
      style={{
        background: "var(--navy)",
        height: "44px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="font-mono text-[11px] text-white/60">
        ⬡ AIRGRID OS v2.0 — Delhi Municipal Corporation
      </div>
      <div className="text-[10px] text-white/40">
        Data: WAQI · OpenWeatherMap · CPCB · OpenSky
      </div>
      <div className="text-[10px] text-white/40">
        © 2026 Government of NCT of Delhi
      </div>
    </footer>
  );
};

export default Footer;
