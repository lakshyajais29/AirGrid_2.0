// "use server" – this is a server‑side API route for Next.js 13 App Router
"use server"

import { promises as fs } from "fs"
import { join } from "path"

// Expected CSV format (header row):
// id,callsign,origin,destination,altitude,speed
// Example: 1,AI‑101,DEL,BOM,35000,460

export async function GET() {
  try {
    const csvPath = join(process.cwd(), "skyvigil", "data", "flights.csv")
    const file = await fs.readFile(csvPath, { encoding: "utf-8" })
    const lines = file.trim().split(/\r?\n/)
    const header = lines[0].split(",")
    const records = lines.slice(1).map((line) => {
      const cols = line.split(",")
      const rec: Record<string, any> = {}
      header.forEach((key, i) => {
        const val = cols[i]
        // Convert numeric fields
        if (key === "altitude" || key === "speed") rec[key] = Number(val)
        else rec[key] = val
      })
      return rec
    })
    return new Response(JSON.stringify(records), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (e) {
    console.error("Failed to read flights CSV", e)
    return new Response(JSON.stringify({ error: "Unable to read flights data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
