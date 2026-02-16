import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RadarDataPoint {
  label: string;
  value: number; // -100 to +100 range
  weight: string;
  icon: React.ReactNode;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  className?: string;
}

function scoreToRadius(score: number, maxR: number): number {
  // Map score from roughly -80..+80 to 0.1..1.0 of maxR
  const normalized = Math.max(0.08, Math.min(1, (score + 80) / 160));
  return normalized * maxR;
}

function scoreColor(score: number): string {
  if (score >= 30) return "hsl(var(--signal-buy))";
  if (score >= 10) return "hsl(var(--signal-hold))";
  if (score >= -5) return "hsl(var(--signal-dont-buy))";
  return "hsl(var(--signal-sell))";
}

export function RadarChart({ data, size = 240, className }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const rings = [0.25, 0.5, 0.75, 1.0];
  const angleStep = (2 * Math.PI) / data.length;
  const startAngle = -Math.PI / 2; // top

  // Calculate polygon points for data
  const dataPoints = data.map((d, i) => {
    const angle = startAngle + i * angleStep;
    const r = scoreToRadius(d.value, maxR);
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      labelX: cx + (maxR + 28) * Math.cos(angle),
      labelY: cy + (maxR + 28) * Math.sin(angle),
      axisX: cx + maxR * Math.cos(angle),
      axisY: cy + maxR * Math.sin(angle),
      dotX: cx + r * Math.cos(angle),
      dotY: cy + r * Math.sin(angle),
      color: scoreColor(d.value),
      ...d,
    };
  });

  const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Background rings */}
        {rings.map((scale, i) => (
          <polygon
            key={i}
            points={data
              .map((_, j) => {
                const angle = startAngle + j * angleStep;
                const r = maxR * scale;
                return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
              })
              .join(" ")}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={1}
            opacity={0.5}
          />
        ))}

        {/* Axis lines */}
        {dataPoints.map((p, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.axisX}
            y2={p.axisY}
            stroke="hsl(var(--border))"
            strokeWidth={1}
            opacity={0.4}
          />
        ))}

        {/* Filled radar area */}
        <motion.polygon
          points={polygonPoints}
          fill="hsl(var(--primary) / 0.12)"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Data point dots with glow */}
        {dataPoints.map((p, i) => (
          <g key={i}>
            <motion.circle
              cx={p.dotX}
              cy={p.dotY}
              r={8}
              fill={p.color}
              opacity={0.2}
              initial={{ r: 0 }}
              animate={{ r: 8 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
            />
            <motion.circle
              cx={p.dotX}
              cy={p.dotY}
              r={4}
              fill={p.color}
              stroke="hsl(var(--card))"
              strokeWidth={2}
              initial={{ r: 0 }}
              animate={{ r: 4 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
            />
          </g>
        ))}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={3} fill="hsl(var(--primary))" opacity={0.5} />

        {/* Scanning sweep animation */}
        <motion.line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - maxR}
          stroke="hsl(var(--primary))"
          strokeWidth={1.5}
          opacity={0.3}
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      </svg>

      {/* Score labels positioned around the chart */}
      <div className="mt-4 w-full grid grid-cols-3 gap-3">
        {dataPoints.map((p, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center gap-1 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.15 }}
          >
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {p.icon}
              <span className="text-xs font-medium">{p.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="font-display font-bold text-sm">
                {p.value > 0 ? "+" : ""}
                {p.value}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">{p.weight}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
