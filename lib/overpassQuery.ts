export interface PhysicalSource {
  id: number
  lat: number
  lng: number
  name: string
  type: string
  tags: Record<string, string>
}

// Queries Overpass API for physical sources matching the AI prediction
export async function queryPhysicalSource(lat: number, lng: number, predictionId: string, radius: number = 1000): Promise<PhysicalSource[]> {

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
        way["highway"~"motorway|trunk|primary|secondary"](around:${radius}, ${lat}, ${lng});
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
      return [] // No specific physical features to search for
  }

  if (!tags) return []

  const query = `
    [out:json][timeout:10];
    (
      ${tags}
    );
    out center;
  `

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    })
    
    if (!res.ok) return []
    
    const data = await res.json()
    const elements = data.elements || []

    return elements.map((el: any) => ({
      id: el.id,
      lat: el.center ? el.center.lat : el.lat,
      lng: el.center ? el.center.lon : el.lon,
      name: el.tags?.name || (predictionId === "traffic" ? "Major Road Segment" : "Unidentified Site"),
      type: predictionId,
      tags: el.tags || {},
    }))
  } catch (err) {
    console.error("Overpass query failed:", err)
    return []
  }
}
