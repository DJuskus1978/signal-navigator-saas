import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Stock, InvestorProfile, Recommendation } from "@/lib/types";
import { PROFILE_WEIGHTS, CRYPTO_PROFILE_WEIGHTS } from "@/lib/types";
import { getSignalLabel, getSignalColor } from "@/lib/radar-scoring";
import { getConsensusSummary, getAgreementLabel, getAgreementColor } from "@/lib/signal-consensus";
import { BarChart3, Newspaper, TrendingUp, Lock } from "lucide-react";

/**
 * AIRadarSignalCard — v2.0
 *
 * Changes from v1:
 *  - FIX: getStatusStyles() now handles all 5 color keys from getSignalColor()
 *         (v1 only handled 3 — "strong-constructive" and "strong-cautious"
 *         would return undefined and crash the component)
 *  - FIX: Phase bars now use CRYPTO_PROFILE_WEIGHTS for crypto assets
 *         (v1 always used equity PROFILE_WEIGHTS regardless of asset type)
 *  - NEW: Consensus badge — shows AI vs analyst agreement when analystData present
 *  - NEW: generateSummary now uses normalized 0–100 scores from radarScores
 *         instead of raw radarScore integer thresholds
 */

interface Props {
  stock: Stock;
  isCrypto: boolean;
  onViewBreakdown: () => void;
  profile: InvestorProfile;
  onProfileChange: (p: InvestorProfile) => void;
  lockedProfiles?: InvestorProfile[];
  onLockedProfileClick?: () => void;
}

// ── Color mapping — now covers all 5 signal tiers ────────────────────────────
// v1 only handled 3 keys; getSignalColor() v2 returns 5.
// "strong-constructive" and "strong-cautious" previously fell through
// to undefined, breaking the UI for Strong Buy and Sell signals.

type ColorKey = "strong-constructive" | "constructive" | "neutral" | "cautious" | "strong-cautious";

function getStatusStyles(color: ColorKey) {
  switch (color) {
    case "strong-constructive":
      return { dot: "hsl(var(--signal-buy))", bg: "hsl(var(--signal-buy-bg))", text: "text-signal-buy", ring: "ring-signal-buy/60" };
    case "constructive":
      return { dot: "hsl(var(--signal-buy))", bg: "hsl(var(--signal-buy-bg))", text: "text-signal-buy", ring: "ring-signal-buy/40" };
    case "neutral":
      return { dot: "hsl(var(--signal-hold))", bg: "hsl(var(--signal-hold-bg))", text: "text-signal-hold", ring: "ring-signal-hold/40" };
    case "cautious":
      return { dot: "hsl(var(--signal-sell))", bg: "hsl(var(--signal-sell-bg))", text: "text-signal-sell", ring: "ring-signal-sell/40" };
    case "strong-cautious":
      return { dot: "hsl(var(--signal-sell))", bg: "hsl(var(--signal-sell-bg))", text: "text-signal-sell", ring: "ring-signal-sell/60" };
  }
}

const PROFILE_LABELS: Record<InvestorProfile, { label: string; period: string }> = {
  "short-term":  { label: "Short",  period: "1d–3mo" },
  "medium-term": { label: "Medium", period: "3–6mo"  },
  "long-term":   { label: "Long",   period: "6mo+"   },
};

const ALL_SIGNALS: Recommendation[] = ["strong-buy", "buy", "hold", "dont-buy", "sell"];

const SIGNAL_STYLES: Record<Recommendation, { activeBg: string; activeText: string; ringColor: string }> = {
  "strong-buy": { activeBg: "bg-signal-buy",  activeText: "text-white", ringColor: "ring-signal-buy/60"  },
  "buy":        { activeBg: "bg-signal-buy",  activeText: "text-white", ringColor: "ring-signal-buy/40"  },
  "hold":       { activeBg: "bg-signal-hold", activeText: "text-white", ringColor: "ring-signal-hold/40" },
  "dont-buy":   { activeBg: "bg-signal-sell", activeText: "text-white", ringColor: "ring-signal-sell/40" },
  "sell":       { activeBg: "bg-signal-sell", activeText: "text-white", ringColor: "ring-signal-sell/60" },
};

// ── Consensus badge color mapping ─────────────────────────────────────────────
const AGREEMENT_STYLES = {
  constructive: "bg-signal-buy/10 text-signal-buy border-signal-buy/30",
  neutral:      "bg-signal-hold/10 text-signal-hold border-signal-hold/30",
  cautious:     "bg-signal-sell/10 text-signal-sell border-signal-sell/30",
};

// ── Summary — uses normalized 0–100 scores when available ────────────────────
function generateSummary(stock: Stock, isCrypto: boolean, radarScore: number): string {
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

// ── ProfileToggle (unchanged from v1) ─────────────────────────────────────────
function ProfileToggle({
  profile, onChange, lockedProfiles = [], onLockedClick,
}: {
  profile: InvestorProfile;
  onChange: (p: InvestorProfile) => void;
  lockedProfiles?: InvestorProfile[];
  onLockedClick?: () => void;
}) {
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
                  className="rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground opacity-50 flex flex-col items-center gap-0"
                >
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {PROFILE_LABELS[p].label}
                  </span>
                  <span className="text-[8px] font-normal leading-tight">{PROFILE_LABELS[p].period}</span>
                </button>
              );
            }
            return (
              <button
                key={p}
                onClick={() => onChange(p)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-all flex flex-col items-center gap-0",
                  profile === p
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{PROFILE_LABELS[p].label}</span>
                <span className={cn(
                  "text-[8px] font-normal leading-tight",
                  profile === p ? "text-primary-foreground/70" : "text-muted-foreground/60",
                )}>
                  {PROFILE_LABELS[p].period}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── SignalToggle (unchanged from v1) ──────────────────────────────────────────
function SignalToggle({ activeSignal }: { activeSignal: Recommendation }) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5">
      {ALL_SIGNALS.map((sig) => {
        const isActive = sig === activeSignal;
        const style = SIGNAL_STYLES[sig];
        return (
          <div
            key={sig}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5",
              isActive
                ? cn(style.activeBg, style.activeText, "shadow-md ring-2 ring-offset-1 ring-offset-card", style.ringColor)
                : "text-muted-foreground/40",
            )}
          >
            {isActive && (
              <span className="w-2.5 h-2.5 rounded-full animate-pulse-glow shrink-0 bg-white" />
            )}
            <span>{getSignalLabel(sig)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AIRadarSignalCard({
  stock, isCrypto, onViewBreakdown, profile, onProfileChange,
  lockedProfiles = [], onLockedProfileClick,
}: Props) {
  const radar = stock.radarScores?.[profile];

  const signal     = radar?.signal      ?? stock.recommendation;
  const radarScore = radar?.radarScore  ?? 50;
  const summary    = generateSummary(stock, isCrypto, radarScore);

  // ── Consensus badge (new) ──────────────────────────────────────────────────
  // Only renders when analystData is present on the stock entity.
  const consensus = radar
    ? getConsensusSummary(radar.signal, stock.analystData)
    : null;

  // ── Phase bars: correct weight map per asset type (v1 bug fix) ────────────
  // v1 always used PROFILE_WEIGHTS regardless of isCrypto.
  // Crypto assets need CRYPTO_PROFILE_WEIGHTS (higher technical weighting).
  const weights = isCrypto ? CRYPTO_PROFILE_WEIGHTS[profile] : PROFILE_WEIGHTS[profile];

  const phases = [
    { label: isCrypto ? "Market"      : "Fundamentals", icon: <BarChart3   className="w-3.5 h-3.5" />, value: Math.round(weights.fundamental * 100) },
    { label: "News & Sentiment",                          icon: <Newspaper  className="w-3.5 h-3.5" />, value: Math.round(weights.sentiment   * 100) },
    { label: "Technical",                                 icon: <TrendingUp className="w-3.5 h-3.5" />, value: Math.round(weights.technical   * 100) },
  ];

  return (
    <Card className="border-2 overflow-hidden">
      <CardContent className="p-8">

        {/* ── Header + Profile Toggle ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            StocksRadars Signal — <span className="normal-case">RadarScore™</span>
          </p>
          <ProfileToggle
            profile={profile}
            onChange={onProfileChange}
            lockedProfiles={lockedProfiles}
            onLockedClick={onLockedProfileClick}
          />
        </div>

        {/* ── Signal Toggle ──────────────────────────────────────────────── */}
        <div className="flex justify-center mb-4 overflow-x-auto">
          <SignalToggle activeSignal={signal} />
        </div>

        {/* ── Consensus Badge (new) ──────────────────────────────────────── */}
        {consensus && (
          <div className="flex justify-center mb-8">
            <div className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
              AGREEMENT_STYLES[getAgreementColor(consensus.agreement)],
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              {getAgreementLabel(consensus.agreement)}
              <span className="opacity-60">·</span>
              <span className="opacity-70 font-normal">{consensus.explanation}</span>
            </div>
          </div>
        )}

        {/* ── Phase Weight Bars ──────────────────────────────────────────── */}
        <div className="mb-10 max-w-sm mx-auto space-y-3">
          {phases.map((p) => (
            <div key={p.label} className="flex items-center gap-2">
              <span className="text-muted-foreground">{p.icon}</span>
              <span className="text-[11px] text-muted-foreground w-28 truncate">{p.label}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all bg-primary"
                  style={{ width: `${p.value}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground w-8 text-right">{p.value}%</span>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground/40 text-center mt-1">
            How each analysis phase contributes to the {isCrypto ? "crypto-weighted" : ""} signal.
          </p>
        </div>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <div className="flex justify-center">
          <Button variant="outline" onClick={onViewBreakdown} className="font-display">
            View Breakdown
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
