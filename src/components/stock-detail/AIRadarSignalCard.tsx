import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Stock, InvestorProfile, Recommendation } from "@/lib/types";
import { PROFILE_WEIGHTS } from "@/lib/types";
import { getSignalLabel, getSignalColor } from "@/lib/radar-scoring";
import { BarChart3, Newspaper, TrendingUp, Lock } from "lucide-react";

interface Props {
  stock: Stock;
  isCrypto: boolean;
  onViewBreakdown: () => void;
  profile: InvestorProfile;
  onProfileChange: (p: InvestorProfile) => void;
  lockedProfiles?: InvestorProfile[];
  onLockedProfileClick?: () => void;
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
  "short-term": "Short",
  "medium-term": "Medium",
  "long-term": "Long",
};

const ALL_SIGNALS: Recommendation[] = ["strong-buy", "buy", "hold", "dont-buy", "sell"];

const SIGNAL_STYLES: Record<Recommendation, { dot: string; text: string; activeBg: string; activeText: string }> = {
  "strong-buy": { dot: "hsl(var(--signal-buy))", text: "text-signal-buy", activeBg: "bg-signal-buy", activeText: "text-white" },
  "buy": { dot: "hsl(var(--signal-buy))", text: "text-signal-buy", activeBg: "bg-signal-buy", activeText: "text-white" },
  "hold": { dot: "hsl(var(--signal-hold))", text: "text-signal-hold", activeBg: "bg-signal-hold", activeText: "text-white" },
  "dont-buy": { dot: "hsl(var(--signal-sell))", text: "text-signal-sell", activeBg: "bg-signal-sell", activeText: "text-white" },
  "sell": { dot: "hsl(var(--signal-sell))", text: "text-signal-sell", activeBg: "bg-signal-sell", activeText: "text-white" },
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

function ProfileToggle({ profile, onChange, lockedProfiles = [], onLockedClick }: { profile: InvestorProfile; onChange: (p: InvestorProfile) => void; lockedProfiles?: InvestorProfile[]; onLockedClick?: () => void }) {
  const profiles: InvestorProfile[] = ["short-term", "medium-term", "long-term"];
  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-2">
        <span className="text-[10px] font-medium text-muted-foreground/50">Horizon Term:</span>
        <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5">
        {profiles.map((p) => {
          const isLocked = lockedProfiles.includes(p);
          if (isLocked) {
            return (
              <button
                key={p}
                onClick={onLockedClick}
                className="rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground opacity-50 flex items-center gap-1"
              >
                <Lock className="w-3 h-3" /> {PROFILE_LABELS[p]}
              </button>
            );
          }
          return (
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
          );
        })}
        </div>
      </div>
    </div>
  );
}

function SignalToggle({ activeSignal }: { activeSignal: Recommendation }) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5">
      {ALL_SIGNALS.map((sig) => {
        const isActive = sig === activeSignal;
        const style = SIGNAL_STYLES[sig];
        const label = getSignalLabel(sig);
        return (
          <div
            key={sig}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5",
              isActive
                ? cn(style.activeBg, style.activeText, "shadow-md ring-2 ring-offset-1 ring-offset-card", sig === "sell" || sig === "dont-buy" ? "ring-signal-sell/40" : sig === "hold" ? "ring-signal-hold/40" : "ring-signal-buy/40")
                : "text-muted-foreground/40"
            )}
          >
            {isActive && (
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse-glow shrink-0 bg-white"
              />
            )}
            <span>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function AIRadarSignalCard({ stock, isCrypto, onViewBreakdown, profile, onProfileChange, lockedProfiles = [], onLockedProfileClick }: Props) {
  const radar = stock.radarScores?.[profile];
  
  const signal = radar?.signal ?? stock.recommendation;
  const radarScore = radar?.radarScore ?? 50;
  const summary = generateSummary(stock, isCrypto, getSignalLabel(signal), radarScore);

  return (
    <Card className="border-2 overflow-hidden">
      <CardContent className="p-8">
        {/* Header + Profile Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            StocksRadars Signal — <span className="normal-case">RadarScore™</span>
          </p>
          <ProfileToggle profile={profile} onChange={onProfileChange} lockedProfiles={lockedProfiles} onLockedClick={onLockedProfileClick} />
        </div>

        {/* Signal Toggle */}
        <div className="flex justify-center mb-8 overflow-x-auto">
          <SignalToggle activeSignal={signal} />
        </div>

        {/* Phase Bars */}
        <div className="mb-10 max-w-sm mx-auto space-y-3">
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
          <p className="text-[10px] text-muted-foreground/40 text-center mt-1">
            How each analysis phase contributes to the signal.
          </p>
        </div>

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
