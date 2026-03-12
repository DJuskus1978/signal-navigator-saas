/**
 * STOCKSRADARS — AI Decision Guidance Engine
 *
 * v2.0 — March 2026
 *
 * Generates investor-profile-aware guidance text for a given RadarScore result.
 * This replaces the previous generateGuidance() implementation which accepted
 * an InvestorProfile parameter but ignored it entirely, returning identical
 * copy for all three horizons.
 *
 * v2 generates distinct guidance for each of the 15 combinations:
 *   5 signal tiers × 3 investor profiles = 15 unique guidance variants
 *
 * Additionally uses dominantDimension (new in RadarScore v2) to make the
 * guidance copy reference the specific driver of the signal, not just the
 * signal tier in isolation.
 *
 * Output structure:
 *   - headline:    1 sentence summary (shown on card)
 *   - rationale:   2-3 sentences explaining the signal in profile context
 *   - action:      specific, actionable next step for this profile
 *   - caveat:      risk or limitation to be aware of
 */

import type {
  Recommendation,
  InvestorProfile,
  DominantDimension,
  NormalizedScores,
  Confidence,
} from "./types";
import { PROFILE_WEIGHTS, CRYPTO_PROFILE_WEIGHTS } from "./types";

// ─── Output interface ────────────────────────────────────────────────────────

export interface GuidanceOutput {
  headline:  string;
  rationale: string;
  action:    string;
  caveat:    string;
}

// ─── 1. Dimension-specific copy fragments ────────────────────────────────────
//
// These fragments are assembled into full sentences based on which dimension
// is dominant and what the signal direction is.

const DIMENSION_DRIVER: Record<DominantDimension, Record<"bullish" | "bearish" | "neutral", string>> = {
  fundamental: {
    bullish: "strong underlying business fundamentals — solid earnings growth, healthy margins, and favourable valuation",
    bearish: "weakening fundamental signals — deteriorating margins, earnings pressure, or elevated valuation risk",
    neutral: "mixed fundamental signals with no clear directional conviction from financial metrics",
  },
  technical: {
    bullish: "positive price momentum and chart structure — RSI, MACD, and moving average alignment support upside",
    bearish: "deteriorating technical structure — bearish momentum, RSI in oversold territory, or moving average breakdown",
    neutral: "neutral technical conditions — no strong momentum signal in either direction from price action",
  },
  sentiment: {
    bullish: "positive news flow and market sentiment — favourable analyst activity and constructive macro backdrop",
    bearish: "negative sentiment environment — adverse news cycle, analyst downgrades, or deteriorating macro conditions",
    neutral: "mixed sentiment signals — neither clearly positive nor negative news driving conviction",
  },
};

function getDimensionPolarity(
  normalized: NormalizedScores,
  dominant: DominantDimension
): "bullish" | "bearish" | "neutral" {
  const score = normalized[dominant];
  if (score >= 60) return "bullish";
  if (score <= 40) return "bearish";
  return "neutral";
}

// ─── 2. Profile-specific action copy ─────────────────────────────────────────

const PROFILE_LABEL: Record<InvestorProfile, string> = {
  "short-term":  "short-term trader",
  "medium-term": "medium-term investor",
  "long-term":   "long-term investor",
};

const PROFILE_HORIZON: Record<InvestorProfile, string> = {
  "short-term":  "days to weeks",
  "medium-term": "weeks to months",
  "long-term":   "months to years",
};

function getActionCopy(
  signal: Recommendation,
  profile: InvestorProfile,
  confidence: Confidence
): string {
  const horizon = PROFILE_HORIZON[profile];
  const confStr = confidence === "Strong" ? "High confidence — " : confidence === "Moderate" ? "Moderate confidence — " : "Low confidence — ";

  const actions: Record<Recommendation, Record<InvestorProfile, string>> = {
    "strong-buy": {
      "short-term":  `${confStr}consider entry now with tight stop-loss. Target the move over ${horizon}. Position size per your risk rules.`,
      "medium-term": `${confStr}favourable entry point for a position to hold over ${horizon}. Set a stop below recent support.`,
      "long-term":   `${confStr}strong fundamental backing supports accumulation. Consider building a full position over ${horizon}.`,
    },
    "buy": {
      "short-term":  `${confStr}set up an entry. Watch for short-term confirmation (price above EMA20) before committing full size.`,
      "medium-term": `${confStr}consider a partial entry now, add on confirmation. Hold period target: ${horizon}.`,
      "long-term":   `${confStr}initiate or add to a position. Long-term thesis is intact — hold through short-term volatility.`,
    },
    "hold": {
      "short-term":  "No clear momentum signal. Sit out until a stronger directional signal emerges.",
      "medium-term": "No new entry signal. Existing positions may be held. Wait for RadarScore to strengthen before adding.",
      "long-term":   "Long-term thesis unchanged. Hold existing positions. No new capital deployment recommended yet.",
    },
    "dont-buy": {
      "short-term":  "Avoid entry. Risk/reward does not favour a trade in this direction over the short term.",
      "medium-term": "Do not initiate a new position. Conditions are not favourable for medium-term entry.",
      "long-term":   "Not a buying opportunity. Revisit if fundamentals or technicals improve materially.",
    },
    "sell": {
      "short-term":  "Exit or reduce exposure. Bearish conditions are likely to persist over the short term.",
      "medium-term": "Consider reducing or closing positions. Deteriorating conditions across multiple dimensions.",
      "long-term":   "Re-evaluate the long-term thesis. Sustained weakness in fundamentals warrants a position review.",
    },
  };

  return actions[signal][profile];
}

// ─── 3. Caveat copy ──────────────────────────────────────────────────────────

function getCaveat(
  signal: Recommendation,
  confidence: Confidence,
  normalized: NormalizedScores
): string {
  // Check for cross-dimension disagreement
  const scores = [normalized.fundamental, normalized.sentiment, normalized.technical];
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const spread = max - min;

  if (spread > 40) {
    return "Note: significant disagreement across scoring dimensions. One dimension is driving this signal strongly while others diverge — treat with extra caution.";
  }

  if (confidence === "Weak") {
    return "Low-confidence signal — conditions are close to neutral. Small changes in data inputs could shift the signal tier.";
  }

  const caveats: Record<Recommendation, string> = {
    "strong-buy": "Even high-conviction signals carry risk. Apply position sizing rules and always use a stop-loss.",
    "buy":        "Conditions are favourable but not exceptional. Use appropriate position sizing for a non-confirmed entry.",
    "hold":       "Neutral conditions can persist or resolve in either direction. Set alerts for signal changes.",
    "dont-buy":   "This is not a sell signal — existing positions need not be exited. Avoid new entries until conditions improve.",
    "sell":       "StocksRadars signals are not financial advice. Always conduct your own research before exiting any position.",
  };

  return caveats[signal];
}

// ─── 4. Main export ──────────────────────────────────────────────────────────

/**
 * Generate profile-aware AI guidance for a RadarScore result.
 *
 * @param signal      - the Recommendation from RadarScore
 * @param profile     - the investor's horizon (short/medium/long-term)
 * @param normalized  - the NormalizedScores (0–100 per dimension)
 * @param confidence  - the Confidence tier from RadarScore
 * @param dominant    - which dimension drove the score most
 * @returns GuidanceOutput with headline, rationale, action, and caveat
 */
export function generateGuidance(
  signal:     Recommendation,
  profile:    InvestorProfile,
  normalized: NormalizedScores,
  confidence: Confidence,
  dominant:   DominantDimension
): GuidanceOutput {
  const profileLabel   = PROFILE_LABEL[profile];
  const polarity       = getDimensionPolarity(normalized, dominant);
  const driverCopy     = DIMENSION_DRIVER[dominant][polarity];

  // ── Headline ──────────────────────────────────────────────────────────────
  const signalLabel = signal === "dont-buy" ? "Avoid" : signal === "sell" ? "Sell" : signal.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
  const headline = `${signalLabel} — ${confidence} signal for ${profileLabel}s.`;

  // ── Rationale ─────────────────────────────────────────────────────────────
  // Opens with the dominant driver, then contextualises for the profile.
  const profileContexts: Record<InvestorProfile, Record<Recommendation, string>> = {
    "short-term": {
      "strong-buy": `RadarScore™ is driven by ${driverCopy}. For short-term traders, this momentum alignment creates a high-probability setup over the coming days.`,
      "buy":        `RadarScore™ is led by ${driverCopy}. The short-term outlook is constructive — watch price action for entry confirmation.`,
      "hold":       `RadarScore™ reflects ${driverCopy}. No clear short-term catalyst is evident. Momentum traders should wait for a breakout signal.`,
      "dont-buy":   `RadarScore™ shows ${driverCopy}. Short-term risk/reward is unfavourable. Avoid initiating a position at current levels.`,
      "sell":       `RadarScore™ is driven by ${driverCopy}. Short-term price action is likely to remain under pressure.`,
    },
    "medium-term": {
      "strong-buy": `RadarScore™ is driven by ${driverCopy}. The medium-term setup is compelling — conditions support holding a position over weeks to months.`,
      "buy":        `RadarScore™ is led by ${driverCopy}. The medium-term backdrop is positive, though not at peak conviction.`,
      "hold":       `RadarScore™ reflects ${driverCopy}. Medium-term investors should wait for clearer directional signals before committing capital.`,
      "dont-buy":   `RadarScore™ shows ${driverCopy}. Medium-term conditions do not justify a new entry at this time.`,
      "sell":       `RadarScore™ is driven by ${driverCopy}. Medium-term conditions are deteriorating — review existing positions.`,
    },
    "long-term": {
      "strong-buy": `RadarScore™ is driven by ${driverCopy}. The long-term investment case is strong — fundamentals and trend support multi-month holding.`,
      "buy":        `RadarScore™ is led by ${driverCopy}. Long-term investors can consider initiating or adding to a position with confidence.`,
      "hold":       `RadarScore™ reflects ${driverCopy}. Long-term investors should maintain existing positions but defer new capital until fundamentals improve.`,
      "dont-buy":   `RadarScore™ shows ${driverCopy}. Long-term conditions are not yet supportive of a new position. Patience is warranted.`,
      "sell":       `RadarScore™ is driven by ${driverCopy}. Long-term investors should reassess the thesis — sustained fundamental weakness is a concern.`,
    },
  };

  const rationale = profileContexts[profile][signal];

  // ── Action + Caveat ───────────────────────────────────────────────────────
  const action = getActionCopy(signal, profile, confidence);
  const caveat = getCaveat(signal, confidence, normalized);

  return { headline, rationale, action, caveat };
}

// ─── 5. Convenience: generate all three profiles at once ─────────────────────

export function generateAllGuidance(
  signal:     Recommendation,
  normalized: NormalizedScores,
  confidence: Confidence,
  dominant:   DominantDimension
): Record<InvestorProfile, GuidanceOutput> {
  const profiles: InvestorProfile[] = ["short-term", "medium-term", "long-term"];
  const result = {} as Record<InvestorProfile, GuidanceOutput>;
  for (const profile of profiles) {
    result[profile] = generateGuidance(signal, profile, normalized, confidence, dominant);
  }
  return result;
}
