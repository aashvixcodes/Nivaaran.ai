'use client';

import React, { useState, useEffect } from 'react';
import FilterSidebar from '@/components/FilterSidebar';
import { LayoutDashboard, AlertTriangle, Activity, Clock, Layers, TrendingUp } from 'lucide-react';

interface MetricSummary {
  total_incidents: number;
  average_surge: number;
  high_priority_pct: number;
}

interface CauseMetric {
  name: string;
  value: number;
}

interface HourMetric {
  hour: number;
  count: number;
}

interface CorridorMetric {
  name: string;
  value: number;
}

interface TopRoad {
  name: string;
  surge: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState<any>(null);

  // Overview stats state
  const [summary, setSummary] = useState<MetricSummary>({
    total_incidents: 8173,
    average_surge: 71.0,
    high_priority_pct: 61.2
  });
  const [byCause, setByCause] = useState<CauseMetric[]>([]);
  const [byHour, setByHour] = useState<HourMetric[]>([]);
  const [byCorridor, setByCorridor] = useState<CorridorMetric[]>([]);
  const [topRoads, setTopRoads] = useState<TopRoad[]>([]);

  const fetchOverviewData = (currentFilters: any) => {
    setLoading(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    fetch(`${apiBase}/analytics-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentFilters)
    })
      .then(res => {
        if (!res.ok) throw new Error("API unreachable");
        return res.json();
      })
      .then(data => {
        setSummary(data.summary);
        setByCause(data.by_cause);
        setByHour(data.by_hour);
        setByCorridor(data.by_corridor);
        setTopRoads(data.top_roads);
        setError(false);
      })
      .catch(err => {
        console.warn("Failed to fetch dashboard metrics. Using visual fallbacks. Error:", err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
    fetchOverviewData(newFilters);
  };

  // Helper variables for chart rendering
  const maxHourCount = byHour.length > 0 ? Math.max(...byHour.map(h => h.count), 1) : 1;
  const maxCauseVal = byCause.length > 0 ? Math.max(...byCause.map(c => c.value), 1) : 1;
  const maxCorridorVal = byCorridor.length > 0 ? Math.max(...byCorridor.map(c => c.value), 1) : 1;

  // SVG Line Chart path generation
  const generateLinePath = () => {
    if (byHour.length === 0) return 'M 10 110 L 490 110';
    const width = 500;
    const height = 120;
    const padding = 10;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;

    return byHour.map((h, i) => {
      const x = padding + (i / (byHour.length - 1)) * usableWidth;
      const y = height - padding - (h.count / maxHourCount) * usableHeight;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 84px)' }}>
      {/* Sidebar Filters */}
      <FilterSidebar onApply={handleApplyFilters} isLoading={loading} />

      {/* Main Content Pane */}
      <main className="main-content" style={{ flex: '1', padding: '24px', overflowY: 'auto' }}>
        
        {/* Title */}
        <div className="title-section">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LayoutDashboard size={28} className="text-[var(--accent-signal)]" style={{ color: 'var(--accent-signal)' }} />
            <span>Traffic Overview Command Console</span>
          </h1>
          <p>Live aggregates and historical reports filtered dynamically from the Bengaluru City Command logs.</p>
        </div>

        {error && (
          <div className="dispatch-note" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Showing Offline Cache Data</strong> — Backend FastAPI server was not reachable. Pre-computed historical metrics are shown.
            </div>
          </div>
        )}

        {/* KPI Row */}
        <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
          <div className="card col-4" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '12px', background: 'rgba(45, 212, 212, 0.05)', border: '1px solid rgba(45, 212, 212, 0.15)', borderRadius: '10px', color: 'var(--accent-signal)' }}>
              <Activity size={24} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Logged Incidents
              </div>
              <div style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: '700', lineHeight: '1.2', color: 'var(--text-primary)' }}>
                {summary.total_incidents.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="card col-4" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '10px', color: 'var(--accent-warning)' }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Average Congestion Surge
              </div>
              <div style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: '700', lineHeight: '1.2', color: 'var(--text-primary)' }}>
                {summary.average_surge.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="card col-4" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '10px', color: 'var(--accent-critical)' }}>
              <Layers size={24} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                High Priority Ratio
              </div>
              <div style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: '700', lineHeight: '1.2', color: 'var(--text-primary)' }}>
                {summary.high_priority_pct.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Charts Grid */}
        <div className="dashboard-grid">
          
          {/* Hourly Profile Chart */}
          <div className="card col-8">
            <div className="card-title">
              <Clock size={16} style={{ color: 'var(--accent-signal)' }} />
              <span>Hourly Incident Density Profile</span>
            </div>

            <div style={{ position: 'relative', width: '100%', padding: '16px 0 8px' }}>
              <svg viewBox="0 0 500 120" className="w-full" style={{ overflow: 'visible' }}>
                <line x1="0" y1="10" x2="500" y2="10" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                <line x1="0" y1="110" x2="500" y2="110" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                
                {byHour.length > 0 && (
                  <path
                    d={`${generateLinePath()} L 490 110 L 10 110 Z`}
                    fill="url(#chartGradient)"
                    stroke="none"
                  />
                )}
                
                <path
                  d={generateLinePath()}
                  fill="none"
                  stroke="var(--accent-signal)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-signal)" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="var(--accent-signal)" stopOpacity="0.00" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                <span>00:00 (MIDNIGHT)</span>
                <span>08:00 (AM PEAK)</span>
                <span>12:00 (NOON)</span>
                <span>18:00 (PM PEAK)</span>
                <span>23:00</span>
              </div>
            </div>
          </div>

          {/* Top Congested Roads */}
          <div className="card col-4" style={{ gridRow: 'span 2' }}>
            <div className="card-title">
              <TrendingUp size={16} style={{ color: 'var(--accent-warning)' }} />
              <span>Top Congested Road Nodes</span>
            </div>

            {topRoads.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {topRoads.map((road, idx) => (
                  <div key={idx} style={{ borderBottom: idx !== topRoads.length - 1 ? '1px solid var(--border-subtle)' : 'none', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '170px' }}>
                        {road.name}
                      </span>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: '600', color: road.surge > 80 ? 'var(--accent-critical)' : 'var(--accent-warning)' }}>
                        {road.surge.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'var(--bg-input)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${road.surge}%`, height: '100%', background: road.surge > 80 ? 'var(--accent-critical)' : 'var(--accent-warning)', borderRadius: '2px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', border: '1px dashed var(--border-subtle)', borderRadius: '6px' }}>
                No congestion details match filters.
              </div>
            )}
          </div>

          {/* Incident Cause Distribution */}
          <div className="card col-4">
            <div className="card-title">
              <Activity size={16} style={{ color: 'var(--accent-signal)' }} />
              <span>Incident Causes Share</span>
            </div>

            {byCause.length > 0 ? (
              <div className="bar-chart-container">
                {byCause.slice(0, 6).map((c, idx) => {
                  const pct = (c.value / maxCauseVal) * 100;
                  return (
                    <div key={idx} className="bar-row">
                      <div className="bar-header">
                        <span className="bar-name" style={{ textTransform: 'capitalize' }}>
                          {c.name.replace('_', ' ')}
                        </span>
                        <span className="bar-val">{c.value.toLocaleString()}</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${pct}%`, backgroundColor: 'var(--accent-signal)' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', border: '1px dashed var(--border-subtle)', borderRadius: '6px' }}>
                No active events to list.
              </div>
            )}
          </div>

          {/* Corridor Breakdown */}
          <div className="card col-4">
            <div className="card-title">
              <Layers size={16} style={{ color: 'var(--accent-normal)' }} />
              <span>Surge incidents by Corridor</span>
            </div>

            {byCorridor.length > 0 ? (
              <div className="bar-chart-container">
                {byCorridor.map((c, idx) => {
                  const pct = (c.value / maxCorridorVal) * 100;
                  return (
                    <div key={idx} className="bar-row">
                      <div className="bar-header">
                        <span className="bar-name">{c.name}</span>
                        <span className="bar-val">{c.value.toLocaleString()}</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${pct}%`, backgroundColor: 'var(--accent-normal)' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', border: '1px dashed var(--border-subtle)', borderRadius: '6px' }}>
                No corridors match filters.
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
