'use client';

import React, { useRef, useState } from 'react';
import { MapPin, Crosshair, HelpCircle } from 'lucide-react';

interface MapProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lon: number) => void;
}

const LAT_MIN = 12.8400;
const LAT_MAX = 13.0600;
const LON_MIN = 77.5000;
const LON_MAX = 77.7000;

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

const ARTERIAL_ROADS = [
  [
    { lat: 13.0419, lon: 77.5947 },
    { lat: 13.0053, lon: 77.6521 },
    { lat: 12.9570, lon: 77.6963 },
    { lat: 12.9200, lon: 77.6656 },
    { lat: 12.9187, lon: 77.6215 },
  ],
  [
    { lat: 12.9754, lon: 77.6067 },
    { lat: 12.9187, lon: 77.6215 },
    { lat: 12.8447, lon: 77.6601 },
  ],
  [
    { lat: 12.9756, lon: 77.5729 },
    { lat: 12.9287, lon: 77.5300 },
  ],
  [
    { lat: 12.9754, lon: 77.6067 },
    { lat: 13.0067, lon: 77.5843 },
    { lat: 13.0419, lon: 77.5947 },
  ]
];

export default function Map({ latitude, longitude, onChange }: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverNode, setHoverNode] = useState<string | null>(null);

  const getCoordinates = (lat: number, lon: number) => {
    const width = 500;
    const height = 400;
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
    const clickLon = LON_MIN + (clickX / width) * (LON_MAX - LON_MIN);
    const clickLat = LAT_MAX - (clickY / height) * (LAT_MAX - LAT_MIN);
    onChange(parseFloat(clickLat.toFixed(5)), parseFloat(clickLon.toFixed(5)));
  };

  const currentPos = getCoordinates(latitude, longitude);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
        <div className="flex items-center gap-2">
          <Crosshair size={14} className="text-[#9CA3AF]" />
          <span className="text-[11px] uppercase tracking-widest text-[#6B7280] font-semibold">
            Bengaluru Vector Map
          </span>
        </div>
        <div className="text-[11px] font-mono text-[#111111]">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </div>
      </div>

      {/* SVG Map */}
      <div className="relative w-full h-[360px] overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-crosshair select-none bg-[#F9FAFB]"
          onClick={handleMapClick}
          viewBox="0 0 500 400"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="gridPattern" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#E5E7EB" strokeWidth="0.5" />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#gridPattern)" />

          {/* Arterial Roads */}
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
                stroke="#D1D5DB"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
          
          {/* Nodes */}
          {ALL_NODES.map((node, idx) => {
            const { x, y } = getCoordinates(node.lat, node.lon);
            const isHovered = hoverNode === node.name;
            let color = "#9CA3AF";
            if (node.type === "metro") color = "#111111";
            if (node.type === "market") color = "#6B7280";
            if (node.type === "junction") color = "#374151";

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
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  style={{ transition: 'all 0.2s' }}
                />
              </g>
            );
          })}

          {/* Active Crosshair */}
          {latitude && longitude && (
            <g>
              <line x1="0" y1={currentPos.y} x2="500" y2={currentPos.y} stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3,3" />
              <line x1={currentPos.x} y1="0" x2={currentPos.x} y2="400" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx={currentPos.x} cy={currentPos.y} r="6" fill="#111111" stroke="#FFFFFF" strokeWidth="2" />
            </g>
          )}
        </svg>

        {/* Hover Tooltip */}
        {hoverNode && (
          <div className="absolute bottom-3 left-3 bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#111111] shadow-md pointer-events-none flex items-center gap-1.5 animate-fade-in">
            <MapPin size={12} className="text-[#6B7280]" />
            <span className="font-medium">{hoverNode}</span>
          </div>
        )}
        
        {/* Click Tip */}
        <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-md px-2 py-1 text-[9px] text-[#9CA3AF] pointer-events-none flex items-center gap-1">
          <HelpCircle size={10} />
          <span>Click to pin coordinate</span>
        </div>
      </div>
    </div>
  );
}
