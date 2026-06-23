'use client';

import React, { useState, useEffect } from 'react';
import { Filter, Sliders, CheckSquare, X, RefreshCw } from 'lucide-react';

interface FilterSidebarProps {
  onApply: (filters: any) => void;
  isLoading?: boolean;
}

export default function FilterSidebar({ onApply, isLoading = false }: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  const [hourLo, setHourLo] = useState(0);
  const [hourHi, setHourHi] = useState(23);
  const [epsM, setEpsM] = useState(100);
  const [minSamp, setMinSamp] = useState(3);
  
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['planned', 'unplanned']);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(['High', 'Low']);
  const [selectedCauses, setSelectedCauses] = useState<string[]>([]);
  
  const [availableCauses, setAvailableCauses] = useState<string[]>([
    "accident", "vehicle_breakdown", "pot_holes", "water_logging", "construction", "congestion", "tree_fall", "road_conditions", "vip_movement", "public_event", "procession", "protest", "others"
  ]);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    fetch(`${apiBase}/metadata`)
      .then(res => res.json())
      .then(data => {
        if (data.causes) {
          setAvailableCauses(data.causes);
          setSelectedCauses(data.causes);
        }
      })
      .catch(err => {
        console.warn("FastAPI metadata fetch failed in FilterSidebar. Using fallback causes.", err);
        setSelectedCauses(availableCauses);
      });
  }, []);

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handlePriorityToggle = (priority: string) => {
    setSelectedPriorities(prev => 
      prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
    );
  };

  const handleCauseToggle = (cause: string) => {
    setSelectedCauses(prev => 
      prev.includes(cause) ? prev.filter(c => c !== cause) : [...prev, cause]
    );
  };

  const handleSelectAllCauses = () => setSelectedCauses(availableCauses);
  const handleClearAllCauses = () => setSelectedCauses([]);

  const handleApply = () => {
    onApply({
      causes: selectedCauses,
      types: selectedTypes,
      priorities: selectedPriorities,
      hour_lo: hourLo,
      hour_hi: hourHi,
      eps_m: epsM,
      min_samp: minSamp
    });
  };

  useEffect(() => {
    if (selectedCauses.length > 0) {
      handleApply();
    }
  }, [selectedCauses.length === availableCauses.length]);

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-[#111111] text-white border-none rounded-full w-12 h-12 flex items-center justify-center shadow-lg cursor-pointer md:hidden"
      >
        <Filter size={18} />
      </button>

      {/* Sidebar */}
      <div 
        className={`shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto flex flex-col bg-bg-card border-r border-border-subtle transition-all duration-300 ${
          isOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="p-5 flex flex-col gap-5 flex-1">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#111111]">
              <Sliders size={14} className="text-[#6B7280]" />
              <span>Filters</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="bg-transparent border-none text-[#9CA3AF] cursor-pointer md:hidden"
            >
              <X size={14} />
            </button>
          </div>

          {/* Hour Range */}
          <div>
            <label className="flex justify-between">
              <span>Hour Window</span>
              <span className="font-mono text-[#111111]">{hourLo} – {hourHi}</span>
            </label>
            <div className="flex flex-col gap-2 mt-1.5">
              <div>
                <span className="text-[9px] text-[#9CA3AF]">Start:</span>
                <input type="range" min="0" max="23" value={hourLo} onChange={(e) => { const val = parseInt(e.target.value); setHourLo(val); if (val > hourHi) setHourHi(val); }} />
              </div>
              <div>
                <span className="text-[9px] text-[#9CA3AF]">End:</span>
                <input type="range" min="0" max="23" value={hourHi} onChange={(e) => { const val = parseInt(e.target.value); setHourHi(val); if (val < hourLo) setHourLo(val); }} />
              </div>
            </div>
          </div>

          {/* Event Type */}
          <div>
            <label>Event Type</label>
            <div className="flex flex-col gap-1.5 mt-1.5">
              {['planned', 'unplanned'].map(type => (
                <div key={type} onClick={() => handleTypeToggle(type)} className="flex items-center gap-2 cursor-pointer text-xs text-[#374151] hover:text-[#111111] transition-colors">
                  {selectedTypes.includes(type) ? (
                    <CheckSquare size={14} className="text-[#111111]" />
                  ) : (
                    <div className="w-3.5 h-3.5 border border-[#D1D5DB] rounded-sm" />
                  )}
                  <span className="capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label>Priority</label>
            <div className="flex flex-col gap-1.5 mt-1.5">
              {['High', 'Low'].map(prio => (
                <div key={prio} onClick={() => handlePriorityToggle(prio)} className="flex items-center gap-2 cursor-pointer text-xs text-[#374151] hover:text-[#111111] transition-colors">
                  {selectedPriorities.includes(prio) ? (
                    <CheckSquare size={14} className="text-[#111111]" />
                  ) : (
                    <div className="w-3.5 h-3.5 border border-[#D1D5DB] rounded-sm" />
                  )}
                  <span>{prio}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DBSCAN */}
          <div>
            <label>DBSCAN Clustering</label>
            <div className="flex flex-col gap-2 mt-1.5">
              <div>
                <div className="flex justify-between text-[9px] text-[#9CA3AF] mb-0.5">
                  <span>Radius:</span>
                  <span className="text-[#111111] font-mono">{epsM}m</span>
                </div>
                <input type="range" min="50" max="300" step="10" value={epsM} onChange={(e) => setEpsM(parseInt(e.target.value))} />
              </div>
              <div>
                <div className="flex justify-between text-[9px] text-[#9CA3AF] mb-0.5">
                  <span>Min Size:</span>
                  <span className="text-[#111111] font-mono">{minSamp}</span>
                </div>
                <input type="range" min="2" max="10" value={minSamp} onChange={(e) => setMinSamp(parseInt(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Causes */}
          <div className="flex flex-col flex-1 min-h-[160px]">
            <div className="flex justify-between items-center mb-1.5">
              <label className="mb-0">Causes</label>
              <div className="flex gap-1.5">
                <button onClick={handleSelectAllCauses} className="bg-transparent border-none text-[#111111] text-[9px] cursor-pointer font-semibold hover:underline">ALL</button>
                <span className="text-[9px] text-[#D1D5DB]">|</span>
                <button onClick={handleClearAllCauses} className="bg-transparent border-none text-[#EF4444] text-[9px] cursor-pointer font-semibold hover:underline">NONE</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto border border-border-subtle rounded-lg bg-bg-main p-2 flex flex-col gap-1.5 max-h-[160px]">
              {availableCauses.map(cause => (
                <div key={cause} onClick={() => handleCauseToggle(cause)} className="flex items-center gap-2 cursor-pointer text-[11px] text-[#374151] hover:text-[#111111] transition-colors">
                  {selectedCauses.includes(cause) ? (
                    <CheckSquare size={12} className="text-[#111111]" />
                  ) : (
                    <div className="w-3 h-3 border border-[#D1D5DB] rounded-sm" />
                  )}
                  <span className="capitalize truncate">{cause.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Apply */}
          <button 
            onClick={handleApply}
            disabled={isLoading}
            className="bg-[#111111] text-white px-4 py-2.5 rounded-lg text-xs font-medium shrink-0 flex items-center justify-center gap-2 hover:bg-[#333] transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Applying...</span>
              </>
            ) : (
              <span>Apply Filters</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
