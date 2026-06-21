"use client";

import React from "react";

const Footer = () => {
  return (
    <footer
      className="h-10 flex items-center justify-between px-6 text-xs"
      style={{
        background: "var(--navy)",
        color: "var(--text-muted)",
        borderTop: "1px solid var(--deep-blue)",
      }}
    >
      <span>
        SKYVIGIL v2.0 — Delhi Municipal Corporation · Aviation Pollution
        Intelligence Platform
      </span>
      <span className="font-mono">
        © {new Date().getFullYear()} Government of NCT of Delhi
      </span>
    </footer>
  );
};

export default Footer;
