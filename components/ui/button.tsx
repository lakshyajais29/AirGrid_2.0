import React from "react";

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive", size?: "default" | "sm" | "lg" | "icon" }>(
  ({ className = "", variant = "primary", size = "default", ...props }, ref) => {
    let baseStyles = "inline-flex items-center justify-center rounded-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
    
    // Size styles
    if (size === "default") baseStyles += " h-10 px-4 py-2";
    else if (size === "sm") baseStyles += " h-9 rounded-sm px-3";
    else if (size === "lg") baseStyles += " h-11 rounded-sm px-8";
    else if (size === "icon") baseStyles += " h-10 w-10";

    if (variant === "primary") {
      baseStyles += " bg-[var(--navy)] text-white hover:bg-[var(--deep-blue)]";
    } else if (variant === "secondary") {
      baseStyles += " bg-[var(--gov-gold)] text-[var(--navy)] hover:bg-[#b0933f]";
    } else if (variant === "outline") {
      baseStyles += " border border-input bg-transparent hover:bg-accent hover:text-accent-foreground border-[var(--navy)] text-[var(--navy)] hover:bg-gray-100";
    } else if (variant === "ghost") {
      baseStyles += " bg-transparent hover:bg-gray-100 text-[var(--navy)]";
    } else if (variant === "destructive") {
      baseStyles += " bg-[var(--critical-red)] text-white hover:bg-red-800";
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
