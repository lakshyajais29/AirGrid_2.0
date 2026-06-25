"use client"

import React, { useState, useEffect } from "react";

const LoadingScreen = () => {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setVisible(false);
    }, 1800);

    const timer2 = setTimeout(() => {
      setMounted(false);
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0D1B2A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "all" : "none",
        transition: "opacity 0.5s ease",
      }}
    >
      <svg width="52" height="52" viewBox="0 0 52 52" 
        style={{ animation: 'spin-hex 2.5s linear infinite' }}>
        <polygon points="26,3 47,14.5 47,37.5 26,49 5,37.5 5,14.5"
          stroke="#0F8B8D" strokeWidth="1.5" fill="none"/>
        <polygon points="26,11 39,18 39,34 26,41 13,34 13,18"
          stroke="#C9A84C" strokeWidth="1" fill="none" opacity="0.4"/>
      </svg>
      
      <div className="mt-6 font-mono font-bold text-2xl text-white tracking-[0.4em]">
        AIRGRID OS
      </div>
      
      <div className="mt-2 font-mono text-[10px] uppercase" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.3em" }}>
        INITIALIZING SENSORS...
      </div>
      
      <div className="mt-6" style={{ width: "200px", height: "2px", background: "rgba(255,255,255,0.1)", borderRadius: "2px" }}>
        <div className="progress-fill-anim" />
      </div>
    </div>
  );
};

export default LoadingScreen;
