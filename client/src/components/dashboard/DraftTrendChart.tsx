"use client";

import { cn } from "@/lib/utils";

interface DraftTrendChartProps {
  data: number[]; // 7 days of draft counts
  className?: string;
}

export function DraftTrendChart({ data, className }: DraftTrendChartProps) {
  const maxValue = Math.max(...data, 1);
  const width = 280;
  const height = 80;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const stepX = chartWidth / 6;

  const points = data.map((value, index) => {
    const x = padding + index * stepX;
    const y = padding + chartHeight - (value / maxValue) * chartHeight;
    return { x, y };
  });

  const pathData = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPathData =
    "M" +
    points[0].x +
    " " +
    (padding + chartHeight) +
    " " +
    pathData +
    " L" +
    points[points.length - 1].x +
    " " +
    (padding + chartHeight) +
    " Z";

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className={cn("w-full max-w-xs", className)}>
      <div className="relative h-20" style={{ width }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--terracotta))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--terracotta))" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--terracotta))" />
              <stop offset="100%" stopColor="hsl(var(--accent-strong))" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            d={areaPathData}
            fill="url(#trend-gradient)"
            className="transition-all duration-500"
          />

          {/* Line */}
          <path
            d={pathData}
            stroke="url(#line-gradient)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500"
          />

          {/* Points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={4}
              fill="hsl(var(--background))"
              stroke="hsl(var(--terracotta))"
              strokeWidth="2.5"
              className="transition-all duration-200 hover:r-5 hover:stroke-[hsl(var(--terracotta-strong))]"
            />
          ))}

          {/* Day labels */}
          {dayLabels.map((day, i) => (
            <text
              key={day}
              x={padding + i * stepX}
              y={height - 4}
              textAnchor="middle"
              fontSize="10"
              fill="hsl(var(--muted-foreground))"
              fontFamily="var(--font-body)"
              className="select-none"
            >
              {day}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

interface SparklineProps {
  data: number[];
  color?: "terracotta" | "accent" | "emerald" | "amber";
  className?: string;
}

export function Sparkline({ data, color = "terracotta", className }: SparklineProps) {
  const maxValue = Math.max(...data, 1);
  const minValue = Math.min(...data);
  const width = 120;
  const height = 32;
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const stepX = chartWidth / (data.length - 1);

  const points = data.map((value, index) => {
    const x = padding + index * stepX;
    const y = padding + chartHeight - ((value - minValue) / (maxValue - minValue || 1)) * chartHeight;
    return { x, y };
  });

  const pathData = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const colorMap = {
    terracotta: "hsl(var(--terracotta))",
    accent: "hsl(var(--accent-strong))",
    emerald: "hsl(var(--destructive))",
    amber: "hsl(var(--warning))",
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn("w-full h-auto", className)} preserveAspectRatio="none">
      <path
        d={pathData}
        stroke={colorMap[color]}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2.5}
        fill={colorMap[color]}
      />
    </svg>
  );
}