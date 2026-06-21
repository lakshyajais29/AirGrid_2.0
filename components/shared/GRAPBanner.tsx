import React from "react";

interface GRAPBannerProps {
  level: number; // 1-4
}

const getGRAPInfo = (level: number) => {
  const levels = {
    1: { 
      label: "GRAP Level 1", 
      color: "var(--safe-green)", 
      actions: ["Monitor AQI daily", "Inform public", "Activate control rooms"]
    },
    2: { 
      label: "GRAP Level 2", 
      color: "var(--mid-blue)", 
      actions: ["Increase monitoring frequency", "Restrict construction", "Advise sensitive groups"]
    },
    3: { 
      label: "GRAP Level 3", 
      color: "var(--critical-red)", 
      actions: ["Ban diesel generators", "Odd-even vehicle rationing", "Crackdown on visibly polluting vehicles"]
    },
    4: { 
      label: "GRAP Level 4", 
      color: "#5c0e0e", 
      actions: ["Immediate action on hotspots", "Traffic restrictions", "Industrial curbs"]
    }
  };
  return levels[level as keyof typeof levels] || levels[1];
};

const GRAPBanner: React.FC<GRAPBannerProps> = ({ level }) => {
  const info = getGRAPInfo(level);

  return (
    <div className="rounded-md p-4 mb-4" style={{ backgroundColor: info.color }}>
      <div className="text-white font-semibold mb-2">{info.label}</div>
      <ul className="text-sm text-white space-y-1">
        {info.actions.map((action, i) => (
          <li key={i}>• {action}</li>
        ))}
      </ul>
    </div>
  );
};

export { GRAPBanner };
