"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issues in Leaflet with Webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface WardMapProps {
  geoJsonData: any;
  onWardClick: (ward: any) => void;
}

export default function WardMap({ geoJsonData, onWardClick }: WardMapProps) {
  // Center of Delhi
  const center: [number, number] = [28.6139, 77.2090];

  const getStyle = (feature: any) => {
    const aqi = feature.properties.aqi;
    let fillColor = "var(--safe-green)";
    if (aqi > 200) fillColor = "var(--critical-red)";
    else if (aqi > 150) fillColor = "var(--gov-gold)";
    else if (aqi > 100) fillColor = "var(--accent-teal)";

    return {
      fillColor,
      weight: 2,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.7,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 4,
          color: "#666",
          dashArray: "",
          fillOpacity: 0.9,
        });
        layer.bringToFront();
      },
      mouseout: (e: any) => {
        // Reset style
        const layer = e.target;
        layer.setStyle(getStyle(feature));
      },
      click: () => {
        onWardClick(feature.properties);
      },
    });
  };

  if (!geoJsonData) return <div className="h-[500px] w-full bg-slate-100 flex items-center justify-center">Loading map...</div>;

  return (
    <div className="h-[600px] w-full rounded-sm overflow-hidden border border-slate-200">
      <MapContainer center={center} zoom={10} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {geoJsonData && (
          <GeoJSON 
            data={geoJsonData} 
            style={getStyle} 
            onEachFeature={onEachFeature} 
          />
        )}
      </MapContainer>
    </div>
  );
}
