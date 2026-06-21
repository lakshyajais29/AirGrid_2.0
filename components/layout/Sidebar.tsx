"use client";

import React, { useState } from "react";
import { HiMenu, HiMap, HiCloud, HiChartBar, HiUsers, HiDocumentText, HiAcademicCap, HiShieldCheck, HiCalendar, HiCog, HiFlag } from "react-icons/hi";
import { RiFlightTakeoffLine, RiFileDownloadLine, RiHeartLine } from "react-icons/ri";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const menuItems = [
    { name: "Command Centre", href: "/", icon: <HiMenu /> },
    { name: "Live Flight Monitor", href: "/flights", icon: <RiFlightTakeoffLine /> },
    { name: "Pollution Grid", href: "/pollution", icon: <HiMap /> },
    { name: "Flight-AQI Correlation", href: "/correlation", icon: <HiChartBar /> },
    { name: "Ward & Zone Analysis", href: "/wards", icon: <HiUsers /> },
    { name: "Emission Estimator", href: "/emissions", icon: <RiFileDownloadLine /> },
    { name: "Plume & Dispersion", href: "/plume", icon: <HiCloud /> },
    { name: "Temporal Analytics", href: "/analytics", icon: <HiAcademicCap /> },
    { name: "AI Intelligence", href: "/ai", icon: <HiFlag /> },
    { name: "Alert Management", href: "/alerts", icon: <HiShieldCheck /> },
    { name: "Health Advisory", href: "/health", icon: <RiHeartLine /> },
    { name: "Reports & Export", href: "/reports", icon: <HiDocumentText /> },
    { name: "Forecasting", href: "/forecast", icon: <HiCalendar /> },
    { name: "Administration", href: "/admin", icon: <HiCog /> },
  ];
  return (
    <nav className="w-64 bg-navy h-full p-0 z-50">
      <div className="flex flex-col justify-between h-full py-6">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <a key={item.href} href={item.href} className="flex items-center px-4 py-2 text-white hover:bg-mid-blue transition-colors rounded-r-none border-l-4 border-transparent hover:border-accent-teal">
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
            </a>
          ))}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="px-4 py-2 text-white bg-deep-blue hover:bg-mid-blue transition-colors">
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>
    </nav>
  );
};
export default Sidebar;
