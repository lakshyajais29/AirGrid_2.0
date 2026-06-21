// "use client" – this component uses client‑side state and effects
"use client"

import React, { useEffect, useState } from "react"

// Mock flight data – in a real app this would come from /api/flights
interface Flight {
  id: string
  callsign: string
  origin: string
  destination: string
  altitude: number // feet
  speed: number // knots
}

const mockFlights: Flight[] = [
  { id: "1", callsign: "AI‑101", origin: "DEL", destination: "BOM", altitude: 35000, speed: 460 },
  { id: "2", callsign: "SG‑202", origin: "MAA", destination: "BLR", altitude: 30000, speed: 430 },
  { id: "3", callsign: "UK‑303", origin: "LHR", destination: "JFK", altitude: 38000, speed: 500 },
]

export const LiveFlightMonitor: React.FC = () => {
  const [flights, setFlights] = useState<Flight[]>([])

  // Simulate a live‑feed that updates every 5 seconds
  useEffect(() => {
    setFlights(mockFlights)
    const interval = setInterval(() => {
      // In a real implementation we would fetch fresh data here.
      // For the demo we just rotate the array so the UI shows change.
      setFlights((prev) => {
        const rotated = [...prev.slice(1), prev[0]]
        return rotated
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
      <h2 className="text-lg font-semibold mb-2 text-navy">Live Flight Monitor</h2>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-1 text-left">Callsign</th>
            <th className="px-2 py-1 text-left">From → To</th>
            <th className="px-2 py-1 text-left">Altitude (ft)</th>
            <th className="px-2 py-1 text-left">Speed (kt)</th>
          </tr>
        </thead>
        <tbody>
          {flights.map((f) => (
            <tr key={f.id} className="border-t">
              <td className="px-2 py-1 font-medium">{f.callsign}</td>
              <td className="px-2 py-1">{f.origin} → {f.destination}</td>
              <td className="px-2 py-1">{f.altitude.toLocaleString()}</td>
              <td className="px-2 py-1">{f.speed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
