'use client';

import React, { useState, useEffect } from 'react';
import { ScanEye, Play, ShieldAlert, Navigation, AlertTriangle, RefreshCw } from 'lucide-react';
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

const badgeClass = (badge: string) => {
  switch (badge) {
    case 'Critical': return 'bg-pastel-red text-pastel-red-text border border-pastel-red-text/10';
    case 'High': return 'bg-pastel-amber text-pastel-amber-text border border-pastel-amber-text/10';
    case 'Medium': return 'bg-pastel-amber text-pastel-amber-text border border-pastel-amber-text/10';
    case 'Low': return 'bg-pastel-green text-pastel-green-text border border-pastel-green-text/10';
    default: return 'bg-bg-neutral text-[#6B7280] border border-border-subtle';
  }
};

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'CRITICAL': return 'bg-pastel-red text-pastel-red-text border border-pastel-red-text/20';
    case 'WARNING': return 'bg-pastel-amber text-pastel-amber-text border border-pastel-amber-text/20';
    case 'NORMAL': return 'bg-pastel-green text-pastel-green-text border border-pastel-green-text/20';
    default: return 'bg-bg-neutral text-[#374151] border border-border-subtle';
  }
};

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
    <main className="min-h-screen bg-bg-main px-6 py-8 lg:px-10">

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111111] tracking-tight">
          Predict Congestion
        </h1>
        <p className="text-sm text-[#6B7280] mt-1.5 max-w-2xl">
          Configure an incident below or load a demo preset scenario to calculate barricade blueprints &amp; officer deployments.
        </p>
      </div>

      {/* Preset Scenarios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {PRESET_SCENARIOS.map((p, idx) => (
          <button
            key={idx}
            className="bg-bg-card border border-border-subtle rounded-xl p-4 text-left hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer"
            onClick={() => applyPreset(p)}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-base">🛑</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeClass(p.badge)}`}>
                {p.badge}
              </span>
            </div>
            <div className="text-sm font-semibold text-[#111111] mb-1">{p.name}</div>
            <div className="text-xs text-[#9CA3AF]">{p.desc}</div>
          </button>
        ))}
      </div>

      {/* Main Form and Output splits */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">

        {/* Left Side: Form */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <ScanEye size={16} className="text-[#6B7280]" />
            <span className="text-sm font-semibold text-[#111111]">Incident Configuration</span>
          </div>

          <form onSubmit={handlePredict}>
            {/* Road / Location */}
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Road / Location Node</label>
              <select
                value={roadName}
                onChange={(e) => handleRoadChange(e.target.value)}
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]/10 focus:border-[#111111]/30 transition"
              >
                {metadata.roads.map((r: string) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Lat / Lon */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Latitude</label>
                <input
                  type="number"
                  step="0.00001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  min="12.0"
                  max="14.0"
                  required
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm font-mono text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]/10 focus:border-[#111111]/30 transition"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Longitude</label>
                <input
                  type="number"
                  step="0.00001"
                  value={lon}
                  onChange={(e) => setLon(parseFloat(e.target.value))}
                  min="77.0"
                  max="79.0"
                  required
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm font-mono text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]/10 focus:border-[#111111]/30 transition"
                />
              </div>
            </div>

            {/* Event Type / Cause */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]/10 focus:border-[#111111]/30 transition"
                >
                  <option value="planned">Planned Event</option>
                  <option value="unplanned">Unplanned Incident</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Event Cause</label>
                <select
                  value={eventCause}
                  onChange={(e) => setEventCause(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]/10 focus:border-[#111111]/30 transition"
                >
                  {metadata.causes.map((c: string) => (
                    <option key={c} value={c}>
                      {c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority / Status */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]/10 focus:border-[#111111]/30 transition"
                >
                  <option value="High">High Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Current Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]/10 focus:border-[#111111]/30 transition"
                >
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Corridor */}
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Corridor Segment</label>
              <select
                value={corridor}
                onChange={(e) => setCorridor(e.target.value)}
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]/10 focus:border-[#111111]/30 transition"
              >
                {metadata.corridors.map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Impact Scale Slider */}
            <div className="flex flex-col gap-1.5 mb-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Estimated Impact Scale</label>
                <span className="text-xs font-mono font-semibold text-[#111111]">{impactScale.toFixed(1)} / 10.0</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                value={impactScale}
                onChange={(e) => setImpactScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#111111]"
              />
            </div>

            {/* Closure + Start Time */}
            <div className="grid grid-cols-2 gap-4 mb-4 items-center">
              <div
                className="flex items-center gap-2.5 cursor-pointer select-none"
                onClick={() => setRequiresClosure(!requiresClosure)}
              >
                <input
                  type="checkbox"
                  checked={requiresClosure}
                  onChange={(e) => setRequiresClosure(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E5E7EB] text-[#111111] focus:ring-[#111111]/20 accent-[#111111]"
                />
                <span className="text-sm text-[#111111]">Requires Road Closure</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm font-mono text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]/10 focus:border-[#111111]/30 transition"
                />
              </div>
            </div>

            {/* Day of Week + Lead Time */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Day of Week</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]/10 focus:border-[#111111]/30 transition"
                >
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
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Lead Time (Hours)</label>
                  <input
                    type="number"
                    min="0"
                    max="720"
                    value={leadTime}
                    onChange={(e) => setLeadTime(parseFloat(e.target.value))}
                    required
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm font-mono text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]/10 focus:border-[#111111]/30 transition"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#111111] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#333] transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
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
        <div className="flex flex-col gap-6">

          {/* Interactive vector map */}
          <Map latitude={lat} longitude={lon} onChange={handleMapChange} />

          {/* Error Alert */}
          {errorMsg && (
            <div className="bg-pastel-red border border-pastel-red-text/10 rounded-lg p-4 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-pastel-red-text font-semibold text-sm">
                <AlertTriangle size={16} />
                <span>Backend API Connection Error</span>
              </div>
              <p className="text-xs text-pastel-red-text/80 leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {/* Results view */}
          {result ? (
            <div className="bg-bg-card border border-border-subtle rounded-xl p-6 animate-slide-up">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-[#6B7280]" />
                  <span className="text-sm font-semibold text-[#111111]">Prediction &amp; Dispatch Output</span>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusBadgeClass(result.dispatch.status)}`}>
                  {result.dispatch.status}
                </span>
              </div>

              {/* Gauge and Model Breakdown */}
              <div className="flex items-center gap-6 flex-wrap border-b border-border-subtle pb-5 mb-5">
                <div className="flex-1 min-w-[150px]">
                  <Gauge value={result.prediction.ensemble} />
                </div>

                <div className="flex-[2] min-w-[220px]">
                  <p className="text-[10px] uppercase text-[#9CA3AF] font-semibold tracking-wider mb-3">
                    Model Predictors Split
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-bg-neutral border border-border-subtle rounded-lg p-3 text-center">
                      <div className="text-[10px] text-[#9CA3AF] font-medium mb-1">LightGBM</div>
                      <div className="text-lg font-bold font-mono text-blue-600">{result.prediction.lightgbm}%</div>
                    </div>
                    <div className="bg-bg-neutral border border-border-subtle rounded-lg p-3 text-center">
                      <div className="text-[10px] text-[#9CA3AF] font-medium mb-1">XGBoost</div>
                      <div className="text-lg font-bold font-mono text-purple-600">{result.prediction.xgboost}%</div>
                    </div>
                    <div className="bg-bg-neutral border border-border-subtle rounded-lg p-3 text-center">
                      <div className="text-[10px] text-[#9CA3AF] font-medium mb-1">PyTorch DL</div>
                      <div className="text-lg font-bold font-mono text-pink-600">{result.prediction.pytorch ?? '—'}%</div>
                    </div>
                    <div className="bg-bg-neutral/70 border border-border-subtle rounded-lg p-3 text-center">
                      <div className="text-[10px] text-[#111111] font-semibold mb-1">Ensemble</div>
                      <div className="text-lg font-bold font-mono text-[#111111]">{result.prediction.ensemble}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dispatch Action Blueprints */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#111111] mb-4">
                  <Navigation size={15} className="text-[#6B7280]" />
                  <span>Barricade &amp; Manpower Blueprint</span>
                </h3>

                {/* Dispatch Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div className="bg-bg-neutral border border-border-subtle rounded-lg p-4">
                    <div className="text-[10px] uppercase text-[#9CA3AF] font-semibold tracking-wider mb-1.5">Deployment Manpower</div>
                    <div className="text-lg font-bold text-[#111111]">
                      {result.dispatch.dispatch_plan.manpower.traffic_officers} Officers
                    </div>
                    {result.dispatch.dispatch_plan.manpower.supervisors > 0 && (
                      <div className="text-xs text-[#6B7280] mt-1">
                        + {result.dispatch.dispatch_plan.manpower.supervisors} Field Supervisors
                      </div>
                    )}
                  </div>
                  <div className="bg-bg-neutral border border-border-subtle rounded-lg p-4">
                    <div className="text-[10px] uppercase text-[#9CA3AF] font-semibold tracking-wider mb-1.5">Barricade Blueprint</div>
                    <div className="text-sm font-semibold text-[#111111] leading-snug">
                      {result.dispatch.dispatch_plan.barricading.blueprint_tier}
                    </div>
                    {result.dispatch.dispatch_plan.barricading.cones_required > 0 && (
                      <div className="text-xs text-[#6B7280] mt-1">
                        ~{result.dispatch.dispatch_plan.barricading.cones_required} guidance cones required
                      </div>
                    )}
                  </div>
                </div>

                {/* VMS Broadcasting */}
                <div className="bg-bg-neutral border border-border-subtle rounded-lg p-4 mb-5">
                  <div className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">
                    Digital VMS Billboard Advisory
                  </div>
                  <div className="font-mono text-sm text-[#7C5A1D] tracking-wide">
                    &quot;{result.dispatch.dispatch_plan.vms_broadcast}&quot;
                  </div>
                </div>

                {/* Operational Directives */}
                <div className="border-t border-border-subtle pt-4 mb-5">
                  <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">
                    Operational Directives
                  </div>
                  <ul className="flex flex-col gap-2">
                    {result.dispatch.dispatch_plan.operational_directives.map((dir: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-[#111111]">
                        <span className="text-[#9CA3AF] mt-0.5">&raquo;</span>
                        <span>{dir}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* System Alerts & Modifiers */}
                {result.dispatch.dispatch_plan.modifier_notes.length > 0 && (
                  <div className="mb-5">
                    <div className="text-[10px] font-bold text-pastel-red-text uppercase tracking-wider mb-3">
                      System Alerts &amp; Modifiers
                    </div>
                    <div className="flex flex-col gap-2">
                      {result.dispatch.dispatch_plan.modifier_notes.map((note: string, idx: number) => (
                        <div key={idx} className="bg-pastel-red border border-pastel-red-text/10 rounded-lg p-3 flex items-start gap-2 text-sm text-pastel-red-text">
                          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                          <span>{note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Diversion Routes */}
                {result.dispatch.dispatch_plan.diversion_matrix.length > 0 && (
                  <div className="border-t border-border-subtle pt-4">
                    <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">
                      Standard Detour Routing Matrix
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {result.dispatch.dispatch_plan.diversion_matrix.map((r: string, idx: number) => (
                        <span key={idx} className="text-xs bg-bg-neutral border border-border-subtle rounded-md px-3 py-1.5 text-[#6B7280]">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="border-2 border-dashed border-border-subtle rounded-xl p-12 text-center flex flex-col items-center gap-3">
              <ScanEye size={32} className="text-[#9CA3AF]" />
              <div>
                <p className="text-sm font-semibold text-[#111111]">No Prediction Output Calculated</p>
                <p className="text-xs text-[#9CA3AF] mt-1.5 max-w-sm mx-auto">
                  Load a demo scenario from the top cards or manually edit the form parameters, then click <strong className="text-[#111111]">Run Prediction Model</strong>.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </main>
  );
}
