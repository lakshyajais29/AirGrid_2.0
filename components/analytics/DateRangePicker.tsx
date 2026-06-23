"use client";

import React, { useState } from "react";
import { format, subDays, startOfYear } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DateRangePicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState("30D");

  // In a real app we'd use react-day-picker and a Popover, but sticking to strict flat design
  // we will just build a custom select / preset button group to keep it simple and bug-free
  // without needing deep shadcn primitive installations.

  const setPreset = (preset: string) => {
    setSelectedRange(preset);
    // Here we'd lift state up to filter charts
  };

  const getLabel = () => {
    const today = new Date();
    switch (selectedRange) {
      case "Today": return format(today, "MMM d, yyyy");
      case "7D": return `${format(subDays(today, 7), "MMM d")} - ${format(today, "MMM d, yyyy")}`;
      case "30D": return `${format(subDays(today, 30), "MMM d")} - ${format(today, "MMM d, yyyy")}`;
      case "90D": return `${format(subDays(today, 90), "MMM d")} - ${format(today, "MMM d, yyyy")}`;
      case "1Y": return `${format(startOfYear(today), "MMM d")} - ${format(today, "MMM d, yyyy")}`;
      default: return "Select Range";
    }
  };

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        className="w-[280px] justify-start text-left font-normal border-slate-300 rounded-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {getLabel()}
      </Button>

      {isOpen && (
        <div className="absolute top-12 left-0 z-50 w-auto bg-white border border-slate-200 shadow-md rounded-sm p-3">
          <div className="flex flex-col space-y-2">
            {["Today", "7D", "30D", "90D", "1Y"].map(preset => (
              <Button 
                key={preset}
                variant={selectedRange === preset ? "primary" : "ghost"}
                className={`justify-start rounded-sm h-8 px-3 ${selectedRange === preset ? 'bg-[var(--navy)] text-white' : 'text-slate-700'}`}
                onClick={() => { setPreset(preset); setIsOpen(false); }}
              >
                {preset === "Today" ? "Today" : `Last ${preset}`}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
