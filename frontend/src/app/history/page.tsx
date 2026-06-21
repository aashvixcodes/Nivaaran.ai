'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { History, Trash2, Calendar, ShieldAlert, MapPin, ExternalLink } from 'lucide-react';

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
    <main className="main-content" style={{ marginTop: '20px' }}>
      
      {/* Title */}
      <div className="title-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={28} className="text-[var(--accent-signal)]" style={{ color: 'var(--accent-signal)' }} />
            <span>Prediction History Log</span>
          </h1>
          <p>Browse through locally computed incident simulations and resolved dispatch actions.</p>
        </div>
        
        {history.length > 0 && (
          <button 
            onClick={handleClearHistory} 
            className="btn btn-secondary" 
            style={{ width: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Trash2 size={14} style={{ color: 'var(--accent-critical)' }} />
            <span style={{ color: 'var(--accent-critical)' }}>Clear History Log</span>
          </button>
        )}
      </div>

      {/* History content */}
      {history.length > 0 ? (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Incident Location</th>
                  <th>Event Cause</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Surge Index</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                        <Calendar size={12} className="text-[var(--text-tertiary)]" />
                        {formatDate(item.timestamp)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                        <MapPin size={12} style={{ color: 'var(--accent-signal)', flexShrink: 0 }} />
                        <span>{item.road_name}</span>
                      </div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {item.event_cause.replace('_', ' ')}
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {item.event_type}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: '700', 
                        textTransform: 'uppercase', 
                        color: item.priority === 'High' ? 'var(--accent-warning)' : 'var(--text-tertiary)' 
                      }}>
                        {item.priority}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                      {item.surge.toFixed(1)}%
                    </td>
                    <td>
                      <span className={`badge ${
                        item.severity === 'CRITICAL' ? 'badge-critical' :
                        item.severity === 'WARNING' ? 'badge-warning' : 'badge-normal'
                      }`} style={{ fontSize: '9px', padding: '2px 8px' }}>
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
        <div className="card" style={{ borderStyle: 'dashed', borderWidth: '2px', background: 'transparent', textAlign: 'center', padding: '60px 24px' }}>
          <History size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>No Predictions Found</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px', lineHeight: '1.6' }}>
            Simulations you run on the Predict tab are saved locally in your browser's log. Let's create your first simulation!
          </p>
          <Link href="/predict" className="btn btn-primary" style={{ width: 'auto', display: 'inline-flex', padding: '10px 24px' }}>
            <ExternalLink size={16} />
            <span>Launch Predictor</span>
          </Link>
        </div>
      )}

    </main>
  );
}
