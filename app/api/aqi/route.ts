import { NextResponse } from "next/server";

/* ── Delhi monitoring stations with WAQI station IDs ── */
const DELHI_STATIONS = [
  { id: "A403735", name: "Anand Vihar",  lat: 28.6469, lng: 77.3164 },
  { id: "A290270", name: "ITO",          lat: 28.6289, lng: 77.2414 },
  { id: "A290278", name: "Punjabi Bagh", lat: 28.6676, lng: 77.1290 },
  { id: "A290279", name: "RK Puram",     lat: 28.5634, lng: 77.1740 },
  { id: "A290271", name: "Dwarka",       lat: 28.5921, lng: 77.0460 },
  { id: "A290274", name: "Okhla",        lat: 28.5309, lng: 77.2710 },
  { id: "A290280", name: "Shahdara",     lat: 28.6725, lng: 77.2893 },
  { id: "A403739", name: "IGI Airport",  lat: 28.5562, lng: 77.0882 },
];

/* ── AQI color for map markers ── */
function aqiColor(aqi: number): string {
  if (aqi <= 50)  return "#55A84F";
  if (aqi <= 100) return "#A8D08D";
  if (aqi <= 200) return "#FFC000";
  if (aqi <= 300) return "#E93F33";
  return "#AF2D24";
}

/* ── Realistic mock data generator ── */
function generateMock() {
  const baselines: Record<string, { aqi: number; pm25: number; pm10: number; no2: number; co: number; o3: number; so2: number }> = {
    "Anand Vihar":  { aqi: 267, pm25: 178, pm10: 289, no2: 68, co: 1.8, o3: 22, so2: 18 },
    "ITO":          { aqi: 198, pm25: 132, pm10: 210, no2: 74, co: 2.1, o3: 18, so2: 14 },
    "Punjabi Bagh": { aqi: 185, pm25: 118, pm10: 196, no2: 52, co: 1.4, o3: 28, so2: 12 },
    "RK Puram":     { aqi: 212, pm25: 148, pm10: 230, no2: 61, co: 1.6, o3: 20, so2: 16 },
    "Dwarka":       { aqi: 156, pm25: 96,  pm10: 168, no2: 42, co: 1.1, o3: 32, so2: 10 },
    "Okhla":        { aqi: 178, pm25: 112, pm10: 192, no2: 56, co: 1.5, o3: 24, so2: 14 },
    "Shahdara":     { aqi: 234, pm25: 164, pm10: 258, no2: 64, co: 1.9, o3: 16, so2: 20 },
    "IGI Airport":  { aqi: 145, pm25: 88,  pm10: 152, no2: 48, co: 1.2, o3: 30, so2: 8  },
  };

  // Generate historical data (24h, 1h intervals)
  function makeHistory(base: number, variance: number): number[] {
    const hist: number[] = [];
    for (let i = 24; i >= 0; i--) {
      const factor = 1 + (Math.sin(i / 4) * 0.15) + (Math.random() - 0.5) * 0.1;
      hist.push(Math.round(base * factor * (variance / 100 + 0.8)));
    }
    return hist;
  }

  return DELHI_STATIONS.map((s) => {
    const b = baselines[s.name];
    const jitter = () => 1 + (Math.random() - 0.5) * 0.08;
    const aqi    = Math.round(b.aqi * jitter());
    const minutesAgo = Math.floor(Math.random() * 8);
    return {
      id:       s.id,
      name:     s.name,
      lat:      s.lat,
      lng:      s.lng,
      aqi,
      pm25:     Math.round(b.pm25 * jitter()),
      pm10:     Math.round(b.pm10 * jitter()),
      no2:      Math.round(b.no2 * jitter()),
      co:       +(b.co * jitter()).toFixed(1),
      o3:       Math.round(b.o3 * jitter()),
      so2:      Math.round(b.so2 * jitter()),
      color:    aqiColor(aqi),
      updated:  new Date(Date.now() - minutesAgo * 60_000).toISOString(),
      minutesAgo,
      history: {
        aqi:  makeHistory(b.aqi, 100),
        pm25: makeHistory(b.pm25, 90),
        pm10: makeHistory(b.pm10, 95),
        no2:  makeHistory(b.no2, 80),
        co:   makeHistory(b.co * 10, 70).map((v) => +(v / 10).toFixed(1)),
        o3:   makeHistory(b.o3, 85),
        so2:  makeHistory(b.so2, 75),
      },
    };
  });
}

/* ── Fetch live data from WAQI using lat/lng geo endpoint ── */
async function fetchLive(token: string) {
  const results = await Promise.allSettled(
    DELHI_STATIONS.map(async (s) => {
      // Use the geo-based feed endpoint — most reliable, no station ID needed
      const url = `https://api.waqi.info/feed/geo:${s.lat};${s.lng}/?token=${token}`;
      const res = await fetch(url, { next: { revalidate: 60 } });
      const json = await res.json();

      if (json.status !== "ok") {
        console.warn(`WAQI error for ${s.name}:`, json.data ?? json.status);
        throw new Error(json.data ?? "WAQI error");
      }

      const d    = json.data;
      const aqi  = typeof d.aqi === "number" ? d.aqi : 0;
      const iaqi = d.iaqi ?? {};
      const minutesAgo = Math.max(0, Math.round(
        (Date.now() - new Date(d.time?.iso ?? Date.now()).getTime()) / 60_000
      ));

      return {
        id:        s.id,
        name:      s.name,           // keep our canonical name, not WAQI's
        lat:       d.city?.geo?.[0] ?? s.lat,
        lng:       d.city?.geo?.[1] ?? s.lng,
        aqi,
        pm25:      iaqi.pm25?.v ?? null,
        pm10:      iaqi.pm10?.v ?? null,
        no2:       iaqi.no2?.v  ?? null,
        co:        iaqi.co?.v   ?? null,
        o3:        iaqi.o3?.v   ?? null,
        so2:       iaqi.so2?.v  ?? null,
        color:     aqiColor(aqi),
        updated:   d.time?.iso ?? new Date().toISOString(),
        minutesAgo,
        dominentpol: d.dominentpol ?? null,
        history:   null,  // WAQI free tier doesn't include history
      };
    })
  );

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    console.warn(`Station ${DELHI_STATIONS[i].name} failed, using mock fallback`);
    const mock = generateMock();
    return mock[i];
  });
}


/* ── GET handler ── */
export async function GET() {
  const token = process.env.WAQI_TOKEN;

  let stations;
  if (token) {
    try {
      stations = await fetchLive(token);
    } catch {
      stations = generateMock();
    }
  } else {
    stations = generateMock();
  }

  return NextResponse.json({
    stations,
    source: token ? "waqi" : "mock",
    fetchedAt: new Date().toISOString(),
  });
}
