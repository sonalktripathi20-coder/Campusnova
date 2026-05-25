'use client';

import React, { useState } from 'react';

// === Line Chart Component (Complaint Trends) ===
interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  glowColor?: string;
}

export const TrendLineChart: React.FC<LineChartProps> = ({ 
  data, 
  height = 180, 
  glowColor = '#3b82f6' 
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  
  const padding = 30;
  const chartHeight = height - padding * 2;
  const chartWidth = 500; // Static grid aspect, responsive SVG will scale it
  
  const maxVal = Math.max(...data.map(d => d.value), 5);
  
  // Calculate points
  const points = data.map((d, idx) => {
    const x = padding + (idx * (chartWidth - padding * 2)) / (data.length - 1);
    const y = padding + chartHeight - (d.value / maxVal) * chartHeight;
    return { x, y, label: d.label, value: d.value };
  });
  
  // Form SVG path string
  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  // Form Area Fill path string
  const areaPath = `
    ${linePath} 
    L ${points[points.length - 1].x} ${height - padding} 
    L ${points[0].x} ${height - padding} Z
  `;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${chartWidth} ${height}`} className="w-full h-auto overflow-visible select-none">
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={glowColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={glowColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const y = padding + chartHeight * p;
          return (
            <line 
              key={i} 
              x1={padding} 
              y1={y} 
              x2={chartWidth - padding} 
              y2={y} 
              className="stroke-white/[0.04] stroke-[1px]" 
            />
          );
        })}

        {/* Area Gradient Fill */}
        <path d={areaPath} fill="url(#area-grad)" />

        {/* Glowing Trend Line */}
        <path 
          d={linePath} 
          fill="none" 
          stroke={glowColor} 
          strokeWidth="3.5" 
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-500"
        />

        {/* Grid X Axis labels */}
        {points.map((p, idx) => (
          <text 
            key={idx} 
            x={p.x} 
            y={height - 8} 
            className="fill-slate-500 text-[11px] font-semibold font-sans text-anchor-middle"
            style={{ textAnchor: 'middle' }}
          >
            {p.label}
          </text>
        ))}

        {/* Data Interactive Node Points */}
        {points.map((p, idx) => (
          <g 
            key={idx} 
            onMouseEnter={() => setActiveIdx(idx)} 
            onMouseLeave={() => setActiveIdx(null)}
            className="cursor-pointer"
          >
            <circle 
              cx={p.x} 
              cy={p.y} 
              r={activeIdx === idx ? "7" : "4.5"} 
              fill="#070b19" 
              stroke={glowColor} 
              strokeWidth="2.5"
              className="transition-all duration-150"
            />
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {activeIdx !== null && (
        <div 
          className="absolute bg-[#0b1329] border border-blue-500/40 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-200 pointer-events-none"
          style={{
            left: `${(points[activeIdx].x / chartWidth) * 100}%`,
            top: `${(points[activeIdx].y / height) * 100 - 45}%`,
            transform: 'translateX(-50%)'
          }}
        >
          <span className="font-bold text-blue-400">{points[activeIdx].value}</span> complaints
        </div>
      )}
    </div>
  );
};


// === Donut Ring Chart (Polished exactly as reference status distribution) ===
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export const CategoryDonutChart: React.FC<DonutChartProps> = ({ 
  data, 
  size = 180 
}) => {
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = 50;
  const circ = 2 * Math.PI * radius;
  const strokeWidth = 16;
  
  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8 justify-center w-full py-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90 overflow-visible">
          {/* Base Empty Ring */}
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={radius} 
            fill="none" 
            stroke="rgba(255,255,255,0.06)" 
            strokeWidth={strokeWidth} 
          />
          {data.map((d, idx) => {
            const percent = d.value / total;
            const strokeDasharray = `${percent * circ} ${circ}`;
            const strokeDashoffset = -accumulatedPercent * circ;
            accumulatedPercent += percent;

            // Compute label line anchor positioning
            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            );
          })}
        </svg>
        
        {/* Empty clean center with simple absolute metrics */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black text-slate-100 font-sans tracking-tight">{total === 1 && data.every(d => d.value === 0) ? 0 : total}</span>
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total</span>
        </div>
      </div>

      {/* Grid Ledger Legend matching friend's layout */}
      <div className="space-y-3">
        {data.map((d, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-md border border-white/[0.08]" style={{ backgroundColor: d.color }} />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400">{d.label}</span>
              <span className="text-xs font-extrabold text-slate-200 font-mono">
                {d.value} <span className="text-[11px] font-medium text-slate-500 font-sans">({Math.round((d.value / total) * 100)}%)</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// === NEW: Vertical Bar Chart Component (Complaints by Category - Image 3 Reference) ===
interface VerticalBarChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

export const VerticalCategoryBarChart: React.FC<VerticalBarChartProps> = ({ 
  data, 
  height = 200 
}) => {
  const paddingLeft = 45;
  const paddingBottom = 40;
  const paddingTop = 20;
  const paddingRight = 20;
  
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = 360;
  
  const maxVal = 3; // Fixed scale matches reference Y-axis limit [0, 0.75, 1.5, 2.25, 3]
  const yTicks = [0, 0.75, 1.5, 2.25, 3];
  
  const barWidth = 44;
  const barGap = (chartWidth - paddingLeft - paddingRight - barWidth * data.length) / (data.length - 1 || 1);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${chartWidth} ${height}`} className="w-full h-auto overflow-visible select-none">
        
        {/* Y Axis Grid Lines & Ticks */}
        {yTicks.map((val, i) => {
          const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
          return (
            <g key={i} className="opacity-90">
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={chartWidth - paddingRight} 
                y2={y} 
                className="stroke-white/[0.04] stroke-[1px]" 
              />
              <text 
                x={paddingLeft - 10} 
                y={y + 4} 
                className="fill-slate-500 text-[11px] font-semibold text-right"
                style={{ textAnchor: 'end' }}
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* X Axis Base Line */}
        <line 
          x1={paddingLeft} 
          y1={paddingTop + chartHeight} 
          x2={chartWidth - paddingRight} 
          y2={paddingTop + chartHeight} 
          className="stroke-[#1d2d5a] stroke-[1.5px]" 
        />

        {/* Vertical Columns */}
        {data.map((d, idx) => {
          const x = paddingLeft + idx * (barWidth + barGap) + barGap / 2;
          const valClamped = Math.min(d.value, maxVal);
          const barValHeight = (valClamped / maxVal) * chartHeight;
          const y = paddingTop + chartHeight - barValHeight;

          return (
            <g key={idx} className="group">
              {/* Column shape matching Image 3 (Solid modern blue fill) */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barValHeight, 2)} // Guarantee minimum thickness
                className="fill-blue-500 hover:fill-blue-400 transition-colors"
                rx={4}
              />
              
              {/* Tooltip value */}
              <text
                x={x + barWidth / 2}
                y={y - 6}
                className="fill-blue-400 text-xs font-bold text-anchor-middle opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ textAnchor: 'middle' }}
              >
                {d.value}
              </text>

              {/* Label under the bar */}
              <text
                x={x + barWidth / 2}
                y={paddingTop + chartHeight + 20}
                className="fill-slate-400 text-[11px] font-semibold font-sans"
                style={{ textAnchor: 'middle' }}
              >
                {d.label}
              </text>
            </g>
          );
        })}

      </svg>
    </div>
  );
};


// === Horizontal Rating Performance Bars ===
interface ProgressBarChartProps {
  data: { label: string; value: number; total: number; color: string }[];
}

export const HorizontalPerformanceChart: React.FC<ProgressBarChartProps> = ({ data }) => {
  return (
    <div className="space-y-4.5 w-full">
      {data.map((item, idx) => {
        const percentage = Math.round((item.value / (item.total || 1)) * 100);
        return (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-slate-400">{item.label}</span>
              <span className="text-slate-200 font-mono">
                {item.value}/{item.total} <span className="text-[11px] font-medium text-slate-500 font-sans">({percentage}%)</span>
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/[0.03] border border-white/[0.06] overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
