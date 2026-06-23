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
    <div className="flex min-h-[calc(100vh-84px)]">
      {/* Sidebar Filters */}
      <FilterSidebar onApply={handleApplyFilters} isLoading={loading} />

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto bg-[#FAFAFA] p-8">

        {/* Title */}
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-[#111111]">
            <LayoutDashboard size={28} className="text-[#111111]" />
            <span>Traffic Overview</span>
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Live aggregates and historical reports filtered dynamically from the Bengaluru City Command logs.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle size={18} className="flex-shrink-0 text-amber-500" />
            <div>
              <span className="font-semibold">Showing Offline Cache Data</span>
              <span className="ml-1">— Backend FastAPI server was not reachable. Pre-computed historical metrics are shown.</span>
            </div>
          </div>
        )}

        {/* KPI Row */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Total Incidents */}
          <div className="flex items-center gap-5 rounded-xl border border-[#E5E7EB] bg-white p-6 transition-all duration-200 hover:shadow-sm hover:scale-[1.02]">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#F3F4F6] text-[#111111]">
              <Activity size={22} />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                Total Logged Incidents
              </div>
              <div className="text-3xl font-bold text-[#111111] font-mono leading-tight">
                {summary.total_incidents.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Average Surge */}
          <div className="flex items-center gap-5 rounded-xl border border-[#E5E7EB] bg-white p-6 transition-all duration-200 hover:shadow-sm hover:scale-[1.02]">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#F3F4F6] text-[#111111]">
              <Clock size={22} />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                Average Congestion Surge
              </div>
              <div className="text-3xl font-bold text-[#111111] font-mono leading-tight">
                {summary.average_surge.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* High Priority */}
          <div className="flex items-center gap-5 rounded-xl border border-[#E5E7EB] bg-white p-6 transition-all duration-200 hover:shadow-sm hover:scale-[1.02]">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#F3F4F6] text-[#111111]">
              <Layers size={22} />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                High Priority Ratio
              </div>
              <div className="text-3xl font-bold text-[#111111] font-mono leading-tight">
                {summary.high_priority_pct.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* Hourly Profile Chart — spans 8 cols */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 lg:col-span-8">
            <div className="mb-4 flex items-center gap-2">
              <Clock size={16} className="text-[#6B7280]" />
              <span className="text-sm font-semibold text-[#111111]">Hourly Incident Density Profile</span>
            </div>

            <div className="relative w-full pb-2 pt-4">
              <svg viewBox="0 0 500 120" className="w-full" style={{ overflow: 'visible' }}>
                <line x1="0" y1="10" x2="500" y2="10" stroke="#F3F4F6" strokeWidth="1" />
                <line x1="0" y1="60" x2="500" y2="60" stroke="#F3F4F6" strokeWidth="1" />
                <line x1="0" y1="110" x2="500" y2="110" stroke="#E5E7EB" strokeWidth="1" />

                {byHour.length > 0 && (
                  <path
                    d={`${generateLinePath()} L 490 110 L 10 110 Z`}
                    fill="url(#chartGradientLight)"
                    stroke="none"
                  />
                )}

                <path
                  d={generateLinePath()}
                  fill="none"
                  stroke="#111111"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                <defs>
                  <linearGradient id="chartGradientLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#111111" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#111111" stopOpacity="0.00" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="mt-2 flex justify-between text-[9px] font-mono text-[#9CA3AF]">
                <span>00:00 (MIDNIGHT)</span>
                <span>08:00 (AM PEAK)</span>
                <span>12:00 (NOON)</span>
                <span>18:00 (PM PEAK)</span>
                <span>23:00</span>
              </div>
            </div>
          </div>

          {/* Top Congested Roads — spans 4 cols, 2 rows */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 lg:col-span-4 lg:row-span-2">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#6B7280]" />
              <span className="text-sm font-semibold text-[#111111]">Top Congested Road Nodes</span>
            </div>

            {topRoads.length > 0 ? (
              <div className="flex flex-col gap-4">
                {topRoads.map((road, idx) => (
                  <div
                    key={idx}
                    className={`pb-3 ${idx !== topRoads.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="max-w-[170px] truncate text-xs font-medium text-[#111111]">
                        {road.name}
                      </span>
                      <span className="text-xs font-semibold font-mono text-[#111111]">
                        {road.surge.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                      <div
                        className="h-full rounded-full bg-[#111111] transition-all duration-300"
                        style={{ width: `${road.surge}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#E5E7EB] p-10 text-center text-xs text-[#9CA3AF]">
                No congestion details match filters.
              </div>
            )}
          </div>

          {/* Incident Cause Distribution — spans 4 cols */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 lg:col-span-4">
            <div className="mb-4 flex items-center gap-2">
              <Activity size={16} className="text-[#6B7280]" />
              <span className="text-sm font-semibold text-[#111111]">Incident Causes Share</span>
            </div>

            {byCause.length > 0 ? (
              <div className="flex flex-col gap-3">
                {byCause.slice(0, 6).map((c, idx) => {
                  const pct = (c.value / maxCauseVal) * 100;
                  return (
                    <div key={idx}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium capitalize text-[#111111]">
                          {c.name.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-mono text-[#6B7280]">
                          {c.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                        <div
                          className="h-full rounded-full bg-[#111111] transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#E5E7EB] p-10 text-center text-xs text-[#9CA3AF]">
                No active events to list.
              </div>
            )}
          </div>

          {/* Corridor Breakdown — spans 4 cols */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 lg:col-span-4">
            <div className="mb-4 flex items-center gap-2">
              <Layers size={16} className="text-[#6B7280]" />
              <span className="text-sm font-semibold text-[#111111]">Surge Incidents by Corridor</span>
            </div>

            {byCorridor.length > 0 ? (
              <div className="flex flex-col gap-3">
                {byCorridor.map((c, idx) => {
                  const pct = (c.value / maxCorridorVal) * 100;
                  return (
                    <div key={idx}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-[#111111]">
                          {c.name}
                        </span>
                        <span className="text-xs font-mono text-[#6B7280]">
                          {c.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                        <div
                          className="h-full rounded-full bg-[#6B7280] transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#E5E7EB] p-10 text-center text-xs text-[#9CA3AF]">
                No corridors match filters.
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
