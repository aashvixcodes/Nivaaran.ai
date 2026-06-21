'use client';

import React, { useState, useEffect } from 'react';
import { ScanEye, Play, ShieldAlert, Navigation, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import Map from '@/components/Map';
import Gauge from '@/components/Gauge';

interface Preset {
  name: string;
  desc: string;
  badge: string;
  badgeColor: string;
  color: string;
  data: any;
}

const PRESET_SCENARIOS: Preset[] = [
  {
    name: "Cricket at Chinnaswamy",
    desc: "IPL match event, Friday rush hour",
    badge: "Critical",
    badgeColor: "var(--accent-critical-bg)",
    color: "var(--accent-critical)",
    data: {
      road_name: "MG Road",
      latitude: 12.9754,
      longitude: 77.6067,
      event_type: "planned",
      event_cause: "public_event",
      priority: "High",
      status: "active",
      corridor: "Non-corridor",
      estimated_impact_scale: 9.0,
      requires_road_closure: true,
      start_time: "18:00",
      day_of_week: "Friday",
      planned_event_lead_time_hours: 12.0
    }
  },
  {
    name: "ORR Heavy Breakdown",
    desc: "Truck breakdown, Monday morning peak",
    badge: "High",
    badgeColor: "rgba(245, 158, 11, 0.15)",
    color: "var(--accent-warning)",
    data: {
      road_name: "Marathahalli Bridge",
      latitude: 12.9570,
      longitude: 77.6963,
      event_type: "unplanned",
      event_cause: "vehicle_breakdown",
      priority: "High",
      status: "active",
      corridor: "ORR East 1",
      estimated_impact_scale: 7.0,
      requires_road_closure: false,
      start_time: "09:00",
      day_of_week: "Monday",
      planned_event_lead_time_hours: 0.0
    }
  },
  {
    name: "Procession in CBD",
    desc: "Religious procession, Sunday afternoon",
    badge: "Medium",
    badgeColor: "rgba(245, 158, 11, 0.15)",
    color: "var(--accent-warning)",
    data: {
      road_name: "Brigade Road",
      latitude: 12.9739,
      longitude: 77.6074,
      event_type: "planned",
      event_cause: "procession",
      priority: "Low",
      status: "active",
      corridor: "Non-corridor",
      estimated_impact_scale: 5.0,
      requires_road_closure: true,
      start_time: "14:00",
      day_of_week: "Sunday",
      planned_event_lead_time_hours: 6.0
    }
  },
  {
    name: "Road Work - Off Peak",
    desc: "Midnight utility repairs, midweek",
    badge: "Low",
    badgeColor: "var(--accent-normal-bg)",
    color: "var(--accent-normal)",
    data: {
      road_name: "Mysore Road",
      latitude: 12.9600,
      longitude: 77.5300,
      event_type: "planned",
      event_cause: "construction",
      priority: "Low",
      status: "active",
      corridor: "Mysore Road",
      estimated_impact_scale: 3.0,
      requires_road_closure: false,
      start_time: "02:00",
      day_of_week: "Wednesday",
      planned_event_lead_time_hours: 24.0
    }
  }
];

export default function PredictPage() {
  // Form parameters
  const [roadName, setRoadName] = useState('MG Road');
  const [lat, setLat] = useState(12.9754);
  const [lon, setLon] = useState(77.6067);
  const [eventType, setEventType] = useState('planned');
  const [eventCause, setEventCause] = useState('public_event');
  const [priority, setPriority] = useState('High');
  const [status, setStatus] = useState('active');
  const [corridor, setCorridor] = useState('Non-corridor');
  const [impactScale, setImpactScale] = useState(5.0);
  const [requiresClosure, setRequiresClosure] = useState(false);
  const [startTime, setStartTime] = useState('12:00');
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [leadTime, setLeadTime] = useState(12.0);

  // Metadata dropdown state (falls back to hardcoded lists if API not reachable)
  const [metadata, setMetadata] = useState<any>({
    roads: ["MG Road", "Brigade Road", "Commercial Street", "Koramangala", "Indiranagar", "Marathahalli Bridge", "Silk Board", "Hebbal Flyover", "Mysore Road", "Kengeri", "Electronic City"],
    causes: ["accident", "vehicle_breakdown", "pot_holes", "water_logging", "construction", "congestion", "tree_fall", "road_conditions", "vip_movement", "public_event", "procession", "protest", "others"],
    corridors: ["Non-corridor", "Mysore Road", "Bellary Road 1", "Bellary Road 2", "Hosur Road", "Tumkur Road", "Old Madras Road", "ORR East 1", "ORR East 2", "ORR North 1", "ORR North 2", "Magadi Road"],
    road_coords: {}
  });

  // Output prediction state
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch metadata from backend API
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    fetch(`${apiBase}/metadata`)
      .then(res => {
        if (!res.ok) throw new Error("API unreachable");
        return res.json();
      })
      .then(data => {
        setMetadata(data);
      })
      .catch(err => {
        console.warn("FastAPI backend metadata fetch failed. Using fallback lists. Err:", err);
      });
  }, []);

  // Update coordinates when road is changed
  const handleRoadChange = (road: string) => {
    setRoadName(road);
    if (metadata.road_coords && metadata.road_coords[road]) {
      const coords = metadata.road_coords[road];
      setLat(coords.latitude);
      setLon(coords.longitude);
      if (coords.corridor) setCorridor(coords.corridor);
    }
  };

  // Map coordinate clicks back to page form
  const handleMapChange = (clickedLat: number, clickedLon: number) => {
    setLat(clickedLat);
    setLon(clickedLon);
  };

  // Auto-fill form from scenario preset
  const applyPreset = (preset: Preset) => {
    const d = preset.data;
    setRoadName(d.road_name);
    setLat(d.latitude);
    setLon(d.longitude);
    setEventType(d.event_type);
    setEventCause(d.event_cause);
    setPriority(d.priority);
    setStatus(d.status);
    setCorridor(d.corridor);
    setImpactScale(d.estimated_impact_scale);
    setRequiresClosure(d.requires_road_closure);
    setStartTime(d.start_time);
    setDayOfWeek(d.day_of_week);
    setLeadTime(d.planned_event_lead_time_hours);
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);

    const payload = {
      road_name: roadName,
      latitude: lat,
      longitude: lon,
      event_type: eventType,
      event_cause: eventCause,
      priority: priority,
      status: status,
      corridor: corridor,
      estimated_impact_scale: impactScale,
      requires_road_closure: requiresClosure,
      start_time: startTime,
      day_of_week: dayOfWeek,
      planned_event_lead_time_hours: eventType === 'planned' ? leadTime : 0.0
    };

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiBase}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned error: ${res.statusText}`);
      }

      const data = await res.json();
      setResult(data);

      // Save prediction to local browser history log
      const histItem = {
        timestamp: new Date().toISOString(),
        road_name: roadName,
        event_cause: eventCause,
        event_type: eventType,
        priority: priority,
        surge: data.prediction.ensemble,
        severity: data.dispatch.status
      };
      
      const localHist = JSON.parse(localStorage.getItem('nivaaran_history') || '[]');
      localHist.unshift(histItem);
      localStorage.setItem('nivaaran_history', JSON.stringify(localHist.slice(0, 50))); // Keep last 50

    } catch (err: any) {
      console.error(err);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      setErrorMsg(`Failed to connect to the prediction backend. Make sure the FastAPI python server is running at ${apiBase}.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="main-content" style={{ marginTop: '20px' }}>
      
      {/* Title */}
      <div className="title-section">
        <h1>Predict Congestion</h1>
        <p>Configure an incident below or load a demo preset scenario to calculate barricade blueprints & officer deployments.</p>
      </div>

      {/* Preset Scenarios */}
      <div className="scenarios-grid">
        {PRESET_SCENARIOS.map((p, idx) => (
          <button
            key={idx}
            className="scenario-card"
            style={{ '--accent-color': p.color } as React.CSSProperties}
            onClick={() => applyPreset(p)}
          >
            <div className="scenario-header">
              <span className="scenario-icon">🛑</span>
              <span className="scenario-badge" style={{ background: p.badgeColor, color: p.color }}>
                {p.badge}
              </span>
            </div>
            <div className="scenario-title">{p.name}</div>
            <div className="scenario-desc">{p.desc}</div>
          </button>
        ))}
      </div>

      {/* Main Form and Output splits */}
      <div className="predict-layout">
        
        {/* Left Side: Form */}
        <div className="card" style={{ padding: '20px' }}>
          <div className="card-title">
            <ScanEye size={16} className="text-[var(--accent-signal)]" style={{ color: 'var(--accent-signal)' }} />
            <span>Incident Configuration</span>
          </div>

          <form onSubmit={handlePredict}>
            <div className="form-group">
              <label>Road / Location Node</label>
              <select value={roadName} onChange={(e) => handleRoadChange(e.target.value)}>
                {metadata.roads.map((r: string) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div>
                <label>Latitude</label>
                <input
                  type="number"
                  step="0.00001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  min="12.0"
                  max="14.0"
                  required
                />
              </div>
              <div>
                <label>Longitude</label>
                <input
                  type="number"
                  step="0.00001"
                  value={lon}
                  onChange={(e) => setLon(parseFloat(e.target.value))}
                  min="77.0"
                  max="79.0"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Event Type</label>
                <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                  <option value="planned">Planned Event</option>
                  <option value="unplanned">Unplanned Incident</option>
                </select>
              </div>
              <div>
                <label>Event Cause</label>
                <select value={eventCause} onChange={(e) => setEventCause(e.target.value)}>
                  {metadata.causes.map((c: string) => (
                    <option key={c} value={c}>
                      {c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="High">High Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
              <div>
                <label>Current Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Corridor Segment</label>
              <select value={corridor} onChange={(e) => setCorridor(e.target.value)}>
                {metadata.corridors.map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <div className="slider-header">
                <label style={{ marginBottom: '0' }}>Estimated Impact Scale</label>
                <span className="slider-val">{impactScale.toFixed(1)} / 10.0</span>
              </div>
              <div className="slider-container">
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.5"
                  value={impactScale}
                  onChange={(e) => setImpactScale(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center' }}>
              <div className="checkbox-group" onClick={() => setRequiresClosure(!requiresClosure)}>
                <input
                  type="checkbox"
                  checked={requiresClosure}
                  onChange={(e) => setRequiresClosure(e.target.checked)}
                />
                <span className="checkbox-label">Requires Road Closure</span>
              </div>

              <div>
                <label>Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Day of Week</label>
                <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>

              {eventType === 'planned' && (
                <div>
                  <label>Lead Time (Hours)</label>
                  <input
                    type="number"
                    min="0"
                    max="720"
                    value={leadTime}
                    onChange={(e) => setLeadTime(parseFloat(e.target.value))}
                    required
                  />
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  <span>Computing Ensemble...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Run Prediction Model</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Map & Output Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Interactive vector map */}
          <Map latitude={lat} longitude={lon} onChange={handleMapChange} />

          {/* Results view */}
          {errorMsg && (
            <div className="dispatch-note" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                <AlertTriangle size={16} />
                <span>Backend API Connection Error</span>
              </div>
              <p style={{ fontSize: '11px', lineHeight: '1.4' }}>{errorMsg}</p>
            </div>
          )}

          {result ? (
            <div className="card" style={{ animation: 'fade-up 0.5s ease' }}>
              <div className="card-title" style={{ display: 'flex', justifyContent: 'between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1' }}>
                  <ShieldAlert size={16} style={{ color: 'var(--accent-signal)' }} />
                  <span>Prediction & Dispatch Output</span>
                </div>
                <span className={`badge ${
                  result.dispatch.status === 'CRITICAL' ? 'badge-critical' :
                  result.dispatch.status === 'WARNING' ? 'badge-warning' : 'badge-normal'
                }`}>
                  {result.dispatch.status}
                </span>
              </div>

              {/* Gauge and Model Breakdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                <div style={{ flex: '1', minWidth: '150px' }}>
                  <Gauge value={result.prediction.ensemble} />
                </div>
                
                <div style={{ flex: '2', minWidth: '220px' }}>
                  <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: '600', marginBottom: '8px' }}>
                    Model Predictors Split
                  </p>
                  <div className="metrics-row">
                    <div className="metric-box">
                      <div className="metric-label">LightGBM</div>
                      <div className="metric-val" style={{ color: '#60a5fa' }}>{result.prediction.lightgbm}%</div>
                    </div>
                    <div className="metric-box">
                      <div className="metric-label">XGBoost</div>
                      <div className="metric-val" style={{ color: '#c084fc' }}>{result.prediction.xgboost}%</div>
                    </div>
                    <div className="metric-box" style={{ borderColor: 'rgba(45, 212, 212, 0.3)', background: 'var(--accent-signal-bg)' }}>
                      <div className="metric-label" style={{ color: 'var(--accent-signal)' }}>Ensemble</div>
                      <div className="metric-val" style={{ color: 'var(--accent-signal)' }}>{result.prediction.ensemble}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dispatch Action Blueprints */}
              <div style={{ marginTop: '20px' }}>
                <h3 className="dispatch-title">
                  <Navigation size={15} style={{ color: 'var(--accent-signal)' }} />
                  <span>Barricade & Manpower Blueprint</span>
                </h3>

                <div className="dispatch-grid" style={{ marginBottom: '16px' }}>
                  <div className="dispatch-item">
                    <div className="dispatch-item-title">Deployment Manpower</div>
                    <div className="dispatch-item-val" style={{ color: 'var(--text-primary)', fontSize: '18px' }}>
                      {result.dispatch.dispatch_plan.manpower.traffic_officers} Officers
                    </div>
                    {result.dispatch.dispatch_plan.manpower.supervisors > 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        + {result.dispatch.dispatch_plan.manpower.supervisors} Field Supervisors
                      </div>
                    )}
                  </div>

                  <div className="dispatch-item">
                    <div className="dispatch-item-title">Barricade Blueprint</div>
                    <div className="dispatch-item-val" style={{ fontSize: '13px', lineHeight: '1.3', color: 'var(--text-primary)' }}>
                      {result.dispatch.dispatch_plan.barricading.blueprint_tier}
                    </div>
                    {result.dispatch.dispatch_plan.barricading.cones_required > 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        ~{result.dispatch.dispatch_plan.barricading.cones_required} guidance cones required
                      </div>
                    )}
                  </div>
                </div>

                {/* VMS Broadcasting */}
                <div style={{ marginBottom: '16px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Digital VMS Billboard Advisory
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-warning)', letterSpacing: '0.05em' }}>
                    "{result.dispatch.dispatch_plan.vms_broadcast}"
                  </div>
                </div>

                {/* Directives */}
                <div className="dispatch-section">
                  <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Operational Directives
                  </div>
                  <ul className="dispatch-list">
                    {result.dispatch.dispatch_plan.operational_directives.map((dir: string, idx: number) => (
                      <li key={idx} className="dispatch-list-item">
                        <span className="dispatch-bullet">&raquo;</span>
                        <span>{dir}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Notes and Anomalies */}
                {result.dispatch.dispatch_plan.modifier_notes.length > 0 && (
                  <div className="dispatch-section" style={{ borderTop: 'none', paddingTop: '0' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#ef4444', textTransform: 'uppercase', marginBottom: '8px' }}>
                      System Alerts & Modifiers
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {result.dispatch.dispatch_plan.modifier_notes.map((note: string, idx: number) => (
                        <div key={idx} className="dispatch-note">
                          <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Diversion routes */}
                {result.dispatch.dispatch_plan.diversion_matrix.length > 0 && (
                  <div className="dispatch-section">
                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Standard Detour Routing Matrix
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {result.dispatch.dispatch_plan.diversion_matrix.map((r: string, idx: number) => (
                        <span key={idx} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '4px 10px', color: 'var(--text-secondary)' }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="card map-placeholder" style={{ background: 'transparent', borderStyle: 'dashed', borderWidth: '2px' }}>
              <ScanEye size={32} />
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>No Prediction Output Calculated</p>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Load a demo scenario from the top cards or manually edit the form parameters, then click <strong>Run Prediction Model</strong>.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </main>
  );
}
