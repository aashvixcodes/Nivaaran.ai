'use client';

import React, { useState, useEffect } from 'react';
import FilterSidebar from '@/components/FilterSidebar';
import { Sliders, Award, Clock, Calendar, CheckSquare, BarChart, TrendingUp, HelpCircle } from 'lucide-react';

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState('post-event');
  
  // Filters & Page settings
  const [filters, setFilters] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchInsightsData = (currentFilters: any) => {
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
        console.error("Failed to fetch insights data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
    fetchInsightsData(newFilters);
  };

  // Helper variables for charts
  const maxRisk = data?.insights?.top_risk_roads 
    ? Math.max(...data.insights.top_risk_roads.map((r: any) => r.risk_score), 0.01) 
    : 1;
    
  const maxRecur = data?.insights?.top_recurrence
    ? Math.max(...data.insights.top_recurrence.map((r: any) => r.recurrence_frequency), 0.01)
    : 1;

  const maxCorrSurge = data?.insights?.corridor_vulnerability_surge
    ? Math.max(...data.insights.corridor_vulnerability_surge.map((c: any) => c.mean_surge), 0.01)
    : 100;

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 84px)' }}>
      {/* Sidebar filters */}
      <FilterSidebar onApply={handleApplyFilters} isLoading={loading} />

      {/* Main Insights Dashboard */}
      <main className="main-content" style={{ flex: '1', padding: '24px', overflowY: 'auto' }}>
        
        {/* Title */}
        <div className="title-section">
          <h1>Traffic Insights & Analytics</h1>
          <p>Explore historic bottlenecks, resolution analytics, and planned event predictions.</p>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px', paddingBottom: '1px' }}>
          {[
            { id: 'post-event', label: 'Post-Event Learning Loop' },
            { id: 'resolution', label: 'Resolution Intelligence' },
            { id: 'planned', label: 'Planned Event Analysis' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-signal)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '-1px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        {data ? (
          <div>
            
            {/* Tab 1: Post-Event Learning Loop */}
            {activeTab === 'post-event' && (
              <div className="dashboard-grid">
                
                {/* Risk Roads */}
                <div className="card col-6">
                  <div className="card-title">
                    <TrendingUp size={15} style={{ color: 'var(--accent-critical)' }} />
                    <span>Top 15 High-Risk Road Segments</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {data.insights.top_risk_roads?.slice(0, 10).map((r: any, idx: number) => {
                      const fillPct = (r.risk_score / maxRisk) * 100;
                      return (
                        <div key={idx} className="bar-row">
                          <div className="bar-header">
                            <span className="bar-name">{r.road_name}</span>
                            <span className="bar-val" style={{ color: 'var(--accent-critical)' }}>{r.risk_score.toFixed(3)}</span>
                          </div>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: `${fillPct}%`, backgroundColor: 'var(--accent-critical)' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Road+Cause Recurrence Pairs */}
                <div className="card col-6">
                  <div className="card-title">
                    <BarChart size={15} style={{ color: 'var(--accent-warning)' }} />
                    <span>Top 15 Road + Cause Recurrence Pairs</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {data.insights.top_recurrence?.slice(0, 10).map((r: any, idx: number) => {
                      const fillPct = (r.recurrence_frequency / maxRecur) * 100;
                      return (
                        <div key={idx} className="bar-row">
                          <div className="bar-header">
                            <span className="bar-name" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                              <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '200px' }}>{r.road_name}</span>
                              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>({r.cause})</span>
                            </span>
                            <span className="bar-val" style={{ color: 'var(--accent-warning)' }}>{r.recurrence_frequency.toFixed(3)}</span>
                          </div>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: `${fillPct}%`, backgroundColor: 'var(--accent-warning)' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Spatial Overlap Scatter Plot */}
                <div className="card col-12">
                  <div className="card-title">
                    <HelpCircle size={15} style={{ color: 'var(--accent-signal)' }} />
                    <span>Multi-Incident Spatial Overlap vs Congestion Surge Index</span>
                  </div>
                  <div style={{ position: 'relative', width: '100%', padding: '10px 0' }}>
                    <svg viewBox="0 0 500 160" className="w-full bg-black/10 border border-dashed border-[var(--border-subtle)] rounded-lg" style={{ overflow: 'visible' }}>
                      {/* Gridlines */}
                      <line x1="0" y1="10" x2="500" y2="10" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                      <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                      <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      
                      {/* Plot scatter points */}
                      {data.insights.spatial_overlap?.map((pt: any, idx: number) => {
                        // Map overlap score (0 to 3) to X (10 to 490)
                        const x = 10 + (pt.overlap_score / 3.0) * 480;
                        // Map surge index (0 to 100) to Y (150 to 10)
                        const y = 150 - (pt.surge_index / 100.0) * 140;
                        
                        let color = "rgba(45, 212, 212, 0.4)";
                        if (pt.corridor_tier === 2) color = "rgba(245, 158, 11, 0.5)";
                        if (pt.corridor_tier === 3) color = "rgba(239, 68, 68, 0.6)";

                        return (
                          <circle
                            key={idx}
                            cx={x.toFixed(1)}
                            cy={y.toFixed(1)}
                            r="3"
                            fill={color}
                          />
                        );
                      })}
                    </svg>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                      <span>Isolated Incidents (0 Overlap)</span>
                      <span>High Spatial Density (3 Overlap)</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Tab 2: Resolution Intelligence */}
            {activeTab === 'resolution' && (
              <div className="dashboard-grid">
                
                {/* Mean Resolution time by Cause */}
                <div className="card col-6">
                  <div className="card-title">
                    <Clock size={15} style={{ color: 'var(--accent-signal)' }} />
                    <span>Mean Resolution Time by Cause (minutes)</span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Cause</th>
                          <th>Mean</th>
                          <th>Median</th>
                          <th>75th %</th>
                          <th>Max</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.insights.resolution_by_cause?.map((res: any) => (
                          <tr key={res.cause}>
                            <td style={{ textTransform: 'capitalize', fontWeight: '500', color: 'var(--text-primary)' }}>
                              {res.cause.replace('_', ' ')}
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{res.mean.toFixed(1)}m</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{res.median.toFixed(1)}m</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{res.p75.toFixed(1)}m</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{res.max.toFixed(1)}m</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Corridor Vulnerability vs Surge */}
                <div className="card col-6">
                  <div className="card-title">
                    <Award size={15} style={{ color: 'var(--accent-normal)' }} />
                    <span>Corridor Vulnerability Tier vs Surge Index</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {data.insights.corridor_vulnerability_surge?.map((c: any, idx: number) => {
                      const fillPct = (c.mean_surge / maxCorrSurge) * 100;
                      return (
                        <div key={idx} style={{ borderBottom: idx !== data.insights.corridor_vulnerability_surge.length - 1 ? '1px solid var(--border-subtle)' : 'none', paddingBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                              {c.corridor} (Tier {c.tier})
                            </span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-signal)' }}>
                              {c.mean_surge.toFixed(1)}% Surge
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${fillPct}%`, height: '100%', background: 'var(--accent-normal)', borderRadius: '3px' }}></div>
                          </div>
                          <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', marginTop: '2px', textAlign: 'right' }}>
                            {c.incidents.toLocaleString()} logged events
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* Tab 3: Planned Event Analysis */}
            {activeTab === 'planned' && (
              <div className="dashboard-grid">
                
                {/* Metric Summary */}
                <div className="card col-4" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className="card-title">
                    <Calendar size={15} style={{ color: 'var(--accent-warning)' }} />
                    <span>Lead Time Summary</span>
                  </div>
                  <div style={{ padding: '12px 0' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '600' }}>
                      Average Lead Time
                    </div>
                    <div style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: '700', color: 'var(--accent-warning)', margin: '4px 0' }}>
                      {data.insights.avg_lead_time} hrs
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      Advance warning buffer allocated by event organizers for planned closures or VIP movements.
                    </p>
                  </div>
                </div>

                {/* Planned vs Unplanned Comparison table */}
                <div className="card col-8">
                  <div className="card-title">
                    <CheckSquare size={15} style={{ color: 'var(--accent-signal)' }} />
                    <span>Planned vs Unplanned Event Comparison</span>
                  </div>
                  
                  <table>
                    <thead>
                      <tr>
                        <th>Event Type</th>
                        <th>Average Surge</th>
                        <th>Mean Resolution</th>
                        <th>Total Incident Logs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.insights.planned_vs_unplanned?.map((comp: any) => (
                        <tr key={comp.event_type}>
                          <td style={{ textTransform: 'uppercase', fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                            {comp.event_type}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{comp.mean_surge.toFixed(1)}%</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{comp.mean_resolution.toFixed(1)} mins</td>
                          <td>{comp.incidents.toLocaleString()} logs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Lead Time Distribution Histogram */}
                {data.insights.planned_lead_times?.length > 0 && (
                  <div className="card col-12">
                    <div className="card-title">
                      <BarChart size={15} style={{ color: 'var(--accent-warning)' }} />
                      <span>Planned Event Lead Time Distribution (hours)</span>
                    </div>

                    <div style={{ position: 'relative', width: '100%', padding: '10px 0' }}>
                      <svg viewBox="0 0 500 120" className="w-full bg-black/10 border border-dashed border-[var(--border-subtle)] rounded-lg" style={{ overflow: 'visible' }}>
                        {/* Vertical bars representing lead times */}
                        {/* We group list items into 20 bins */}
                        {(() => {
                          const bins = Array(20).fill(0);
                          const leadTimes = data.insights.planned_lead_times;
                          const maxLead = Math.max(...leadTimes, 1);
                          
                          leadTimes.forEach((val: number) => {
                            const idx = Math.min(19, Math.floor((val / maxLead) * 20));
                            bins[idx]++;
                          });
                          
                          const maxBin = Math.max(...bins, 1);
                          
                          return bins.map((count, i) => {
                            const barWidth = 20;
                            const x = 10 + i * 24;
                            const barHeight = (count / maxBin) * 90;
                            const y = 110 - barHeight;

                            return (
                              <rect
                                key={i}
                                x={x}
                                y={y.toFixed(1)}
                                width={barWidth}
                                height={barHeight.toFixed(1)}
                                fill="var(--accent-warning)"
                                opacity="0.75"
                                rx="2"
                              />
                            );
                          });
                        })()}
                      </svg>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                        <span>Immediate (0.1 hrs)</span>
                        <span>Long Term (720 hrs / 30 days)</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
              Computing advanced traffic intelligence splits...
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
