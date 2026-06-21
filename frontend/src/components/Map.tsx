'use client';

import React, { useRef, useEffect, useState } from 'react';
import { MapPin, Crosshair, HelpCircle } from 'lucide-react';

interface MapProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lon: number) => void;
}

// Bounding box for Bengaluru coordinate space
const LAT_MIN = 12.8400;
const LAT_MAX = 13.0600;
const LON_MIN = 77.5000;
const LON_MAX = 77.7000;

// Key locations to plot on our vector map
const METRO_STATIONS = [
  { name: "Majestic Node", lat: 12.9756, lon: 77.5729, type: "metro" },
  { name: "Indiranagar Node", lat: 12.9783, lon: 77.6413, type: "metro" },
  { name: "MG Road Node", lat: 12.9754, lon: 77.6067, type: "metro" },
  { name: "Jayanagar Node", lat: 12.9287, lon: 77.5833, type: "metro" },
  { name: "Yeshwanthpur Node", lat: 13.0240, lon: 77.5499, type: "metro" },
];

const COMMERCIAL_MARKETS = [
  { name: "Commercial Street", lat: 12.9822, lon: 77.6084, type: "market" },
  { name: "KR Market", lat: 12.9647, lon: 77.5768, type: "market" },
  { name: "Koramangala Commercial Hub", lat: 12.9344, lon: 77.6113, type: "market" },
  { name: "ECity Industrial Hub", lat: 12.8447, lon: 77.6601, type: "market" },
];

const INTERSECTIONS = [
  { name: "Silk Board Junction", lat: 12.9187, lon: 77.6215, type: "junction" },
  { name: "Hebbal Flyover Junction", lat: 13.0419, lon: 77.5947, type: "junction" },
  { name: "Ibblur Junction", lat: 12.9200, lon: 77.6656, type: "junction" },
  { name: "Marathahalli Bridge", lat: 12.9570, lon: 77.6963, type: "junction" },
  { name: "Tin Factory Junction", lat: 13.0053, lon: 77.6521, type: "junction" },
];

const ALL_NODES = [...METRO_STATIONS, ...COMMERCIAL_MARKETS, ...INTERSECTIONS];

// Major roads (lines) to draw on the vector map
const ARTERIAL_ROADS = [
  // Outer Ring Road (ORR)
  [
    { lat: 13.0419, lon: 77.5947 }, // Hebbal
    { lat: 13.0053, lon: 77.6521 }, // Tin Factory
    { lat: 12.9570, lon: 77.6963 }, // Marathahalli
    { lat: 12.9200, lon: 77.6656 }, // Ibblur
    { lat: 12.9187, lon: 77.6215 }, // Silk Board
  ],
  // Hosur Road
  [
    { lat: 12.9754, lon: 77.6067 }, // MG Road
    { lat: 12.9187, lon: 77.6215 }, // Silk Board
    { lat: 12.8447, lon: 77.6601 }, // ECity
  ],
  // Mysore Road
  [
    { lat: 12.9756, lon: 77.5729 }, // Majestic
    { lat: 12.9287, lon: 77.5300 }, // Kengeri direction
  ],
  // Bellary Road
  [
    { lat: 12.9754, lon: 77.6067 }, // MG Road
    { lat: 13.0067, lon: 77.5843 }, // Mekhri Circle
    { lat: 13.0419, lon: 77.5947 }, // Hebbal
  ]
];

export default function Map({ latitude, longitude, onChange }: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverNode, setHoverNode] = useState<string | null>(null);

  // Convert lat/lon coordinates to SVG pixels
  const getCoordinates = (lat: number, lon: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    // Width and height of SVG container
    const width = 500;
    const height = 400;

    // Linear mapping
    const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * width;
    const y = height - (((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * height);
    
    return { x, y };
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = rect.width;
    const height = rect.height;

    // Convert pixel back to lat/lon
    const clickLon = LON_MIN + (clickX / width) * (LON_MAX - LON_MIN);
    const clickLat = LAT_MAX - (clickY / height) * (LAT_MAX - LAT_MIN);

    onChange(parseFloat(clickLat.toFixed(5)), parseFloat(clickLon.toFixed(5)));
  };

  const currentPos = getCoordinates(latitude, longitude);

  return (
    <div className="map-wrapper">
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-black/10">
        <div className="flex items-center gap-2">
          <Crosshair size={14} className="text-[var(--text-secondary)]" />
          <span className="text-[11px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">
            Bengaluru Command Vector Map Grid
          </span>
        </div>
        <div className="text-[11px] font-mono text-[var(--accent-signal)]">
          GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '360px', overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          className="w-full h-full cursor-crosshair select-none bg-[#050810]"
          onClick={handleMapClick}
          viewBox="0 0 500 400"
          preserveAspectRatio="none"
        >
          {/* SVG Definitions for Gradients and Markers */}
          <defs>
            <pattern id="gridPattern" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(45, 212, 212, 0.03)" strokeWidth="1" />
              <circle cx="0" cy="0" r="1.2" fill="rgba(45, 212, 212, 0.08)" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Grid Background */}
          <rect width="100%" height="100%" fill="url(#gridPattern)" />

          {/* Draw Arterial Roads */}
          {ARTERIAL_ROADS.map((road, idx) => {
            const points = road.map(p => {
              const { x, y } = getCoordinates(p.lat, p.lon);
              return `${x},${y}`;
            }).join(' ');
            
            return (
              <polyline
                key={idx}
                points={points}
                fill="none"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
          
          {/* Highlight Selected Corridor Line if matching coordinates */}
          {/* Draw plotted nodes */}
          {ALL_NODES.map((node, idx) => {
            const { x, y } = getCoordinates(node.lat, node.lon);
            const isHovered = hoverNode === node.name;
            let color = "rgba(148, 163, 184, 0.4)"; // Default secondary
            if (node.type === "metro") color = "rgba(45, 212, 212, 0.5)";
            if (node.type === "market") color = "rgba(245, 158, 11, 0.5)";
            if (node.type === "junction") color = "rgba(239, 68, 68, 0.5)";

            return (
              <g 
                key={idx}
                onMouseEnter={() => setHoverNode(node.name)}
                onMouseLeave={() => setHoverNode(null)}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(node.lat, node.lon);
                }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 8 : 4.5}
                  fill={color}
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth="1.5"
                  style={{ transition: 'all 0.2s' }}
                />
                {isHovered && (
                  <circle
                    cx={x}
                    cy={y}
                    r="14"
                    fill="none"
                    stroke={color}
                    strokeWidth="1"
                    className="animate-ping"
                    style={{ animationDuration: '2s' }}
                  />
                )}
              </g>
            );
          })}

          {/* Active Incident Beacon (Current selection pointer) */}
          {latitude && longitude && (
            <g>
              <line
                x1="0"
                y1={currentPos.y}
                x2="500"
                y2={currentPos.y}
                stroke="rgba(45, 212, 212, 0.15)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <line
                x1={currentPos.x}
                y1="0"
                x2={currentPos.x}
                y2="400"
                stroke="rgba(45, 212, 212, 0.15)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <circle
                cx={currentPos.x}
                cy={currentPos.y}
                r="10"
                fill="none"
                stroke="var(--accent-signal)"
                strokeWidth="1"
                className="animate-ping"
                style={{ animationDuration: '1.5s' }}
              />
              <circle
                cx={currentPos.x}
                cy={currentPos.y}
                r="4"
                fill="var(--accent-signal)"
                stroke="#060913"
                strokeWidth="2"
                filter="url(#glow)"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverNode && (
          <div 
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              background: 'rgba(14, 19, 36, 0.9)',
              border: '1px solid var(--border-strong)',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '11px',
              color: 'var(--text-primary)',
              backdropFilter: 'blur(4px)',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              animation: 'fade-up 0.15s ease'
            }}
          >
            <MapPin size={12} className="text-[var(--accent-signal)]" style={{ color: 'var(--accent-signal)' }} />
            <span>{hoverNode}</span>
          </div>
        )}
        
        {/* Click Instruction Tip */}
        <div 
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(6, 9, 19, 0.6)',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '9px',
            color: 'var(--text-tertiary)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <HelpCircle size={10} />
          <span>Click grid anywhere to pin new coordinate</span>
        </div>
      </div>
    </div>
  );
}
