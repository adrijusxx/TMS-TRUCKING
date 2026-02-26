'use client';

import React from 'react';

interface ComplianceGaugeProps {
  value: number; // 0-100 percentage
  size?: number;
  label?: string;
}

export default function ComplianceGauge({
  value,
  size = 120,
  label = 'Compliance',
}: ComplianceGaugeProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // half circle
  const offset = circumference - (clampedValue / 100) * circumference;

  const getColor = (v: number) => {
    if (v >= 90) return '#16a34a'; // green-600
    if (v >= 70) return '#ca8a04'; // yellow-600
    if (v >= 50) return '#ea580c'; // orange-600
    return '#dc2626'; // red-600
  };

  const color = getColor(clampedValue);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size * 0.55} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size * 0.55}`}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${strokeWidth / 2} ${size * 0.55} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size * 0.55}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
        {/* Value text */}
        <text
          x={size / 2}
          y={size * 0.45}
          textAnchor="middle"
          className="fill-foreground text-lg font-bold"
          fontSize={size * 0.2}
        >
          {Math.round(clampedValue)}%
        </text>
      </svg>
      <span className="text-xs text-muted-foreground -mt-1">{label}</span>
    </div>
  );
}
