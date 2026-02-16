import { Recommendation } from "@/lib/types";
import { getRecommendationLabel, getRecommendationColor, getRecommendationBg } from "@/lib/recommendation-engine";
import { cn } from "@/lib/utils";

interface TrafficLightProps {
  recommendation: Recommendation;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const sizePx = { sm: 12, md: 16, lg: 24 };

const signalHsl: Record<Recommendation, string> = {
  "strong-buy": "var(--signal-strong-buy)",
  buy: "var(--signal-buy)",
  hold: "var(--signal-hold)",
  "dont-buy": "var(--signal-dont-buy)",
  sell: "var(--signal-sell)",
};

export function TrafficLight({ recommendation, size = "md", showLabel = true }: TrafficLightProps) {
  const s = sizePx[size];
  const center = s / 2;
  const r1 = s * 0.2;
  const r2 = s * 0.38;
  const r3 = s * 0.5;
  const color = `hsl(${signalHsl[recommendation]})`;

  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1", getRecommendationBg(recommendation))}>
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="shrink-0">
        {[r3, r2].map((r, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={1}
            opacity={0.35}
            className="animate-pulse"
          />
        ))}
        <circle cx={center} cy={center} r={r1} fill={color} className="animate-pulse" />
      </svg>
      {showLabel && (
        <span className={cn("font-semibold text-sm", getRecommendationColor(recommendation))}>
          {getRecommendationLabel(recommendation)}
        </span>
      )}
    </div>
  );
}
