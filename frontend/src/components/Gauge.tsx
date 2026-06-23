'use client';

import React from 'react';

interface GaugeProps {
  value: number; // 0 to 100
}

export default function Gauge({ value }: GaugeProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  
  const radius = 40;
  const strokeWidth = 6;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  let strokeColor = '#10b981';
  let statusText = 'NORMAL FLOW';
  
  if (clampedValue > 65) {
    strokeColor = '#111111';
    statusText = 'CRITICAL SURGE';
  } else if (clampedValue >= 35) {
    strokeColor = '#6B7280';
    statusText = 'ELEVATED';
  }

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 65" className="w-full max-w-[180px]">
        {/* Background Arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Foreground Arc */}
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
        <text
          x="50"
          y="48"
          style={{ fontSize: '18px', fill: '#111111', textAnchor: 'middle', fontWeight: '700' }}
        >
          {clampedValue.toFixed(1)}%
        </text>
        <text
          x="50"
          y="62"
          style={{ fontSize: '5px', fill: '#9CA3AF', textAnchor: 'middle', fontWeight: '600', letterSpacing: '0.08em' }}
        >
          {statusText}
        </text>
      </svg>
    </div>
  );
}
