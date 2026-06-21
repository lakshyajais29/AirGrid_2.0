import React from "react";

interface AQIBadgeProps {
  value: number;
  size?: "sm" | "md" | "lg";
}

const getAQICategory = (value: number): string => {
  if (value <= 50) return "Good";
  if (value <= 100) return "Satisfactory";
  if (value <= 200) return "Moderate";
  if (value <= 300) return "Poor";
  if (value <= 400) return "Very Poor";
  return "Severe";
};

const getAQIColor = (value: number): string => {
  if (value <= 50) return "var(--safe-green)";
  if (value <= 100) return "var(--mid-blue)";
  if (value <= 200) return "var(--accent-teal)";
  if (value <= 300) return "var(--critical-red)";
  if (value <= 400) return "#8e44ad"; // Very Poor (purple)
  return "#5c0e0e"; // Severe (maroon)
};

const AQIBadge: React.FC<AQIBadgeProps> = ({ value, size = "md" }) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} text-white`}
      style={{ backgroundColor: getAQIColor(value) }}
      aria-label={`Air Quality Index: ${value} - ${getAQICategory(value)}`}
    >
      <span className="font-mono">{value}</span>
    </span>
  );
};

export { AQIBadge };
