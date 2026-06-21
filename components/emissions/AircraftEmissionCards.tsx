import React from "react";
import { calculateLTOEmissions, AIRCRAFT_DATA } from "@/lib/emission-calculator";

export const AircraftEmissionCards: React.FC = () => {
  const aircraftTypes = Object.keys(AIRCRAFT_DATA);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {aircraftTypes.map((type) => {
        const emissions = calculateLTOEmissions(type);
        return (
          <div key={type} className="bg-white rounded-lg shadow p-5 border-t-4 border-navy">
            <h3 className="text-lg font-bold text-navy mb-3">{type}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">NOx per LTO</span>
                <span className="font-mono text-sm font-semibold text-critical-red">
                  {emissions.nox_kg.toFixed(2)} kg
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">PM2.5 per LTO</span>
                <span className="font-mono text-sm font-semibold text-gov-gold">
                  {emissions.pm25_kg.toFixed(2)} kg
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">CO₂ per LTO</span>
                <span className="font-mono text-sm font-semibold text-navy">
                  {(emissions.co2_kg / 1000).toFixed(2)} t
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
