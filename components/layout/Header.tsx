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
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00f5d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
        <div className="flex flex-col">
          <span className="text-xl font-bold">AIRGRID OS</span>
          <span className="text-[10px] tracking-[0.2em] opacity-60">DELHI MUNICIPAL CORPORATION</span>
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
        <div className="flex items-center space-x-2">
          <span className="live-dot" />
          <span className="text-[10px] text-green-400 font-mono tracking-widest">SYSTEM LIVE</span>
        </div>
        <span className="font-mono text-base font-medium px-2 py-1 bg-white/10 rounded">{time}</span>
        <span className="text-sm">Officer</span>
      </div>
    </header>
  );
};

export default Header;
