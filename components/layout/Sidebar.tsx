"use client";

import React, { useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, MapPin, Building2,
  Plane, AlertTriangle, Brain,
  Wind, TrendingUp, BarChart3, GitBranch,
  FileText, Factory, Heart, Settings,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Operations",
    items: [
      { name: "Command Centre",    href: "/",           icon: LayoutDashboard },
      { name: "Pollution Grid",    href: "/pollution",  icon: MapPin          },
      { name: "Ward Intelligence", href: "/wards",      icon: Building2       },
    ],
  },
  {
    label: "Enforcement",
    items: [
      { name: "Drone Operations",  href: "/flights",    icon: Plane           },
      { name: "Alert Management",  href: "/alerts",     icon: AlertTriangle   },
      { name: "AI Intelligence",   href: "/ai",         icon: Brain           },
    ],
  },
  {
    label: "Analysis",
    items: [
      { name: "Plume & Dispersion",  href: "/plume",       icon: Wind       },
      { name: "Forecasting",         href: "/forecast",    icon: TrendingUp },
      { name: "Temporal Analytics",  href: "/analytics",   icon: BarChart3  },
      { name: "AQI Correlation",     href: "/correlation", icon: GitBranch  },
    ],
  },
  {
    label: "Reports",
    items: [
      { name: "Reports & Export",    href: "/reports",   icon: FileText            },
      { name: "Emission Estimator",  href: "/emissions", icon: Factory             },
      { name: "Health Advisory",     href: "/health",    icon: Heart,   soon: true },
      { name: "Administration",      href: "/admin",     icon: Settings, soon: true },
    ],
  },
];

const SidebarContent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname  = usePathname();
  const searchParams = useSearchParams();

  if (searchParams.get("demo") === "true") return null;

  return (
    <>
      {isOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 98 }}
          onClick={() => setIsOpen(false)}
        />
      )}

      <nav
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        style={{
          position:   "fixed",
          left:       0,
          top:        "52px",
          height:     "calc(100vh - 52px - 36px)",
          width:      isOpen ? "240px" : "64px",
          zIndex:     100,
          transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "linear-gradient(180deg, #0D1B2A 0%, #0f2035 100%)",
          borderRight:"1px solid rgba(15,139,141,0.15)",
          display:    "flex",
          flexDirection: "column",
          overflow:   "hidden",
        }}
      >
        {/* Nav groups */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingTop: "12px", paddingBottom: "8px" }}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label}>
              {/* Group label — only readable when expanded */}
              <div style={{ height: "26px", display: "flex", alignItems: "center", padding: "0 0 0 22px", marginTop: gi === 0 ? 0 : "6px" }}>
                <span style={{
                  fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.22)",
                  whiteSpace: "nowrap", opacity: isOpen ? 1 : 0,
                  transition: "opacity 0.12s ease",
                }}>
                  {group.label}
                </span>
              </div>

              {group.items.map((item) => {
                const isActive  = pathname === item.href;
                const Icon      = item.icon;
                const isSoon    = "soon" in item && item.soon;

                if (isSoon) {
                  return (
                    <div key={item.href} title={!isOpen ? item.name : undefined} style={{
                      display: "flex", alignItems: "center", height: "40px",
                      padding: "0 22px", gap: "14px", opacity: 0.28, cursor: "not-allowed", overflow: "hidden",
                    }}>
                      <Icon size={16} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />
                      <span style={{
                        fontSize: "13px", color: "rgba(255,255,255,0.5)",
                        whiteSpace: "nowrap", opacity: isOpen ? 1 : 0,
                        transition: "opacity 0.1s ease",
                      }}>
                        {item.name}
                      </span>
                    </div>
                  );
                }

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    title={!isOpen ? item.name : undefined}
                    style={{
                      display: "flex", alignItems: "center", height: "40px",
                      padding: "0 22px", gap: "14px", textDecoration: "none", overflow: "hidden",
                      borderLeft: isActive ? "2px solid #0F8B8D" : "2px solid transparent",
                      background:  isActive ? "rgba(15,139,141,0.10)" : "transparent",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <Icon size={16} color={isActive ? "#0F8B8D" : "rgba(255,255,255,0.5)"} style={{ flexShrink: 0 }} />
                    <span style={{
                      fontSize: "13px", fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#fff" : "rgba(255,255,255,0.62)",
                      whiteSpace: "nowrap", opacity: isOpen ? 1 : 0,
                      transition: "opacity 0.1s ease",
                    }}>
                      {item.name}
                    </span>
                  </a>
                );
              })}

              {gi < NAV_GROUPS.length - 1 && (
                <div style={{ height: "1px", margin: "8px 14px", background: "rgba(255,255,255,0.05)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Status footer — drones active */}
        <div style={{
          padding: "10px 22px", borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", gap: "10px", overflow: "hidden",
        }}>
          <div style={{
            width: "7px", height: "7px", borderRadius: "50%",
            background: "#16A34A", flexShrink: 0,
            animation: "pulse-live 2s infinite",
          }} />
          <span style={{
            fontSize: "10px", color: "rgba(255,255,255,0.32)",
            fontFamily: "var(--font-mono)", whiteSpace: "nowrap",
            opacity: isOpen ? 1 : 0, transition: "opacity 0.1s ease",
            letterSpacing: "0.08em",
          }}>
            2 DRONES ACTIVE
          </span>
        </div>
      </nav>
    </>
  );
};

export default function Sidebar() {
  return (
    <Suspense fallback={
      <div style={{ width: "64px", flexShrink: 0, background: "#0D1B2A", borderRight: "1px solid rgba(15,139,141,0.15)" }} />
    }>
      <SidebarContent />
    </Suspense>
  );
}
