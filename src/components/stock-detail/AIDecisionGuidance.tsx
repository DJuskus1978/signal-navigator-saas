import { Card, CardContent } from "@/components/ui/card";
import type { Stock, InvestorProfile } from "@/lib/types";
import { generateGuidance } from "@/lib/ai-decision-guidance";
import { Compass, AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AIDecisionGuidance — v2.0
 *
 * Previously: used a local generateGuidance() that read raw phaseScores with
 * hardcoded 0/10/20 thresholds and ignored the profile param entirely —
 * returning identical copy for all 3 investor horizons.
 *
 * Now: delegates to src/lib/ai-decision-guidance.ts which generates
 * 15 distinct variants (5 signals × 3 profiles), references the dominant
 * scoring dimension, and structures output as headline / rationale / action / caveat.
 */

interface Props {
  stock: Stock;
  isCrypto: boolean;
  profile: InvestorProfile;
}

export function AIDecisionGuidance({ stock, isCrypto, profile }: Props) {
  const radar = stock.radarScores?.[profile];

  // ── Fallback: no radarScores available yet ───────────────────────────────
  if (!radar) {
    return (
      <Card className="border-2 border-primary bg-background">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="w-5 h-5 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              StocksRadars Decision Guidance
            </p>
          </div>
          <p className="text-sm text-primary/60 leading-relaxed">
            Guidance is generated once RadarScore™ data has loaded for this stock.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Generate profile-aware guidance ─────────────────────────────────────
  const guidance = generateGuidance(
    radar.signal,
    radar.profile,
    radar.normalized,
    radar.confidence,
    radar.dominantDimension,
  );

  // ── Confidence colour for headline accent ────────────────────────────────
  const confidenceColor =
    radar.confidence === "Strong"   ? "text-signal-buy" :
    radar.confidence === "Moderate" ? "text-signal-hold" :
                                      "text-muted-foreground";

  return (
    <Card className="border-2 border-primary bg-background">
      <CardContent className="p-6 space-y-5">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary shrink-0" />
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            StocksRadars Decision Guidance
          </p>
        </div>

        {/* ── Headline ───────────────────────────────────────────────────── */}
        <p className={cn("text-base font-semibold leading-snug", confidenceColor)}>
          {guidance.headline}
        </p>

        {/* ── Rationale ──────────────────────────────────────────────────── */}
        <p className="text-sm text-primary leading-relaxed">
          {guidance.rationale}
        </p>

        {/* ── Action ─────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-2 rounded-md bg-primary/5 border border-primary/20 p-3">
          <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-primary leading-relaxed">
            {guidance.action}
          </p>
        </div>

        {/* ── Caveat ─────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            {guidance.caveat}
          </p>
        </div>

        {/* ── Legal disclaimer ───────────────────────────────────────────── */}
        <p className="text-[10px] text-primary/40 border-t border-primary/10 pt-3">
          This information is not a personal recommendation or investment advice.
          Conduct your own research and consider your financial situation before
          making any investment decisions.
        </p>

      </CardContent>
    </Card>
  );
}
