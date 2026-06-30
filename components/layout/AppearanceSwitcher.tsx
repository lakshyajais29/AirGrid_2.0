"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/lib/ThemeContext";

type Option = { id: Theme; Icon: React.ElementType; label: string };

const OPTIONS: Option[] = [
  { id: "light",  Icon: Sun,     label: "Light"  },
  { id: "dark",   Icon: Moon,    label: "Dark"   },
  { id: "system", Icon: Monitor, label: "System" },
];

interface Props {
  expanded:          boolean;
  onPopoverChange:   (open: boolean) => void;
}

export function AppearanceSwitcher({ expanded, onPopoverChange }: Props) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen]     = useState(false);
  const [pos,  setPos]      = useState({ bottom: 0, left: 0 });
  const triggerRef          = useRef<HTMLButtonElement>(null);

  const openPopover = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ bottom: window.innerHeight - r.top + 8, left: r.left + 8 });
    setOpen(true);
    onPopoverChange(true);
  }, [onPopoverChange]);

  const closePopover = useCallback(() => {
    setOpen(false);
    onPopoverChange(false);
  }, [onPopoverChange]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closePopover(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closePopover]);

  const current = OPTIONS.find(o => o.id === theme) ?? OPTIONS[2];
  const CurIcon = current.Icon;

  return (
    <>
      {/* Backdrop to close popover on outside click */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9998 }}
          onMouseDown={closePopover}
        />
      )}

      {/* Trigger button — styled to match sidebar nav items */}
      <button
        ref={triggerRef}
        onClick={open ? closePopover : openPopover}
        title={!expanded ? "Appearance" : undefined}
        style={{
          display: "flex", alignItems: "center", height: "40px",
          width: "100%", padding: "0 22px", gap: "14px",
          background: open ? "rgba(15,139,141,0.10)" : "none",
          border: "none",
          borderLeft: open ? "2px solid #0F8B8D" : "2px solid transparent",
          cursor: "pointer", textAlign: "left", overflow: "hidden",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "none"; }}
      >
        <CurIcon
          size={16}
          color={open ? "#0F8B8D" : "rgba(255,255,255,0.5)"}
          style={{ flexShrink: 0 }}
        />
        <span style={{
          fontSize: "13px", fontWeight: open ? 600 : 400,
          color: open ? "#fff" : "rgba(255,255,255,0.62)",
          whiteSpace: "nowrap",
          opacity: expanded ? 1 : 0,
          transition: "opacity 0.1s ease",
        }}>
          Appearance
        </span>
      </button>

      {/* Popover — fixed so it escapes sidebar's overflow:hidden */}
      {open && (
        <div
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: "fixed",
            bottom: pos.bottom,
            left: pos.left,
            zIndex: 9999,
            background: "#0f2035",
            border: "1px solid rgba(15,139,141,0.22)",
            borderRadius: "12px",
            padding: "6px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4)",
            minWidth: "172px",
            animation: "popoverEnter 0.2s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          {/* Header label */}
          <div style={{
            padding: "5px 10px 8px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            marginBottom: "4px",
          }}>
            <span style={{
              fontSize: "9px", fontWeight: 700,
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.28)",
            }}>
              Appearance
            </span>
          </div>

          {OPTIONS.map(opt => {
            const isActive = theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => { setTheme(opt.id); closePopover(); }}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  width: "100%", padding: "9px 10px", borderRadius: "8px",
                  background: isActive ? "rgba(15,139,141,0.15)" : "transparent",
                  border: `1px solid ${isActive ? "rgba(15,139,141,0.35)" : "transparent"}`,
                  cursor: "pointer", textAlign: "left",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <opt.Icon
                  size={14}
                  color={isActive ? "#0F8B8D" : "rgba(255,255,255,0.5)"}
                />
                <span style={{
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                }}>
                  {opt.label}
                </span>
                {isActive && (
                  <span style={{
                    marginLeft: "auto", flexShrink: 0,
                    width: "6px", height: "6px",
                    borderRadius: "50%", background: "#0F8B8D",
                  }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
