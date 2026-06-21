export interface Weather {
  windSpeed: number; // m/s
  windDirection: number; // degrees
  temperature: number; // Celsius
  humidity: number; // %
  visibility: number; // meters
  stability: string;
}

export interface PlumePoint {
  lat: number;
  lng: number;
  concentration: number; // µg/m³ (approx)
}

export interface AIRequest {
  prompt: string;
  context: Record<string, any>;
}

export interface ReportPayload {
  template: string;
  dateRange: { from: string; to: string };
  zones: string[];
  sections: string[];
}
