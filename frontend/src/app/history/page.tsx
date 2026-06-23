'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { History, Trash2, Calendar, MapPin, ArrowUpRight } from 'lucide-react';

interface HistoryItem {
  timestamp: string;
  road_name: string;
  event_cause: string;
  event_type: string;
  priority: string;
  surge: number;
  severity: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const localHist = JSON.parse(localStorage.getItem('nivaaran_history') || '[]');
    setHistory(localHist);
  }, []);

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your prediction history? This action cannot be undone.")) {
      localStorage.removeItem('nivaaran_history');
      setHistory([]);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 animate-fade-in">
      
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E5E7EB] pb-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <History size={20} className="text-[#111111]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Local Logs</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111111] mb-2">
            Prediction History Log
          </h1>
          <p className="text-sm text-[#6B7280]">
            Browse through locally computed incident simulations and resolved dispatch actions.
          </p>
        </div>
        
        {history.length > 0 && (
          <button 
            onClick={handleClearHistory} 
            className="inline-flex items-center gap-2 px-4 py-2 border border-pastel-red-text/20 bg-bg-card text-pastel-red-text text-xs font-semibold rounded-lg hover:bg-pastel-red/50 transition-all duration-200 cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Clear History Log</span>
          </button>
        )}
      </div>

      {/* History content */}
      {history.length > 0 ? (
        <div className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-bg-neutral border-b border-border-subtle">
                  <th className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] px-6 py-4 text-left">Timestamp</th>
                  <th className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] px-6 py-4 text-left">Incident Location</th>
                  <th className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] px-6 py-4 text-left">Event Cause</th>
                  <th className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] px-6 py-4 text-left">Type</th>
                  <th className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] px-6 py-4 text-left">Priority</th>
                  <th className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] px-6 py-4 text-left">Surge Index</th>
                  <th className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] px-6 py-4 text-left">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {history.map((item, idx) => (
                  <tr key={idx} className="hover:bg-bg-neutral transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs font-mono text-[#4B5563]">
                        <Calendar size={12} className="text-[#9CA3AF]" />
                        {formatDate(item.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium text-xs text-[#111111]">
                        <MapPin size={12} className="text-[#6B7280] flex-shrink-0" />
                        <span>{item.road_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#374151] capitalize">
                      {item.event_cause.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#6B7280]">
                      {item.event_type}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        item.priority === 'High' ? 'text-amber-600' : 'text-[#9CA3AF]'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono font-semibold text-[#111111]">
                      {item.surge.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider ${
                        item.severity === 'CRITICAL' ? 'bg-pastel-red text-pastel-red-text border border-pastel-red-text/10' :
                        item.severity === 'WARNING' ? 'bg-pastel-amber text-pastel-amber-text border border-pastel-amber-text/10' :
                        'bg-pastel-green text-pastel-green-text border border-pastel-green-text/10'
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-bg-card border-2 border-dashed border-border-subtle rounded-xl text-center py-20 px-6 max-w-lg mx-auto animate-slide-up">
          <div className="flex items-center justify-center w-12 h-12 border border-border-subtle rounded-full mx-auto mb-4 text-[#9CA3AF]">
            <History size={20} />
          </div>
          <h2 className="text-base font-semibold text-[#111111] mb-2">No Predictions Found</h2>
          <p className="text-xs text-[#6B7280] leading-relaxed mb-8">
            Simulations you run on the Predict tab are saved locally in your browser's log. Let's create your first simulation!
          </p>
          <Link 
            href="/predict" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] text-white text-xs font-medium rounded-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
          >
            <span>Launch Predictor</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      )}

    </main>
  );
}
