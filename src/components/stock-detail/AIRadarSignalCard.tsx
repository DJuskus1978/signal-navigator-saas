import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Stock, InvestorProfile } from "@/lib/types";
import { PROFILE_WEIGHTS } from "@/lib/types";
import { getSignalLabel, getSignalColor } from "@/lib/radar-scoring";
import { BarChart3, Newspaper, TrendingUp } from "lucide-react";

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
            StocksRadars Signal
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

        {/* Phase Bars */}
        <div className="mb-8 max-w-sm mx-auto space-y-3">
          {(() => {
            const weights = PROFILE_WEIGHTS[profile];
            const phases = [
              { label: isCrypto ? "Market" : "Fundamentals", icon: <BarChart3 className="w-3.5 h-3.5" />, value: Math.round(weights.fundamental * 100) },
              { label: "News", icon: <Newspaper className="w-3.5 h-3.5" />, value: Math.round(weights.sentiment * 100) },
              { label: "Technical", icon: <TrendingUp className="w-3.5 h-3.5" />, value: Math.round(weights.technical * 100) },
            ];
            return phases.map((p) => (
              <div key={p.label} className="flex items-center gap-2">
                <span className="text-muted-foreground">{p.icon}</span>
                <span className="text-[11px] text-muted-foreground w-24 truncate">{p.label}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all bg-primary" style={{ width: `${p.value}%` }} />
                </div>
                <span className="text-[11px] text-muted-foreground w-8 text-right">{p.value}%</span>
              </div>
            ));
          })()}
          <p className="text-[10px] text-muted-foreground text-center mt-1">
            How each analysis phase contributes to the signal.
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
