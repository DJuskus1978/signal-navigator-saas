import { motion } from "framer-motion";

export function RadarLogo({ size = 32 }: { size?: number }) {
  const iconSize = size * 0.6;
  const center = iconSize / 2;
  const r1 = iconSize * 0.18;
  const r2 = iconSize * 0.35;
  const r3 = iconSize * 0.5;

  return (
    <div
      className="rounded-lg bg-primary flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={iconSize} height={iconSize} viewBox={`0 0 ${iconSize} ${iconSize}`}>
        {/* Pulsing arcs */}
        {[r3, r2].map((r, i) => (
          <motion.circle
            key={i}
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth={1.2}
            strokeOpacity={0.4}
            animate={{ strokeOpacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
          />
        ))}
        {/* Center dot */}
        <motion.circle
          cx={center}
          cy={center}
          r={r1}
          fill="hsl(var(--primary-foreground))"
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
