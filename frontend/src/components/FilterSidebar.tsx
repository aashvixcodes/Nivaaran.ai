'use client';

import React, { useState, useEffect } from 'react';
import { Filter, Sliders, CheckSquare, Square, X, Calendar, RefreshCw } from 'lucide-react';

interface FilterSidebarProps {
  onApply: (filters: any) => void;
  isLoading?: boolean;
}

export default function FilterSidebar({ onApply, isLoading = false }: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Filter States
  const [hourLo, setHourLo] = useState(0);
  const [hourHi, setHourHi] = useState(23);
  const [epsM, setEpsM] = useState(100);
  const [minSamp, setMinSamp] = useState(3);
  
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['planned', 'unplanned']);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(['High', 'Low']);
  const [selectedCauses, setSelectedCauses] = useState<string[]>([]);
  
  // Available options from metadata
  const [availableCauses, setAvailableCauses] = useState<string[]>([
    "accident", "vehicle_breakdown", "pot_holes", "water_logging", "construction", "congestion", "tree_fall", "road_conditions", "vip_movement", "public_event", "procession", "protest", "others"
  ]);

  // Load metadata for options
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    fetch(`${apiBase}/metadata`)
      .then(res => res.json())
      .then(data => {
        if (data.causes) {
          setAvailableCauses(data.causes);
          setSelectedCauses(data.causes); // Select all by default
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

  const handleSelectAllCauses = () => {
    setSelectedCauses(availableCauses);
  };

  const handleClearAllCauses = () => {
    setSelectedCauses([]);
  };

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

  // Run onApply once on mount after causes are loaded
  useEffect(() => {
    if (selectedCauses.length > 0) {
      handleApply();
    }
  }, [selectedCauses.length === availableCauses.length]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 49,
          background: 'var(--accent-signal)',
          color: '#060913',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(45, 212, 212, 0.4)',
          cursor: 'pointer'
        }}
        className="md:hidden"
      >
        <Filter size={20} />
      </button>

      {/* Sidebar Container */}
      <div 
        style={{
          width: isOpen ? '280px' : '0px',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'var(--bg-surface)',
          borderRight: isOpen ? '1px solid var(--border-subtle)' : 'none',
          height: 'calc(100vh - 84px)',
          position: 'sticky',
          top: '84px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}
      >
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', flex: '1' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Sliders size={14} className="text-[var(--accent-signal)]" style={{ color: 'var(--accent-signal)' }} />
              <span>Dashboard Filters</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="md:hidden" 
              style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Temporal Hour Range Slider */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Temporal Hour window</span>
              <span style={{ color: 'var(--accent-signal)', fontFamily: 'var(--font-mono)' }}>{hourLo} - {hourHi}</span>
            </label>
            <div className="slider-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <div>
                <span style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>Start Hour:</span>
                <input 
                  type="range" 
                  min="0" 
                  max="23" 
                  value={hourLo} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setHourLo(val);
                    if (val > hourHi) setHourHi(val);
                  }} 
                />
              </div>
              <div>
                <span style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>End Hour:</span>
                <input 
                  type="range" 
                  min="0" 
                  max="23" 
                  value={hourHi} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setHourHi(val);
                    if (val < hourLo) setHourLo(val);
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Event Type Filters */}
          <div>
            <label>Event Type</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              {['planned', 'unplanned'].map(type => (
                <div 
                  key={type} 
                  onClick={() => handleTypeToggle(type)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}
                >
                  {selectedTypes.includes(type) ? (
                    <CheckSquare size={14} style={{ color: 'var(--accent-signal)' }} />
                  ) : (
                    <div style={{ width: '14px', height: '14px', border: '1px solid var(--border-strong)', borderRadius: '2px' }} />
                  )}
                  <span style={{ textTransform: 'capitalize' }}>{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Filters */}
          <div>
            <label>Priority level</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              {['High', 'Low'].map(prio => (
                <div 
                  key={prio} 
                  onClick={() => handlePriorityToggle(prio)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}
                >
                  {selectedPriorities.includes(prio) ? (
                    <CheckSquare size={14} style={{ color: 'var(--accent-signal)' }} />
                  ) : (
                    <div style={{ width: '14px', height: '14px', border: '1px solid var(--border-strong)', borderRadius: '2px' }} />
                  )}
                  <span>{prio} Priority</span>
                </div>
              ))}
            </div>
          </div>

          {/* DBSCAN settings */}
          <div>
            <label>DBSCAN Cluster settings</label>
            <div className="slider-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>
                  <span>Cluster Radius:</span>
                  <span style={{ color: 'var(--accent-signal)' }}>{epsM}m</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="300" 
                  step="10"
                  value={epsM} 
                  onChange={(e) => setEpsM(parseInt(e.target.value))} 
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>
                  <span>Min Cluster Size:</span>
                  <span style={{ color: 'var(--accent-signal)' }}>{minSamp}</span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="10" 
                  value={minSamp} 
                  onChange={(e) => setMinSamp(parseInt(e.target.value))} 
                />
              </div>
            </div>
          </div>

          {/* Incident Causes list */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: '1', minHeight: '180px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ marginBottom: 0 }}>Incident Causes</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={handleSelectAllCauses} style={{ background: 'none', border: 'none', color: 'var(--accent-signal)', fontSize: '9px', cursor: 'pointer', fontWeight: '600' }}>ALL</button>
                <span style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>|</span>
                <button onClick={handleClearAllCauses} style={{ background: 'none', border: 'none', color: 'var(--accent-critical)', fontSize: '9px', cursor: 'pointer', fontWeight: '600' }}>NONE</button>
              </div>
            </div>
            
            <div style={{ flex: '1', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '6px', background: 'var(--bg-input)', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px' }}>
              {availableCauses.map(cause => (
                <div 
                  key={cause} 
                  onClick={() => handleCauseToggle(cause)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)' }}
                >
                  {selectedCauses.includes(cause) ? (
                    <CheckSquare size={12} style={{ color: 'var(--accent-signal)' }} />
                  ) : (
                    <div style={{ width: '12px', height: '12px', border: '1px solid var(--border-strong)', borderRadius: '2px' }} />
                  )}
                  <span style={{ textTransform: 'capitalize', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {cause.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Apply button */}
          <button 
            onClick={handleApply}
            className="btn btn-primary" 
            style={{ padding: '8px 16px', fontSize: '12px', flexShrink: 0 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Applying Filters...</span>
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
