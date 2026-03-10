import { cn } from "@/lib/utils";

interface AIScoreBadgeProps {
  score: number;
  size?: "sm" | "md";
}

export function AIScoreBadge({ score, size = "sm" }: AIScoreBadgeProps) {
  const getColor = () => {
    if (score >= 65) return "text-signal-buy bg-signal-buy-bg";
    if (score >= 45) return "text-signal-hold bg-signal-hold-bg";
    return "text-signal-sell bg-signal-sell-bg";
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1 rounded-full font-bold tabular-nums",
      getColor(),
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
    )}>
      <span className="text-[10px] font-medium opacity-70">AI</span>
      <span>{score}</span>
    </div>
  );
}
