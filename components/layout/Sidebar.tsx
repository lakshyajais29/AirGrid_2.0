"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { HiMenu, HiMap, HiCloud, HiChartBar, HiUsers, HiDocumentText, HiAcademicCap, HiShieldCheck, HiCalendar, HiCog, HiFlag } from "react-icons/hi";
import { RiFlightTakeoffLine, RiFileDownloadLine, RiHeartLine } from "react-icons/ri";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { name: "Command Centre", href: "/", icon: <HiMenu /> },
    { name: "Flight Corridor Monitor", href: "/flights", icon: <RiFlightTakeoffLine /> },
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
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99,
            background: "rgba(0,0,0,0.2)",
            transition: "opacity 0.3s ease",
          }}
        />
      )}

      {/* Sidebar */}
      <nav
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          width: "256px",
          zIndex: 100,
          background: "linear-gradient(180deg, #0D1B2A 0%, #1A3A5C 100%)",
          borderRight: "1px solid rgba(15,139,141,0.3)",
          transform: isOpen ? "translateX(0)" : "translateX(-248px)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Grip indicator strip (always visible — the 8px trigger) */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "8px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            pointerEvents: "none",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: "3px",
                height: "20px",
                background: "rgba(0,245,212,0.4)",
                borderRadius: "2px",
              }}
            />
          ))}
        </div>

        {/* AIRGRID OS brand at top */}
        <div style={{ padding: "20px 16px 8px 16px" }}>
          <div style={{
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#00f5d4",
            letterSpacing: "0.2em",
            fontWeight: "bold",
            opacity: 0.8,
          }}>
            ⬡ AIRGRID OS
          </div>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: "auto", paddingTop: "8px" }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const isDisabled = item.href === "/health" || item.href === "/admin";

            if (isDisabled) {
              return (
                <div
                  key={item.href}
                  style={{ opacity: 0.4, cursor: "not-allowed" }}
                  className="flex items-center px-4 py-2 text-white border-l-4 border-transparent"
                >
                  <span className="mr-3 text-base">{item.icon}</span>
                  <span className="flex-1 flex items-center justify-between text-sm">
                    <span>{item.name}</span>
                    <span style={{
                      fontSize: "9px",
                      background: "rgba(255,255,255,0.1)",
                      padding: "1px 4px",
                      borderRadius: "3px",
                    }}>(soon)</span>
                  </span>
                </div>
              );
            }

            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm transition-colors border-l-4 ${
                  isActive
                    ? "bg-[rgba(15,139,141,0.15)] border-[#0F8B8D] text-[#00f5d4]"
                    : "text-white border-transparent hover:border-[#0F8B8D] hover:bg-[#1E5FA8]"
                }`}
              >
                <span className="mr-3 text-base">{item.icon}</span>
                <span>{item.name}</span>
              </a>
            );
          })}
        </div>

        {/* Bottom watermark */}
        <div style={{
          padding: "12px 16px",
          textAlign: "center",
          fontSize: "10px",
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.3em",
          fontFamily: "monospace",
        }}>
          AIRGRID OS
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
