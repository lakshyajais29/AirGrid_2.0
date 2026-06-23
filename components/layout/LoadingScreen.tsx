"use client";

import React, { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const hideTimer = setTimeout(() => setVisible(false), 1600);
    const unmountTimer = setTimeout(() => setMounted(false), 2000);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0a0e1a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 0.4s ease",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* Spinning hexagon */}
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        fill="none"
        style={{ animation: "spin-hex 2s linear infinite" }}
      >
        <polygon
          points="28,4 50,16 50,40 28,52 6,40 6,16"
          stroke="#00f5d4"
          strokeWidth="2"
          fill="none"
          strokeLinejoin="round"
        />
        <polygon
          points="28,12 42,20 42,36 28,44 14,36 14,20"
          stroke="#00f5d4"
          strokeWidth="1"
          fill="none"
          opacity="0.3"
        />
      </svg>

      {/* Brand name */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "1.5rem",
          letterSpacing: "0.4em",
          color: "#00f5d4",
          fontWeight: "bold",
          marginTop: "24px",
        }}
      >
        AIRGRID OS
      </div>

      {/* Initializing label */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "10px",
          letterSpacing: "0.35em",
          color: "#4a6080",
          marginTop: "12px",
          textTransform: "uppercase",
        }}
      >
        INITIALIZING SENSORS...
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: "240px",
          height: "2px",
          background: "rgba(0,245,212,0.15)",
          borderRadius: "2px",
          marginTop: "24px",
          overflow: "hidden",
        }}
      >
        <div className="progress-fill-anim" />
      </div>
    </div>
  );
}
