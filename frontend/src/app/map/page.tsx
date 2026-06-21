'use client';

import React, { useState, useEffect, useRef } from 'react';
import FilterSidebar from '@/components/FilterSidebar';
import { Map, Layers, Radio, HelpCircle, Table } from 'lucide-react';

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

  const [mapStyle, setMapStyle] = useState('dark');
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
      if (val > 65) return '#ef4444'; // Red
      if (val >= 35) return '#f59e0b'; // Orange/Amber
      return '#10b981'; // Green
    }
    
    if (colorMetric === 'historical_risk_score') {
      if (val > 0.6) return '#ef4444';
      if (val > 0.25) return '#f59e0b';
      return '#3b82f6'; // Blue
    }

    if (colorMetric === 'estimated_impact_scale') {
      if (val > 7.0) return '#ef4444';
      if (val > 4.0) return '#f59e0b';
      return '#10b981';
    }

    if (colorMetric === 'time_to_resolution_minutes') {
      if (val > 120) return '#ef4444';
      if (val > 60) return '#f59e0b';
      return '#10b981';
    }

    // Default Recurrence/others
    if (val > 0.4) return '#ef4444';
    if (val > 0.1) return '#f59e0b';
    return '#10b981';
  };

  // Maps values to dot radii based on chosen sizeMetric
  const getRadiusSize = (incident: any) => {
    const val = incident[sizeMetric] || 1;
    if (sizeMetric === 'estimated_impact_scale') {
      return 2 + (val / 10) * 8; // 2px to 10px
    }
    if (sizeMetric === 'cause_priority_interaction') {
      return 2 + (val / 18) * 8; // max CPI is 18
    }
    // Spatial Overlap (0 to 3)
    return 2 + (val / 3.0) * 8;
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 84px)' }}>
      {/* Sidebar filters */}
      <FilterSidebar onApply={handleApplyFilters} isLoading={loading} />

      {/* Main Map Cockpit */}
      <main className="main-content" style={{ flex: '1', padding: '24px', overflowY: 'auto' }}>
        
        {/* Title */}
        <div className="title-section">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Map size={28} className="text-[var(--accent-signal)]" style={{ color: 'var(--accent-signal)' }} />
            <span>Spatial Congestion Intelligence Map</span>
          </h1>
          <p>Analyze density-based hotspots, spatial overlaps, and localized incident metrics.</p>
        </div>

        {/* Map Grid Layout */}
        <div className="dashboard-grid">
          
          {/* Controls Card */}
          <div className="card col-4">
            <div className="card-title">
              <Layers size={15} style={{ color: 'var(--accent-signal)' }} />
              <span>Map Visual Overlays</span>
            </div>

            <div className="form-group">
              <label>Coloring Metric</label>
              <select value={colorMetric} onChange={(e) => setColorMetric(e.target.value)}>
                <option value="congestion_surge_index">Congestion Surge Index</option>
                <option value="historical_risk_score">Historical Risk Score</option>
                <option value="estimated_impact_scale">Estimated Impact Scale</option>
                <option value="time_to_resolution_minutes">Time to Resolution (min)</option>
                <option value="event_recurrence_frequency">Recurrence Frequency</option>
              </select>
            </div>

            <div className="form-group">
              <label>Marker Sizing Metric</label>
              <select value={sizeMetric} onChange={(e) => setSizeMetric(e.target.value)}>
                <option value="estimated_impact_scale">Estimated Impact Scale</option>
                <option value="cause_priority_interaction">Cause Priority Interaction</option>
                <option value="multi_incident_overlap_score">Multi-Incident Spatial Overlap</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px' }}>
              <label>Infrastructure Overlays</label>
              
              <div className="checkbox-group" onClick={() => setShowMetro(!showMetro)} style={{ padding: '8px 12px' }}>
                <input type="checkbox" checked={showMetro} readOnly />
                <span className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ffcc' }}></span>
                  Metro Stations Node
                </span>
              </div>

              <div className="checkbox-group" onClick={() => setShowMarket(!showMarket)} style={{ padding: '8px 12px' }}>
                <input type="checkbox" checked={showMarket} readOnly />
                <span className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffd166' }}></span>
                  Commercial Hubs / Markets
                </span>
              </div>

              <div className="checkbox-group" onClick={() => setShowIsect(!showIsect)} style={{ padding: '8px 12px' }}>
                <input type="checkbox" checked={showIsect} readOnly />
                <span className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#80aaff' }}></span>
                  Critical Intersections
                </span>
              </div>
            </div>

            {/* Threshold Legend */}
            <div style={{ marginTop: '20px', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Color Scale Legend
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                  <span>Low Surge / Risk (Normal Flow)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                  <span>Moderate Congestion (Warning)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                  <span>Severe Bottleneck (Critical Alert)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Plot Map */}
          <div className="card col-8" style={{ display: 'flex', flexDirection: 'column', minHeight: '440px', padding: '0', overflow: 'hidden' }}>
            
            {/* Map Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.1)' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                Active Incident Nodes Map (Total: {data.incidents.length})
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                Hover points for details
              </span>
            </div>

            {/* SVG Visualizer Map */}
            <div style={{ position: 'relative', flex: '1', background: '#050711', minHeight: '380px' }}>
              <svg
                ref={svgRef}
                viewBox="0 0 500 400"
                className="w-full h-full select-none"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Infrastructure Overlays */}
                {showMetro && Object.entries(METRO_STATIONS).map(([name, coords]) => {
                  const { x, y } = getCoordinates(coords[0], coords[1]);
                  return (
                    <g key={name}>
                      <circle cx={x} cy={y} r="5" fill="#00ffcc" opacity="0.6" />
                      <circle cx={x} cy={y} r="10" fill="none" stroke="#00ffcc" strokeWidth="0.5" opacity="0.3" className="animate-ping" style={{ animationDuration: '3s' }} />
                    </g>
                  );
                })}

                {showMarket && Object.entries(COMMERCIAL_MARKETS).map(([name, coords]) => {
                  const { x, y } = getCoordinates(coords[0], coords[1]);
                  return <circle key={name} cx={x} cy={y} r="5" fill="#ffd166" opacity="0.6" />;
                })}

                {showIsect && Object.entries(INTERSECTIONS).map(([name, coords]) => {
                  const { x, y } = getCoordinates(coords[0], coords[1]);
                  return <polygon key={name} points={`${x},${y-5} ${x+4},${y+3} ${x-4},${y+3}`} fill="#80aaff" opacity="0.6" />;
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
                      opacity="0.8"
                      stroke="rgba(0,0,0,0.5)"
                      strokeWidth="0.5"
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
                        stroke="rgba(239, 68, 68, 0.25)"
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r="3"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Hover Box Info Overlay */}
              {hoverDetail && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(14, 19, 36, 0.95)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    fontSize: '11px',
                    color: 'var(--text-primary)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    maxWidth: '240px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 10
                  }}
                  onMouseLeave={() => setHoverDetail(null)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px', marginBottom: '4px', fontWeight: '700' }}>
                    <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '140px' }}>{hoverDetail.road_name}</span>
                    <span style={{ color: 'var(--accent-signal)' }}>#{hoverDetail.id}</span>
                  </div>
                  <div>Cause: <strong style={{ textTransform: 'capitalize' }}>{hoverDetail.event_cause.replace('_', ' ')}</strong></div>
                  <div>Surge Index: <strong>{hoverDetail.congestion_surge_index.toFixed(1)}%</strong></div>
                  <div>Risk Score: <strong>{hoverDetail.historical_risk_score.toFixed(3)}</strong></div>
                  <div>Resolution Time: <strong>{hoverDetail.time_to_resolution_minutes} min</strong></div>
                  <div>Vulnerability Tier: <strong>{hoverDetail.corridor_vulnerability_tier}</strong></div>
                  {hoverDetail.hotspot_id !== -1 && (
                    <div style={{ color: 'var(--accent-critical)', fontWeight: '600' }}>In Hotspot #{hoverDetail.hotspot_id}</div>
                  )}
                  <button 
                    onClick={() => setHoverDetail(null)} 
                    style={{ border: 'none', background: 'none', color: 'var(--text-tertiary)', fontSize: '9px', textAlign: 'right', marginTop: '6px', cursor: 'pointer' }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* 3D Hotspot Intensity list */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-title">
            <Radio size={16} className="text-accent-critical" style={{ color: 'var(--accent-critical)' }} />
            <span>3D Hotspot Intensity Volume (Centroids)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'center' }}>
            
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
                Spatial clustering algorithms (DBSCAN) group high-density points.
                <strong> Cumulative Surge Index</strong> is calculated by summing active congestion indexes inside each bottleneck.
              </p>
              
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.03)', border: '1px dashed rgba(239, 68, 68, 0.15)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                Centroid coordinates represent the midpoints of bottlenecks. Strategic deployments should prioritize high-density clusters.
              </div>
            </div>

            {/* Hotspots Centroid list */}
            {data.hotspots.length > 0 ? (
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Hotspot ID</th>
                      <th>Incidents Count</th>
                      <th>Mean Surge Index</th>
                      <th>Total Surge Index</th>
                      <th>Centroid Coordinates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.hotspots.map((h: any) => (
                      <tr key={h.hotspot_id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--accent-critical)' }}>
                          #{h.hotspot_id}
                        </td>
                        <td>{h.incident_count} active</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{h.mean_surge_index.toFixed(1)}%</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{h.total_surge_index.toFixed(0)}%</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          {h.centroid_latitude.toFixed(4)}, {h.centroid_longitude.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-tertiary)', border: '1px dashed var(--border-subtle)', borderRadius: '6px' }}>
                No active hotspots found under current filters or cluster settings. Loosen filters or decrease DBSCAN Min Cluster Size.
              </div>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}
