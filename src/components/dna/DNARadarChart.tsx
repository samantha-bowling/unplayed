
import React from 'react';
import type { DNADimension } from '@/utils/game-dna-utils';

interface DNARadarChartProps {
  dimensions: DNADimension[];
}

const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 120;
const LEVELS = 4;

function polarToCartesian(angle: number, radius: number): [number, number] {
  // Start from top (-90deg), go clockwise
  const rad = ((angle - 90) * Math.PI) / 180;
  return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)];
}

const DNARadarChart: React.FC<DNARadarChartProps> = ({ dimensions }) => {
  const n = dimensions.length;
  const angleStep = 360 / n;

  // Grid rings
  const gridRings = Array.from({ length: LEVELS }, (_, i) => {
    const r = (RADIUS / LEVELS) * (i + 1);
    const points = dimensions.map((_, j) => polarToCartesian(j * angleStep, r));
    return points.map(p => p.join(',')).join(' ');
  });

  // Axis lines
  const axes = dimensions.map((_, i) => {
    const [x, y] = polarToCartesian(i * angleStep, RADIUS);
    return { x1: CENTER, y1: CENTER, x2: x, y2: y };
  });

  // Data polygon
  const dataPoints = dimensions.map((d, i) => {
    const r = (d.score / 100) * RADIUS;
    return polarToCartesian(i * angleStep, r);
  });
  const dataPath = dataPoints.map(p => p.join(',')).join(' ');

  // Labels
  const labels = dimensions.map((d, i) => {
    const [x, y] = polarToCartesian(i * angleStep, RADIUS + 28);
    return { x, y, label: d.label, score: d.score };
  });

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[320px] mx-auto" aria-label="Game DNA Radar Chart">
      {/* Grid */}
      {gridRings.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={0.5}
          opacity={0.5}
        />
      ))}

      {/* Axes */}
      {axes.map((a, i) => (
        <line
          key={i}
          {...a}
          stroke="hsl(var(--muted))"
          strokeWidth={0.5}
          opacity={0.4}
        />
      ))}

      {/* Data shape */}
      <polygon
        points={dataPath}
        fill="hsl(var(--primary) / 0.2)"
        stroke="hsl(var(--primary))"
        strokeWidth={2}
      />

      {/* Data points */}
      {dataPoints.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={4}
          fill="hsl(var(--primary))"
          stroke="hsl(var(--background))"
          strokeWidth={1.5}
        />
      ))}

      {/* Labels */}
      {labels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-[9px] font-mono font-medium"
        >
          {l.label}
          <tspan x={l.x} dy="12" className="fill-primary text-[10px] font-bold">
            {l.score}
          </tspan>
        </text>
      ))}
    </svg>
  );
};

export default DNARadarChart;
