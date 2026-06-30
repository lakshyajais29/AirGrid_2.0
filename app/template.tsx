"use client";

import React from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
        minHeight: 0,
        width: "100%",
        animation: "pageEnter 0.3s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      {children}
    </div>
  );
}
