'use client';

import React, { useState, useEffect } from 'react';
import FilterSidebar from '@/components/FilterSidebar';
import { Sliders, Award, Clock, Calendar, CheckSquare, BarChart, TrendingUp, HelpCircle, Activity } from 'lucide-react';

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
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
      {/* Sidebar filters */}
      <FilterSidebar onApply={handleApplyFilters} isLoading={loading} />

      {/* Main Insights Dashboard */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-7xl mx-auto w-full animate-fade-in">
        
        {/* Title */}
        <div className="mb-8 pb-6 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={18} className="text-[#111111]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Advanced Analytics</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111111] mb-2">Traffic Insights &amp; Analytics</h1>
          <p className="text-sm text-[#6B7280]">Explore historic bottlenecks, resolution analytics, and planned event predictions.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 border-b border-[#E5E7EB] mb-8 overflow-x-auto whitespace-nowrap">
          {[
            { id: 'post-event', label: 'Post-Event Learning Loop' },
            { id: 'resolution', label: 'Resolution Intelligence' },
            { id: 'planned', label: 'Planned Event Analysis' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-4 text-xs font-semibold border-b-2 transition-all duration-200 cursor-pointer ${
                activeTab === tab.id 
                  ? 'border-[#111111] text-[#111111]' 
                  : 'border-transparent text-[#6B7280] hover:text-[#111111]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        {data ? (
          <div className="space-y-6">
            
            {/* Tab 1: Post-Event Learning Loop */}
            {activeTab === 'post-event' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Risk Roads */}
                <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border-subtle">
                    <TrendingUp size={16} className="text-[#111111]" />
                    <h2 className="text-sm font-semibold text-[#111111]">Top 10 High-Risk Road Segments</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {data.insights.top_risk_roads?.slice(0, 10).map((r: any, idx: number) => {
                      const fillPct = (r.risk_score / maxRisk) * 100;
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-[#374151]">{r.road_name}</span>
                            <span className="font-mono font-semibold text-[#111111]">{r.risk_score.toFixed(3)}</span>
                          </div>
                          <div className="h-1.5 bg-bg-neutral rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#111111] rounded-full transition-all duration-300" 
                              style={{ width: `${fillPct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Road+Cause Recurrence Pairs */}
                <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border-subtle">
                    <BarChart size={16} className="text-[#111111]" />
                    <h2 className="text-sm font-semibold text-[#111111]">Top 10 Road &amp; Cause Recurrence Pairs</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {data.insights.top_recurrence?.slice(0, 10).map((r: any, idx: number) => {
                      const fillPct = (r.recurrence_frequency / maxRecur) * 100;
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-baseline gap-1.5 overflow-hidden max-w-[70%]">
                              <span className="font-medium text-[#374151] truncate">{r.road_name}</span>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] shrink-0">({r.cause})</span>
                            </div>
                            <span className="font-mono font-semibold text-[#111111]">{r.recurrence_frequency.toFixed(3)}</span>
                          </div>
                          <div className="h-1.5 bg-bg-neutral rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#6B7280] rounded-full transition-all duration-300" 
                              style={{ width: `${fillPct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Spatial Overlap Scatter Plot */}
                <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm xl:col-span-2">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border-subtle">
                    <HelpCircle size={16} className="text-[#111111]" />
                    <h2 className="text-sm font-semibold text-[#111111]">Multi-Incident Spatial Overlap vs Congestion Surge Index</h2>
                  </div>
                  
                  <div className="relative w-full">
                    <svg viewBox="0 0 500 160" className="w-full bg-bg-main border border-border-subtle rounded-lg overflow-visible">
                      {/* Gridlines */}
                      <line x1="0" y1="10" x2="500" y2="10" stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="2,2" />
                      <line x1="0" y1="80" x2="500" y2="80" stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="2,2" />
                      <line x1="0" y1="150" x2="500" y2="150" stroke="#D1D5DB" strokeWidth="1" />
                      
                      {/* Plot scatter points */}
                      {data.insights.spatial_overlap?.map((pt: any, idx: number) => {
                        const x = 10 + (pt.overlap_score / 3.0) * 480;
                        const y = 150 - (pt.surge_index / 100.0) * 140;
                        
                        let color = "#6B7280"; // Default Gray
                        if (pt.corridor_tier === 2) color = "#F59E0B"; // Amber
                        if (pt.corridor_tier === 3) color = "#EF4444"; // Red

                        return (
                          <circle
                            key={idx}
                            cx={x.toFixed(1)}
                            cy={y.toFixed(1)}
                            r="4"
                            fill={color}
                            className="transition-all hover:r-6 cursor-pointer"
                          />
                        );
                      })}
                    </svg>
                    
                    <div className="flex justify-between mt-2.5 text-[9px] font-mono text-[#9CA3AF] uppercase tracking-wider">
                      <span>Isolated Incidents (0 Overlap)</span>
                      <span>High Spatial Density (3 Overlap)</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Tab 2: Resolution Intelligence */}
            {activeTab === 'resolution' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Mean Resolution time by Cause */}
                <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border-subtle">
                    <Clock size={16} className="text-[#111111]" />
                    <h2 className="text-sm font-semibold text-[#111111]">Mean Resolution Time by Cause</h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-bg-neutral border-b border-border-subtle">
                          <th className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] px-4 py-3">Cause</th>
                          <th className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] px-4 py-3">Mean</th>
                          <th className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] px-4 py-3">Median</th>
                          <th className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] px-4 py-3">75th %</th>
                          <th className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] px-4 py-3">Max</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {data.insights.resolution_by_cause?.map((res: any) => (
                          <tr key={res.cause} className="hover:bg-bg-neutral">
                            <td className="px-4 py-3 text-xs font-medium text-[#111111] capitalize">
                              {res.cause.replace('_', ' ')}
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-[#4B5563]">{res.mean.toFixed(1)}m</td>
                            <td className="px-4 py-3 text-xs font-mono text-[#4B5563]">{res.median.toFixed(1)}m</td>
                            <td className="px-4 py-3 text-xs font-mono text-[#4B5563]">{res.p75.toFixed(1)}m</td>
                            <td className="px-4 py-3 text-xs font-mono text-[#4B5563]">{res.max.toFixed(1)}m</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Corridor Vulnerability vs Surge */}
                <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border-subtle">
                    <Award size={16} className="text-[#111111]" />
                    <h2 className="text-sm font-semibold text-[#111111]">Corridor Vulnerability Tier vs Surge Index</h2>
                  </div>
                  
                  <div className="space-y-6">
                    {data.insights.corridor_vulnerability_surge?.map((c: any, idx: number) => {
                      const fillPct = (c.mean_surge / maxCorrSurge) * 100;
                      return (
                        <div key={idx} className="border-b border-[#F3F4F6] last:border-0 pb-4 last:pb-0">
                          <div className="flex justify-between items-center text-xs mb-2">
                            <span className="font-medium text-[#111111]">
                              {c.corridor} <span className="text-[#9CA3AF] text-[10px] font-semibold uppercase tracking-wider ml-1">(Tier {c.tier})</span>
                            </span>
                            <span className="font-mono font-semibold text-[#111111]">
                              {c.mean_surge.toFixed(1)}% Surge
                            </span>
                          </div>
                          <div className="h-1.5 bg-bg-neutral rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#111111] rounded-full" 
                              style={{ width: `${fillPct}%` }}
                            ></div>
                          </div>
                          <div className="text-[10px] text-[#9CA3AF] mt-1.5 text-right font-medium">
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
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Metric Summary */}
                <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar size={16} className="text-[#111111]" />
                    <h2 className="text-sm font-semibold text-[#111111]">Lead Time Summary</h2>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">
                      Average Lead Time
                    </div>
                    <div className="text-4xl font-extrabold font-mono text-[#111111] tracking-tight mb-4">
                      {data.insights.avg_lead_time} hrs
                    </div>
                    <p className="text-xs text-[#6B7280] leading-relaxed">
                      Advance warning buffer allocated by event organizers for planned closures or VIP movements.
                    </p>
                  </div>
                </div>

                {/* Planned vs Unplanned Comparison table */}
                <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm xl:col-span-2 overflow-hidden">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border-subtle">
                    <CheckSquare size={16} className="text-[#111111]" />
                    <h2 className="text-sm font-semibold text-[#111111]">Planned vs Unplanned Event Comparison</h2>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-bg-neutral border-b border-border-subtle">
                          <th className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] px-4 py-3">Event Type</th>
                          <th className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] px-4 py-3">Average Surge</th>
                          <th className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] px-4 py-3">Mean Resolution</th>
                          <th className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] px-4 py-3">Total Incident Logs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {data.insights.planned_vs_unplanned?.map((comp: any) => (
                          <tr key={comp.event_type} className="hover:bg-bg-neutral">
                            <td className="px-4 py-3 text-xs font-mono font-bold text-[#111111] uppercase">
                              {comp.event_type}
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-[#4B5563]">{comp.mean_surge.toFixed(1)}%</td>
                            <td className="px-4 py-3 text-xs font-mono text-[#4B5563]">{comp.mean_resolution.toFixed(1)} mins</td>
                            <td className="px-4 py-3 text-xs text-[#6B7280]">{comp.incidents.toLocaleString()} logs</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Lead Time Distribution Histogram */}
                {data.insights.planned_lead_times?.length > 0 && (
                  <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm xl:col-span-3">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border-subtle">
                      <BarChart size={16} className="text-[#111111]" />
                      <h2 className="text-sm font-semibold text-[#111111]">Planned Event Lead Time Distribution (hours)</h2>
                    </div>

                    <div className="relative w-full">
                      <svg viewBox="0 0 500 120" className="w-full bg-bg-main border border-border-subtle rounded-lg overflow-visible">
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
                                fill="#111111"
                                opacity="0.8"
                                rx="1.5"
                                className="transition-all hover:opacity-100 cursor-pointer"
                              />
                            );
                          });
                        })()}
                      </svg>
                      
                      <div className="flex justify-between mt-2.5 text-[9px] font-mono text-[#9CA3AF] uppercase tracking-wider">
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
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-6 h-6 border-2 border-[#111111] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xs text-[#6B7280] font-medium tracking-wide uppercase">
              Computing advanced traffic intelligence splits...
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
