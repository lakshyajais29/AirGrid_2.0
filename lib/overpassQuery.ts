export interface PhysicalSource {
  id: number
  lat: number
  lng: number
  name: string
  type: string
  tags: Record<string, string>
  geometry?: { lat: number; lng: number }[]
}

// Queries the internal Next.js API proxy for physical sources matching the AI prediction
export async function queryPhysicalSource(lat: number, lng: number, predictionId: string, radius: number = 1000): Promise<PhysicalSource[]> {
  try {
    const res = await fetch(`/api/overpass?lat=${lat}&lng=${lng}&predictionId=${predictionId}&radius=${radius}`)
    
    if (!res.ok) {
      return []
    }
    
    const data = await res.json()
    return data.sources || []
  } catch (err) {
    console.warn("Failed to fetch from internal overpass proxy:", err)
    return []
  }
}
