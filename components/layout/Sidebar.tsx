"use client";

import { useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, MapPin, Building2,
  Plane, AlertTriangle, Brain,
  TrendingUp, BarChart3,
  FileText, Factory, Heart, Settings,
} from "lucide-react";
import { AppearanceSwitcher } from "@/components/layout/AppearanceSwitcher";

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
      { name: "Forecasting",         href: "/forecast",    icon: TrendingUp },
      { name: "Temporal Analytics",  href: "/analytics",   icon: BarChart3  },
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
  const [isOpen,     setIsOpen]     = useState(false);
  const [lockedOpen, setLockedOpen] = useState(false);
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  if (searchParams.get("demo") === "true") return null;

  const expanded = isOpen || lockedOpen;

  return (
    <>
      {isOpen && !lockedOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 98 }}
          onClick={() => setIsOpen(false)}
        />
      )}

      <nav
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => { if (!lockedOpen) setIsOpen(false); }}
        style={{
          position:      "fixed",
          left:          0,
          top:           "52px",
          height:        "calc(100vh - 52px - 36px)",
          width:         expanded ? "240px" : "64px",
          zIndex:        100,
          transition:    "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          background:    "var(--shell-bg)",
          borderRight:   "1px solid var(--shell-border)",
          display:       "flex",
          flexDirection: "column",
          overflow:      "hidden",
        }}
      >
        {/* Nav groups */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingTop: "12px", paddingBottom: "8px" }}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label}>
              {/* Group label — only readable when expanded */}
              <div style={{ height: "26px", display: "flex", alignItems: "center", padding: "0 0 0 22px", marginTop: gi === 0 ? 0 : "6px" }}>
                <span style={{
                  fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em",
                  textTransform: "uppercase", color: "var(--shell-text-faint)",
                  whiteSpace: "nowrap", opacity: expanded ? 1 : 0,
                  transition: "opacity 0.12s ease",
                }}>
                  {group.label}
                </span>
              </div>

              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon     = item.icon;
                const isSoon   = "soon" in item && item.soon;

                if (isSoon) {
                  return (
                    <div key={item.href} title={!expanded ? item.name : undefined} style={{
                      display: "flex", alignItems: "center", height: "40px",
                      padding: "var(--nav-padding)", margin: "var(--nav-margin)", borderRadius: "var(--nav-radius)",
                      gap: "14px", opacity: 0.28, cursor: "not-allowed", overflow: "hidden",
                    }}>
                      <Icon size={18} color="var(--shell-text-muted)" style={{ flexShrink: 0 }} />
                      <span style={{
                        fontSize: "13px", color: "var(--shell-text-muted)",
                        whiteSpace: "nowrap", opacity: expanded ? 1 : 0,
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
                    title={!expanded ? item.name : undefined}
                    style={{
                      display: "flex", alignItems: "center", height: "40px",
                      padding: "var(--nav-padding)", margin: "var(--nav-margin)", borderRadius: "var(--nav-radius)",
                      gap: "14px", textDecoration: "none", overflow: "hidden",
                      borderLeft: isActive ? "calc(var(--nav-border) * 1) solid var(--shell-active-text)" : "calc(var(--nav-border) * 1) solid transparent",
                      background:  isActive ? "var(--shell-active-bg)" : "transparent",
                      boxShadow: isActive ? "var(--shell-active-shadow)" : "none",
                      transition: "background 0.15s ease, box-shadow 0.15s ease",
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--shell-hover-bg)"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <Icon size={18} color={isActive ? "var(--shell-active-text)" : "var(--shell-text-muted)"} style={{ flexShrink: 0 }} />
                    <span style={{
                      fontSize: "13px", fontWeight: isActive ? 600 : 400,
                      color: isActive ? "var(--shell-text-primary)" : "var(--shell-text-secondary)",
                      whiteSpace: "nowrap", opacity: expanded ? 1 : 0,
                      transition: "opacity 0.1s ease",
                    }}>
                      {item.name}
                    </span>
                  </a>
                );
              })}

              {gi < NAV_GROUPS.length - 1 && (
                <div style={{ height: "1px", margin: "8px 14px", background: "var(--shell-border)" }} />
              )}
            </div>
          ))}
        </div>

        {/* ── Divider before bottom controls ── */}
        <div style={{ height: "1px", margin: "0 14px", background: "var(--shell-border)", flexShrink: 0 }} />

        {/* ── Appearance Switcher ── */}
        <div style={{ flexShrink: 0 }}>
          <AppearanceSwitcher
            expanded={expanded}
            onPopoverChange={(open) => setLockedOpen(open)}
          />
        </div>

        {/* ── Status footer — drones active ── */}
        <div style={{
          padding: "10px 22px", borderTop: "1px solid var(--shell-border)",
          display: "flex", alignItems: "center", gap: "10px", overflow: "hidden",
          flexShrink: 0,
        }}>
          <div style={{
            width: "7px", height: "7px", borderRadius: "50%",
            background: "#16A34A", flexShrink: 0,
            animation: "pulse-live 2s infinite",
          }} />
          <span style={{
            fontSize: "10px", color: "var(--shell-text-tertiary, var(--shell-text-faint))",
            fontFamily: "var(--font-mono)", whiteSpace: "nowrap",
            opacity: expanded ? 1 : 0, transition: "opacity 0.1s ease",
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
      <div style={{ width: "64px", flexShrink: 0, background: "var(--shell-bg)", borderRight: "1px solid var(--shell-border)" }} />
    }>
      <SidebarContent />
    </Suspense>
  );
}
