import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Stock, InvestorProfile } from "@/lib/types";
import { PROFILE_WEIGHTS } from "@/lib/types";
import { getSignalLabel, getSignalColor } from "@/lib/radar-scoring";

interface Props {
  stock: Stock;
  isCrypto: boolean;
  onViewBreakdown: () => void;
  profile: InvestorProfile;
  onProfileChange: (p: InvestorProfile) => void;
}

function getStatusStyles(color: "constructive" | "neutral" | "cautious") {
  switch (color) {
    case "constructive":
      return { dot: "hsl(var(--signal-buy))", bg: "hsl(var(--signal-buy-bg))", text: "text-signal-buy" };
    case "neutral":
      return { dot: "hsl(var(--signal-hold))", bg: "hsl(var(--signal-hold-bg))", text: "text-signal-hold" };
    case "cautious":
      return { dot: "hsl(var(--signal-sell))", bg: "hsl(var(--signal-sell-bg))", text: "text-signal-sell" };
  }
}

const PROFILE_LABELS: Record<InvestorProfile, string> = {
  conservative: "Conservative",
  balanced: "Balanced",
  active: "Active",
};

function generateSummary(stock: Stock, isCrypto: boolean, signal: string, radarScore: number): string {
  if (radarScore >= 80) {
    return `Positive ${isCrypto ? "market structure" : "fundamentals"} and strengthening momentum align with constructive market conditions for ${stock.name}.`;
  }
  if (radarScore >= 65) {
    return `${stock.name} shows solid ${isCrypto ? "market positioning" : "fundamentals"} supported by positive sentiment and favorable technical trends.`;
  }
  if (radarScore >= 45) {
    return `${isCrypto ? "Market structure" : "Company fundamentals"} remain stable for ${stock.name}, while short-term momentum is mixed.`;
  }
  if (radarScore >= 30) {
    return `Weakening momentum and mixed sentiment create a cautious outlook for ${stock.name}. ${isCrypto ? "Market structure" : "Fundamentals"} show pressure.`;
  }
  return `Multiple analysis phases show stress for ${stock.name}. Weakening momentum and negative sentiment outweigh ${isCrypto ? "market positioning" : "stable fundamentals"}.`;
}

function ProfileToggle({ profile, onChange }: { profile: InvestorProfile; onChange: (p: InvestorProfile) => void }) {
  const profiles: InvestorProfile[] = ["conservative", "balanced", "active"];
  return (
    <div className="space-y-2">
      <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5">
        {profiles.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-all",
              profile === p
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {PROFILE_LABELS[p]}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        F {Math.round(PROFILE_WEIGHTS[profile].fundamental * 100)}% • N {Math.round(PROFILE_WEIGHTS[profile].sentiment * 100)}% • T {Math.round(PROFILE_WEIGHTS[profile].technical * 100)}%
      </p>
    </div>
  );
}

export function AIRadarSignalCard({ stock, isCrypto, onViewBreakdown, profile, onProfileChange }: Props) {
  const radar = stock.radarScores?.[profile];
  
  // Fallback for stocks without radarScores (shouldn't happen)
  const signal = radar?.signal ?? stock.recommendation;
  const radarScore = radar?.radarScore ?? 50;
  const confidence = radar?.confidence ?? stock.confidence;
  
  const signalLabel = getSignalLabel(signal);
  const colorKey = getSignalColor(signal);
  const styles = getStatusStyles(colorKey);
  const summary = generateSummary(stock, isCrypto, signalLabel, radarScore);

  return (
    <Card className="border-2 overflow-hidden">
      <CardContent className="p-8">
        {/* Header + Profile Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            AI Radar Signal
          </p>
          <ProfileToggle profile={profile} onChange={onProfileChange} />
        </div>

        {/* Big Status Badge */}
        <div className="flex justify-center mb-8">
          <div
            className="inline-flex items-center gap-3 rounded-full px-6 py-3"
            style={{ backgroundColor: styles.bg }}
          >
            <span
              className="w-3 h-3 rounded-full animate-pulse-glow"
              style={{ backgroundColor: styles.dot }}
            />
            <span className={cn("font-display text-2xl font-bold", styles.text)}>
              {signalLabel}
            </span>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Low</span>
            <span className="font-display font-bold text-sm text-foreground">{radarScore}%</span>
            <span>High</span>
          </div>
          <Progress value={radarScore} className="h-1.5" />
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Adjust how the AI prioritizes {isCrypto ? "market structure" : "fundamentals"}, news, and technical momentum.
          </p>
        </div>

        {/* Summary */}
        <p className="text-center text-muted-foreground leading-relaxed mb-8 max-w-lg mx-auto">
          {summary}
        </p>

        {/* CTA */}
        <div className="flex justify-center">
          <Button variant="outline" onClick={onViewBreakdown} className="font-display">
            View Breakdown
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
