/** Pure-SVG charts — no extra dependencies */
import { cn } from "@/lib/utils";

// ── Bar Chart ─────────────────────────────────────────────────
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  className?: string;
}
export function SABarChart({ data, height = 120, className }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className={cn("flex items-end gap-1.5 w-full", className)} style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <p className="text-[9px] text-text-muted tabular-nums font-mono">
            {d.value > 999 ? `${(d.value / 1000).toFixed(1)}k` : d.value}
          </p>
          <div
            className="w-full rounded-t-md transition-all duration-700"
            style={{
              height: `${Math.max((d.value / max) * (height - 28), 4)}px`,
              background: d.color ?? "hsl(var(--primary))",
              opacity: 0.85,
            }}
          />
          <p className="text-[9px] text-text-muted truncate w-full text-center">{d.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Line Sparkline ────────────────────────────────────────────
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
  filled?: boolean;
}
export function SASparkline({ data, color = "hsl(var(--primary))", height = 48, className, filled }: SparklineProps) {
  if (data.length < 2) return null;
  const w = 200;
  const h = height;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 6) - 3,
  }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const fillPath = `${path} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("w-full", className)} preserveAspectRatio="none">
      {filled && (
        <path d={fillPath} fill={color} fillOpacity={0.12} />
      )}
      <path d={path} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={3} fill={color} />
    </svg>
  );
}

// ── Donut Chart ────────────────────────────────────────────────
interface DonutProps {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  className?: string;
}
export function SADonut({ segments, size = 80, className }: DonutProps) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  const r = 28;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={8}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
          />
        );
        offset += dash;
        return el;
      })}
      <circle cx={cx} cy={cy} r={r - 12} fill="hsl(var(--surface-elevated))" />
    </svg>
  );
}

// ── Mini Trend ─────────────────────────────────────────────────
export function SATrend({ value, prev }: { value: number; prev: number }) {
  const diff = value - prev;
  const pct = prev > 0 ? Math.round((diff / prev) * 100) : 0;
  const up = diff >= 0;
  return (
    <span className={cn(
      "text-[10px] font-bold flex items-center gap-0.5",
      up ? "text-emerald-400" : "text-red-400"
    )}>
      {up ? "↑" : "↓"}{Math.abs(pct)}%
    </span>
  );
}
