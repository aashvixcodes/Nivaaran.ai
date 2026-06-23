'use client';

import React, { useState, useEffect, useRef } from 'react';
import FilterSidebar from '@/components/FilterSidebar';
import { Map as MapIcon, Layers, Radio, HelpCircle, Table, Activity } from 'lucide-react';

const LAT_MIN = 12.8400;
const LAT_MAX = 13.0600;
const LON_MIN = 77.5000;
const LON_MAX = 77.7000;

// Infrastructure constants
const METRO_STATIONS = {
  "Majestic": [12.9756, 77.5729],
  "Indiranagar": [12.9783, 77.6413],
  "MG Road": [12.9754, 77.6067],
  "Jayanagar": [12.9287, 77.5833],
  "Yeshwanthpur": [13.0240, 77.5499],
  "Rajajinagar": [12.9929, 77.5479],
  "Nagasandra": [13.0324, 77.5148],
  "Baiyappanahalli": [12.9985, 77.6483]
};

const COMMERCIAL_MARKETS = {
  "Commercial Street": [12.9822, 77.6084],
  "Brigade Road": [12.9739, 77.6074],
  "KR Market": [12.9647, 77.5768],
  "Phoenix Marketcity": [12.9959, 77.6963],
  "Forum Koramangala": [12.9344, 77.6113],
  "Mantri Mall": [13.0025, 77.5695],
  "Garuda Mall": [12.9717, 77.6099],
  "ECity Centre": [12.8447, 77.6601]
};

const INTERSECTIONS = {
  "Silk Board": [12.9187, 77.6215],
  "Hebbal Flyover": [13.0419, 77.5947],
  "Urvashi Junction": [12.9556, 77.5857],
  "Lalbagh Main Gate": [12.9540, 77.5852],
  "Ibblur Junction": [12.9200, 77.6656],
  "Town Hall": [12.9640, 77.5830],
  "KR Circle": [12.9747, 77.5937],
  "Marathahalli Bridge": [12.9570, 77.6963],
  "Tin Factory": [13.0053, 77.6521],
  "Mekhri Circle": [13.0067, 77.5843]
};

export default function CongestionMapPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Filters & Page settings
  const [filters, setFilters] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({ incidents: [], hotspots: [], summary: {} });

  const [mapStyle, setMapStyle] = useState('light');
  const [colorMetric, setColorMetric] = useState('congestion_surge_index');
  const [sizeMetric, setSizeMetric] = useState('estimated_impact_scale');
  
  const [showMetro, setShowMetro] = useState(true);
  const [showMarket, setShowMarket] = useState(true);
  const [showIsect, setShowIsect] = useState(true);
  
  const [hoverDetail, setHoverDetail] = useState<any>(null);

  const fetchMapData = (currentFilters: any) => {
    setLoading(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    fetch(`${apiBase}/analytics-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentFilters)
    })
      .then(res => res.json())
      .then(resData => {
        setData(resData);
      })
      .catch(err => {
        console.error("Failed to fetch map data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
    fetchMapData(newFilters);
  };

  // Convert GPS coordinates to local SVG viewBox X, Y
  const getCoordinates = (lat: number, lon: number) => {
    const width = 500;
    const height = 400;
    const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * width;
    const y = height - (((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * height);
    return { x, y };
  };

  // Maps values to colors based on the chosen colorMetric
  const getColorValue = (incident: any) => {
    const val = incident[colorMetric];
    
    if (colorMetric === 'congestion_surge_index') {
      if (val > 65) return '#EF4444'; // Red
      if (val >= 35) return '#F59E0B'; // Amber
      return '#10B981'; // Green
    }
    
    if (colorMetric === 'historical_risk_score') {
      if (val > 0.6) return '#EF4444';
      if (val > 0.25) return '#F59E0B';
      return '#3B82F6'; // Blue
    }

    if (colorMetric === 'estimated_impact_scale') {
      if (val > 7.0) return '#EF4444';
      if (val > 4.0) return '#F59E0B';
      return '#10B981';
    }

    if (colorMetric === 'time_to_resolution_minutes') {
      if (val > 120) return '#EF4444';
      if (val > 60) return '#F59E0B';
      return '#10B981';
    }

    // Default Recurrence/others
    if (val > 0.4) return '#EF4444';
    if (val > 0.1) return '#F59E0B';
    return '#10B981';
  };

  // Maps values to dot radii based on chosen sizeMetric
  const getRadiusSize = (incident: any) => {
    const val = incident[sizeMetric] || 1;
    if (sizeMetric === 'estimated_impact_scale') {
      return 3 + (val / 10) * 8; // 3px to 11px
    }
    if (sizeMetric === 'cause_priority_interaction') {
      return 3 + (val / 18) * 8; // max CPI is 18
    }
    // Spatial Overlap (0 to 3)
    return 3 + (val / 3.0) * 8;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
      {/* Sidebar filters */}
      <FilterSidebar onApply={handleApplyFilters} isLoading={loading} />

      {/* Main Map Cockpit */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-7xl mx-auto w-full animate-fade-in">
        
        {/* Title */}
        <div className="mb-8 pb-6 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2 mb-2">
            <MapIcon size={18} className="text-[#111111]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Spatial Analysis</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111111] mb-2">
            Spatial Congestion Intelligence Map
          </h1>
          <p className="text-sm text-[#6B7280]">Analyze density-based hotspots, spatial overlaps, and localized incident metrics.</p>
        </div>

        {/* Map Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
          
          {/* Controls Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm xl:col-span-4 flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Layers size={15} className="text-[#111111]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#111111]">Map Visual Overlays</span>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Coloring Metric</label>
                  <select 
                    value={colorMetric} 
                    onChange={(e) => setColorMetric(e.target.value)}
                    className="w-full text-xs"
                  >
                    <option value="congestion_surge_index">Congestion Surge Index</option>
                    <option value="historical_risk_score">Historical Risk Score</option>
                    <option value="estimated_impact_scale">Estimated Impact Scale</option>
                    <option value="time_to_resolution_minutes">Time to Resolution (min)</option>
                    <option value="event_recurrence_frequency">Recurrence Frequency</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Marker Sizing Metric</label>
                  <select 
                    value={sizeMetric} 
                    onChange={(e) => setSizeMetric(e.target.value)}
                    className="w-full text-xs"
                  >
                    <option value="estimated_impact_scale">Estimated Impact Scale</option>
                    <option value="cause_priority_interaction">Cause Priority Interaction</option>
                    <option value="multi_incident_overlap_score">Multi-Incident Spatial Overlap</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-[#F3F4F6] pt-4">
              <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-3 block">Infrastructure Overlays</label>
              
              <div className="space-y-2">
                <label 
                  onClick={() => setShowMetro(!showMetro)} 
                  className="flex items-center gap-3 px-3 py-2 border border-[#E5E7EB] bg-[#F9FAFB] rounded-lg cursor-pointer hover:bg-white transition-all duration-150 text-xs font-medium text-[#374151]"
                >
                  <input type="checkbox" checked={showMetro} readOnly className="rounded border-[#D1D5DB]" />
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                    Metro Stations
                  </span>
                </label>

                <label 
                  onClick={() => setShowMarket(!showMarket)} 
                  className="flex items-center gap-3 px-3 py-2 border border-[#E5E7EB] bg-[#F9FAFB] rounded-lg cursor-pointer hover:bg-white transition-all duration-150 text-xs font-medium text-[#374151]"
                >
                  <input type="checkbox" checked={showMarket} readOnly className="rounded border-[#D1D5DB]" />
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                    Commercial Hubs
                  </span>
                </label>

                <label 
                  onClick={() => setShowIsect(!showIsect)} 
                  className="flex items-center gap-3 px-3 py-2 border border-[#E5E7EB] bg-[#F9FAFB] rounded-lg cursor-pointer hover:bg-white transition-all duration-150 text-xs font-medium text-[#374151]"
                >
                  <input type="checkbox" checked={showIsect} readOnly className="rounded border-[#D1D5DB]" />
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span>
                    Critical Intersections
                  </span>
                </label>
              </div>
            </div>

            {/* Threshold Legend */}
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 mt-2">
              <span className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider block mb-3">Color Scale Legend</span>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#4B5563]">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0"></span>
                  <span>Low Surge / Risk (Normal Flow)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#4B5563]">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0"></span>
                  <span>Moderate Congestion (Warning)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#4B5563]">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0"></span>
                  <span>Severe Bottleneck (Critical Alert)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Plot Map */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm xl:col-span-8 flex flex-col min-h-[440px]">
            
            {/* Map Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                Active Incident Nodes Map (Total: {data.incidents.length})
              </span>
              <span className="text-[10px] text-[#9CA3AF] font-medium">
                Hover points for detailed telemetry
              </span>
            </div>

            {/* SVG Visualizer Map */}
            <div className="relative flex-1 bg-[#FAFAFA] min-h-[380px] border-b border-[#E5E7EB]">
              <svg
                ref={svgRef}
                viewBox="0 0 500 400"
                className="w-full h-full select-none"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern id="light-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5E7EB" strokeWidth="0.5" opacity="0.6" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#light-grid)" />

                {/* Infrastructure Overlays */}
                {showMetro && Object.entries(METRO_STATIONS).map(([name, coords]) => {
                  const { x, y } = getCoordinates(coords[0], coords[1]);
                  return (
                    <g key={name}>
                      <circle cx={x} cy={y} r="5" fill="#10B981" opacity="0.6" />
                      <circle cx={x} cy={y} r="12" fill="none" stroke="#10B981" strokeWidth="0.5" opacity="0.4" className="animate-ping" style={{ animationDuration: '3s' }} />
                    </g>
                  );
                })}

                {showMarket && Object.entries(COMMERCIAL_MARKETS).map(([name, coords]) => {
                  const { x, y } = getCoordinates(coords[0], coords[1]);
                  return <circle key={name} cx={x} cy={y} r="5" fill="#F59E0B" opacity="0.6" />;
                })}

                {showIsect && Object.entries(INTERSECTIONS).map(([name, coords]) => {
                  const { x, y } = getCoordinates(coords[0], coords[1]);
                  return <polygon key={name} points={`${x},${y-5} ${x+4},${y+3} ${x-4},${y+3}`} fill="#3B82F6" opacity="0.6" />;
                })}

                {/* Plot Incidents */}
                {data.incidents.map((inc: any) => {
                  const { x, y } = getCoordinates(inc.latitude, inc.longitude);
                  const color = getColorValue(inc);
                  const radius = getRadiusSize(inc);

                  return (
                    <circle
                      key={inc.id}
                      cx={x}
                      cy={y}
                      r={radius}
                      fill={color}
                      opacity="0.85"
                      stroke="#FFFFFF"
                      strokeWidth="0.75"
                      className="transition-all hover:opacity-100 hover:scale-125 cursor-pointer"
                      onMouseEnter={() => setHoverDetail(inc)}
                    />
                  );
                })}

                {/* Plot Hotspot centroid circles */}
                {data.hotspots.map((h: any) => {
                  const { x, y } = getCoordinates(h.centroid_latitude, h.centroid_longitude);
                  return (
                    <g key={h.hotspot_id}>
                      <circle
                        cx={x}
                        cy={y}
                        r={Math.max(12, h.incident_count * 1.5)}
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="1.25"
                        strokeDasharray="3,3"
                        opacity="0.5"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Hover Box Info Overlay */}
              {hoverDetail && (
                <div
                  className="absolute top-4 left-4 bg-white border border-[#E5E7EB] rounded-lg p-4 text-xs text-[#111111] shadow-lg max-w-[260px] flex flex-col gap-2 z-10"
                  onMouseLeave={() => setHoverDetail(null)}
                >
                  <div className="flex justify-between items-center border-b border-[#F3F4F6] pb-2 font-bold">
                    <span className="truncate max-w-[170px] text-[#111111]">{hoverDetail.road_name}</span>
                    <span className="text-[#6B7280] font-mono">#{hoverDetail.id}</span>
                  </div>
                  <div className="space-y-1 text-[#374151]">
                    <div>Cause: <strong className="capitalize text-[#111111]">{hoverDetail.event_cause.replace('_', ' ')}</strong></div>
                    <div>Surge Index: <strong>{hoverDetail.congestion_surge_index.toFixed(1)}%</strong></div>
                    <div>Risk Score: <strong>{hoverDetail.historical_risk_score.toFixed(3)}</strong></div>
                    <div>Resolution Time: <strong>{hoverDetail.time_to_resolution_minutes} min</strong></div>
                    <div>Vulnerability Tier: <strong>{hoverDetail.corridor_vulnerability_tier}</strong></div>
                    {hoverDetail.hotspot_id !== -1 && (
                      <div className="text-[#EF4444] font-semibold text-[10px] uppercase tracking-wider mt-1">In Hotspot #{hoverDetail.hotspot_id}</div>
                    )}
                  </div>
                  <button 
                    onClick={() => setHoverDetail(null)} 
                    className="border-0 bg-transparent text-[#9CA3AF] text-[9px] font-semibold tracking-wider text-right mt-2 hover:text-[#6B7280] cursor-pointer"
                  >
                    DISMISS
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* DBSCAN Hotspots list */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#F3F4F6]">
            <Radio size={16} className="text-[#EF4444]" />
            <h2 className="text-sm font-semibold text-[#111111]">3D Hotspot Intensity Volume (Centroids)</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            <div className="lg:col-span-1 space-y-4">
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Spatial clustering algorithms (DBSCAN) group high-density points.
                <strong> Cumulative Surge Index</strong> is calculated by summing active congestion indexes inside each bottleneck.
              </p>
              
              <div className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg text-[11px] text-[#6B7280] leading-relaxed">
                Centroid coordinates represent the midpoints of bottlenecks. Strategic deployments should prioritize high-density clusters.
              </div>
            </div>

            {/* Hotspots Centroid list */}
            <div className="lg:col-span-2">
              {data.hotspots.length > 0 ? (
                <div className="max-h-[220px] overflow-y-auto border border-[#E5E7EB] rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                        <th className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] px-4 py-3">Hotspot ID</th>
                        <th className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] px-4 py-3">Incidents Count</th>
                        <th className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] px-4 py-3">Mean Surge Index</th>
                        <th className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] px-4 py-3">Total Surge Index</th>
                        <th className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] px-4 py-3">Centroid Coordinates</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {data.hotspots.map((h: any) => (
                        <tr key={h.hotspot_id} className="hover:bg-[#F9FAFB]">
                          <td className="px-4 py-3 text-xs font-mono font-bold text-[#EF4444]">
                            #{h.hotspot_id}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#374151]">{h.incident_count} active</td>
                          <td className="px-4 py-3 text-xs font-mono text-[#4B5563]">{h.mean_surge_index.toFixed(1)}%</td>
                          <td className="px-4 py-3 text-xs font-mono font-bold text-[#111111]">{h.total_surge_index.toFixed(0)}%</td>
                          <td className="px-4 py-3 text-xs font-mono text-[#6B7280]">
                            {h.centroid_latitude.toFixed(4)}, {h.centroid_longitude.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#9CA3AF] border border-dashed border-[#E5E7EB] rounded-lg">
                  No active hotspots found under current filters or cluster settings. Loosen filters or decrease DBSCAN Min Cluster Size.
                </div>
              )}
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
