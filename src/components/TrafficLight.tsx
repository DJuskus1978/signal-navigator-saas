import { Recommendation } from "@/lib/types";
import { getRecommendationLabel, getRecommendationColor, getRecommendationBg } from "@/lib/recommendation-engine";
import { cn } from "@/lib/utils";

interface TrafficLightProps {
  recommendation: Recommendation;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const sizeClasses = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-6 h-6",
};

const dotColor: Record<Recommendation, string> = {
  buy: "bg-signal-buy",
  hold: "bg-signal-hold",
  "dont-buy": "bg-signal-dont-buy",
  sell: "bg-signal-sell",
};

export function TrafficLight({ recommendation, size = "md", showLabel = true }: TrafficLightProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1", getRecommendationBg(recommendation))}>
      <span className={cn("rounded-full animate-pulse-glow", sizeClasses[size], dotColor[recommendation])} />
      {showLabel && (
        <span className={cn("font-semibold text-sm", getRecommendationColor(recommendation))}>
          {getRecommendationLabel(recommendation)}
        </span>
      )}
    </div>
  );
}
