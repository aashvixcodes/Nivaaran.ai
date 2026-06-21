'use client';

import React from 'react';

interface GaugeProps {
  value: number; // 0 to 100
}

export default function Gauge({ value }: GaugeProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value));
  
  // SVG arc calculation parameters
  // R = 50, Center = (60, 60), Arc goes from -180 deg to 0 deg (semicircle)
  const radius = 40;
  const strokeWidth = 8;
  const circumference = Math.PI * radius; // Half circle circumference
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  // Determine color based on threshold
  let strokeColor = 'var(--accent-normal)';
  let statusText = 'NORMAL FLOW';
  
  if (clampedValue > 65) {
    strokeColor = 'var(--accent-critical)';
    statusText = 'CRITICAL SURGE';
  } else if (clampedValue >= 35) {
    strokeColor = 'var(--accent-warning)';
    statusText = 'CONGESTION WARNING';
  }

  return (
    <div className="gauge-container">
      <svg viewBox="0 0 100 65" className="gauge-svg" style={{ maxWidth: '180px' }}>
        {/* Background Arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Foreground (Filled) Arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.5s' }}
        />
        {/* Numeric Text in Middle */}
        <text
          x="50"
          y="48"
          className="gauge-value"
          style={{ fontSize: '18px', fill: 'var(--text-primary)', textAnchor: 'middle', fontWeight: '700', fontFamily: 'var(--font-display)' }}
        >
          {clampedValue.toFixed(1)}%
        </text>
        
        {/* Label beneath */}
        <text
          x="50"
          y="62"
          style={{ fontSize: '5px', fill: 'var(--text-tertiary)', textAnchor: 'middle', fontWeight: '700', letterSpacing: '0.05em' }}
        >
          {statusText}
        </text>
      </svg>
    </div>
  );
}
