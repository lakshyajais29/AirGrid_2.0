export type LTOPhase = "Taxi-Out" | "Takeoff" | "Climb" | "Approach" | "Taxi-In";

export const LTO_PHASES: { name: LTOPhase; timeMin: number; thrustPercent: number }[] = [
  { name: "Taxi-Out", timeMin: 26.0, thrustPercent: 7 },
  { name: "Takeoff",  timeMin: 0.7,  thrustPercent: 100 },
  { name: "Climb",    timeMin: 2.2,  thrustPercent: 85 },
  { name: "Approach", timeMin: 4.0,  thrustPercent: 30 },
  { name: "Taxi-In",  timeMin: 7.0,  thrustPercent: 7 },
];

// NOx EI in g/kg fuel, Fuel flow in kg/s
export const AIRCRAFT_DATA: Record<string, { nox: number[]; fuel: number[]; engines: number }> = {
  "B737-800": {
    nox: [11.5, 38.2, 22.1, 9.8, 11.5],
    fuel: [0.21, 1.18, 0.95, 0.38, 0.21],
    engines: 2,
  },
  "A320neo": {
    nox: [9.2, 28.4, 17.3, 8.1, 9.2],
    fuel: [0.18, 0.98, 0.79, 0.31, 0.18],
    engines: 2,
  },
  "A321": {
    nox: [13.1, 42.6, 28.7, 11.2, 13.1],
    fuel: [0.24, 1.35, 1.08, 0.43, 0.24],
    engines: 2,
  },
  "B777-300": {
    nox: [22.4, 71.3, 45.8, 18.6, 22.4],
    fuel: [0.45, 2.85, 2.28, 0.91, 0.45],
    engines: 2,
  },
  "ATR72": {
    nox: [4.2, 9.8, 7.1, 3.9, 4.2],
    fuel: [0.09, 0.31, 0.25, 0.10, 0.09],
    engines: 2,
  },
};

export const PM25_EI = 0.05; // g/kg fuel
export const CO2_EI = 3.16; // kg/kg fuel

export type EmissionResult = {
  nox_kg: number;
  pm25_kg: number;
  co2_kg: number;
  total_fuel_kg: number;
  breakdown: {
    phase: string;
    nox_kg: number;
    pm25_kg: number;
    co2_kg: number;
    fuel_kg: number;
  }[];
};

export function calculateLTOEmissions(aircraftType: string): EmissionResult {
  const data = AIRCRAFT_DATA[aircraftType];
  if (!data) throw new Error(`Unknown aircraft type: ${aircraftType}`);

  let total_nox_g = 0;
  let total_fuel_kg = 0;
  const breakdown: EmissionResult["breakdown"] = [];

  for (let i = 0; i < LTO_PHASES.length; i++) {
    const phase = LTO_PHASES[i];
    // Fuel flow in kg/s, time in min -> Total fuel per phase for all engines
    const fuel_kg = data.fuel[i] * phase.timeMin * 60 * data.engines;
    const nox_g = fuel_kg * data.nox[i];
    
    total_fuel_kg += fuel_kg;
    total_nox_g += nox_g;

    breakdown.push({
      phase: phase.name,
      nox_kg: nox_g / 1000,
      pm25_kg: (fuel_kg * PM25_EI) / 1000,
      co2_kg: fuel_kg * CO2_EI,
      fuel_kg,
    });
  }

  return {
    nox_kg: total_nox_g / 1000,
    pm25_kg: (total_fuel_kg * PM25_EI) / 1000,
    co2_kg: total_fuel_kg * CO2_EI,
    total_fuel_kg,
    breakdown,
  };
}
