import { NextResponse } from "next/server"

export interface PhysicalSource {
  id: number
  lat: number
  lng: number
  name: string
  type: string
  tags: Record<string, string>
  geometry?: { lat: number; lng: number }[]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const latParam = searchParams.get("lat")
  const lngParam = searchParams.get("lng")
  const predictionId = searchParams.get("predictionId")
  const radiusParam = searchParams.get("radius") || "1000"

  if (!latParam || !lngParam || !predictionId) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  const lat = parseFloat(latParam)
  const lng = parseFloat(lngParam)
  const radius = parseFloat(radiusParam)

  let tags = ""
  switch (predictionId) {
    case "industrial":
      tags = `
        node["landuse"="industrial"](around:${radius}, ${lat}, ${lng});
        way["landuse"="industrial"](around:${radius}, ${lat}, ${lng});
        node["man_made"="works"](around:${radius}, ${lat}, ${lng});
        way["man_made"="works"](around:${radius}, ${lat}, ${lng});
      `
      break
    case "construction":
      tags = `
        node["landuse"="construction"](around:${radius}, ${lat}, ${lng});
        way["landuse"="construction"](around:${radius}, ${lat}, ${lng});
        node["building"="construction"](around:${radius}, ${lat}, ${lng});
        way["building"="construction"](around:${radius}, ${lat}, ${lng});
      `
      break
    case "agri_burning":
      tags = `
        node["landuse"="farmland"](around:${radius}, ${lat}, ${lng});
        way["landuse"="farmland"](around:${radius}, ${lat}, ${lng});
        node["landuse"="meadow"](around:${radius}, ${lat}, ${lng});
        way["landuse"="meadow"](around:${radius}, ${lat}, ${lng});
      `
      break
    case "traffic":
      tags = `
        way["highway"~"motorway|trunk|primary|secondary|tertiary|unclassified|residential|service"](around:${radius}, ${lat}, ${lng});
        node["highway"~"motorway_junction"](around:${radius}, ${lat}, ${lng});
      `
      break
    case "burning":
      tags = `
        node["amenity"="waste_disposal"](around:${radius}, ${lat}, ${lng});
        way["amenity"="waste_disposal"](around:${radius}, ${lat}, ${lng});
        node["landuse"="landfill"](around:${radius}, ${lat}, ${lng});
        way["landuse"="landfill"](around:${radius}, ${lat}, ${lng});
      `
      break
    default:
      return NextResponse.json({ sources: [] })
  }

  if (!tags) {
    return NextResponse.json({ sources: [] })
  }

  const query = `
    [out:json][timeout:10];
    (
      ${tags}
    );
    out geom;
  `

  const encodedQuery = encodeURIComponent(query)
  const endpoints = [
    `https://maps.mail.ru/osm/tools/overpass/api/interpreter?data=${encodedQuery}`,
    `https://overpass.openstreetmap.ru/api/interpreter?data=${encodedQuery}`,
    `https://lz4.overpass-api.de/api/interpreter?data=${encodedQuery}`,
  ]

  let lastError: any = null

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000) // 4s timeout

      const res = await fetch(endpoint, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "AirGrid-OS-Backend/1.0"
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!res.ok) {
        if (res.status === 429) continue // rate limited, try next mirror
        continue // try next on other errors
      }
      
      const data = await res.json()
      const elements = data.elements || []

      const parsedSources: PhysicalSource[] = elements.map((el: any) => {
        let centerLat = el.lat, centerLng = el.lon
        if (el.type === "way") {
          if (el.bounds) {
            centerLat = (el.bounds.minlat + el.bounds.maxlat) / 2
            centerLng = (el.bounds.minlon + el.bounds.maxlon) / 2
          } else if (el.geometry && el.geometry.length > 0) {
            centerLat = el.geometry[0].lat
            centerLng = el.geometry[0].lon
          }
        }

        let geometry
        if (el.geometry) {
          geometry = el.geometry.map((pt: any) => ({ lat: pt.lat, lng: pt.lon }))
        }

        return {
          id: el.id,
          lat: centerLat || 0,
          lng: centerLng || 0,
          name: el.tags?.name || (predictionId === "traffic" ? "Major Road Segment" : "Unidentified Site"),
          type: predictionId,
          tags: el.tags || {},
          geometry
        }
      }).filter((s: PhysicalSource) => s.lat !== 0 && s.lng !== 0)

      return NextResponse.json({ sources: parsedSources })

    } catch (err) {
      lastError = err
      continue // loop to next endpoint on network failure
    }
  }

  console.warn("[Backend] All Overpass API endpoints failed:", lastError)
  return NextResponse.json({ sources: [] }, { status: 502 }) // Bad Gateway
}
