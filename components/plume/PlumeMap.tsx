"use client";

import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icon for the airport
const airportIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3125/3125713.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

function PlumeCanvasOverlay({ windDir, windSpeed, stability, emitRate }: { windDir: number, windSpeed: number, stability: string, emitRate: number }) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    // Position canvas exactly over the map container
    const updateCanvasSize = () => {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
      const topLeft = map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(canvas, topLeft);
    };

    updateCanvasSize();
    map.on('move', updateCanvasSize);
    map.on('resize', updateCanvasSize);

    // Animation Loop
    let animationId: number;
    const ctx = canvas.getContext("2d");

    const IGI_LATLNG = L.latLng(28.5562, 77.1000);

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const sourcePoint = map.latLngToContainerPoint(IGI_LATLNG);
      
      // Calculate wind vector based on direction (0 = North, 90 = East)
      // Wind direction is where the wind is coming FROM, so particles move in opposite direction
      // Actually standard wind dir: 270 (West wind) blows to East.
      const angleRad = (windDir + 180) * (Math.PI / 180);
      const spreadFactor = stability === 'A' ? 0.3 : stability === 'F' ? 0.05 : 0.15;
      
      // Emit new particles
      const particlesToEmit = Math.floor(emitRate / 10);
      for(let i=0; i<particlesToEmit; i++) {
        const spread = (Math.random() - 0.5) * spreadFactor;
        const particleAngle = angleRad + spread;
        const speed = (windSpeed * 0.5) * (0.8 + Math.random() * 0.4);
        
        particlesRef.current.push({
          x: sourcePoint.x,
          y: sourcePoint.y,
          vx: Math.sin(particleAngle) * speed,
          vy: -Math.cos(particleAngle) * speed, // Y is inverted in canvas
          life: 0,
          maxLife: 100 + Math.random() * 100
        });
      }

      // Update and draw
      const aliveParticles: Particle[] = [];
      ctx.fillStyle = "rgba(100, 100, 100, 0.4)";
      
      for(const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        
        if (p.life < p.maxLife) {
          aliveParticles.push(p);
          const alpha = 1 - (p.life / p.maxLife);
          // Particle color based on stability (A = thick/wide, F = thin/long)
          const radius = stability === 'A' ? 4 : 2;
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(30, 95, 168, ${alpha * 0.5})`; // Using mid-blue
          ctx.fill();
        }
      }
      particlesRef.current = aliveParticles;

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      map.off('move', updateCanvasSize);
      map.off('resize', updateCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, [map, windDir, windSpeed, stability, emitRate]);

  return <canvas ref={canvasRef} className="leaflet-zoom-animated" style={{ position: 'absolute', zIndex: 400, pointerEvents: 'none' }} />;
}

interface PlumeMapProps {
  windDir: number;
  windSpeed: number;
  stability: string;
  emitRate: number;
}

export default function PlumeMap({ windDir, windSpeed, stability, emitRate }: PlumeMapProps) {
  const IGI_COORDS: [number, number] = [28.5562, 77.1000];

  return (
    <div className="h-[600px] w-full rounded-sm overflow-hidden border border-slate-200 relative">
      <MapContainer center={IGI_COORDS} zoom={11} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <Marker position={IGI_COORDS} icon={airportIcon} />
        <PlumeCanvasOverlay windDir={windDir} windSpeed={windSpeed} stability={stability} emitRate={emitRate} />
      </MapContainer>
    </div>
  );
}
