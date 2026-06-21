import React from "react";
import { calculateLTOEmissions, AIRCRAFT_DATA } from "@/lib/emission-calculator";

const fleetCounts: Record<string, number> = {
  "B737-800": 80,
  "A320neo": 70,
  "A321": 20,
  "B777-300": 15,
  "ATR72": 15,
};

export const AnnualProjectionCard: React.FC = () => {
  // Calculate today's total emissions
  let dailyNox = 0;
  let dailyPm25 = 0;
  let dailyCo2 = 0;

  Object.entries(fleetCounts).forEach(([type, count]) => {
    const emissions = calculateLTOEmissions(type);
    dailyNox += emissions.nox_kg * count;
    dailyPm25 += emissions.pm25_kg * count;
    dailyCo2 += emissions.co2_kg * count;
  });

  const annualNoxTonnes = (dailyNox * 365) / 1000;
  const annualPm25Tonnes = (dailyPm25 * 365) / 1000;
  const annualCo2Tonnes = (dailyCo2 * 365) / 1000;

  return (
    <div className="bg-navy rounded-lg shadow p-6 text-white flex flex-col justify-between h-full">
      <div>
        <h2 className="text-xl font-semibold mb-2 text-gov-gold">Annual Projection</h2>
        <p className="text-sm text-gray-300 mb-6">
          Estimated 365-day impact based on today's fleet composition and LTO cycles.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="border-b border-deep-blue pb-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Carbon Dioxide (CO₂)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-white">
              {annualCo2Tonnes.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-sm text-gray-400">tonnes/yr</span>
          </div>
        </div>

        <div className="border-b border-deep-blue pb-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Nitrogen Oxides (NOx)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-critical-red">
              {annualNoxTonnes.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
            <span className="text-sm text-gray-400">tonnes/yr</span>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Particulate Matter (PM2.5)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-accent-teal">
              {annualPm25Tonnes.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
            <span className="text-sm text-gray-400">tonnes/yr</span>
          </div>
        </div>
      </div>
    </div>
  );
};
