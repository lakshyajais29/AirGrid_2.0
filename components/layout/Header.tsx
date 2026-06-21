"use client";
import React, { useEffect, useState } from "react";
import { AQIBadge } from "../shared/AQIBadge";
import { FiBell } from "react-icons/fi";

export const Header: React.FC = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [alertCount, setAlertCount] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-navy text-white flex items-center justify-between px-6 shadow-md">
      <div className="flex items-center space-x-4">
        <img src="/logo.svg" alt="DMC Emblem" className="h-10" />
        <span className="text-xl font-bold">SKYVIGIL</span>
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
        <span className="text-sm">{time}</span>
        <span className="text-sm">Officer</span>
      </div>
    </header>
  );
};

export default Header;
