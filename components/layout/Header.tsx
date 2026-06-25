"use client";
import React, { useEffect, useState } from "react";
import { AQIBadge } from "../shared/AQIBadge";
import { FiBell } from "react-icons/fi";

export const Header: React.FC = () => {
  const [time, setTime] = useState("");
  const [alertCount, setAlertCount] = useState(3);

  useEffect(() => {
    // Set time on client only to avoid SSR/hydration mismatch
    setTime(new Date().toLocaleTimeString("en-IN", { hour12: false }));
    const timer = setInterval(
      () => setTime(new Date().toLocaleTimeString("en-IN", { hour12: false })),
      1000
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 text-white flex items-center justify-between px-6 shadow-md" style={{ background: 'linear-gradient(90deg, #0D1B2A 0%, #1A3A5C 100%)', borderBottom: '2px solid #C9A84C' }}>
      <div className="flex items-center space-x-4">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <polygon points="14,2 25,8 25,20 14,26 3,20 3,8"
            stroke="#0F8B8D" strokeWidth="1.5" fill="rgba(15,139,141,0.15)"/>
          <polygon points="14,7 20,10.5 20,17.5 14,21 8,17.5 8,10.5"
            stroke="#C9A84C" strokeWidth="1" fill="none" opacity="0.6"/>
        </svg>
        <div className="flex flex-col leading-tight">
          <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, 
            fontSize:'16px', color:'#ffffff', letterSpacing:'0.1em' }}>
            AIRGRID OS
          </span>
          <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.45)', 
            letterSpacing:'0.15em', textTransform:'uppercase' }}>
            Delhi Municipal Corporation
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <AQIBadge value={187} size="md" />
        <div className="relative">
          <FiBell className="text-2xl cursor-pointer" />
          {alertCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-critical-red text-white text-xs rounded-full px-1">
              {alertCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mr-4">
          <span className="live-dot" />
          <span style={{ fontSize:'10px', fontFamily:'var(--font-mono)',
            color:'rgba(255,255,255,0.5)', letterSpacing:'0.12em' }}>
            SYSTEM LIVE
          </span>
        </div>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'13px' }}>{time}</span>
      </div>
    </header>
  );
};

export default Header;
