/**
 * STOCKSRADARS — Signal Consensus Module
 *
 * Compares the RadarScore™ AI signal against Wall Street analyst consensus
 * (sourced from Alpha Vantage) and produces a structured agreement summary.
 *
 * This is a new module in v2.0 — March 2026.
 *
 * Usage:
 *   import { getConsensusSummary } from "./signal-consensus";
 *   const summary = getConsensusSummary(stock.radarScores["medium-term"].signal, stock.analystData);
 *
 * The ConsensusSummary is consumed by:
 *   - ConsensusGauge component (Dashboard)
 *   - AIRadarSignalCard (agreement badge)
 *   - Landing page signal showcase
 */

import type {
  Recommendation,
  AnalystConsensus,
  AnalystData,
  ConsensusAgreement,
  ConsensusSummary,
} from "./types";

// ─── 1. Polarity helpers ─────────────────────────────────────────────────────
//
// Map both signal systems onto a shared 3-level polarity scale:
//   bullish | neutral | bearish
// This allows comparison regardless of the different tier counts
// (RadarScore has 5 tiers, analyst consensus also has 5 but with different names).

type Polarity = "bullish" | "neutral" | "bearish";

function radarPolarity(signal: Recommendation): Polarity {
  if (signal === "strong-buy" || signal === "buy") return "bullish";
  if (signal === "hold")                            return "neutral";
  return "bearish"; // dont-buy | sell
}

function analystPolarity(consensus: AnalystConsensus): Polarity {
  if (consensus === "Strong Buy" || consensus === "Buy") return "bullish";
  if (consensus === "Hold")                              return "neutral";
  return "bearish"; // Sell | Strong Sell
}

// ─── 2. Signal strength (1–5) ────────────────────────────────────────────────
//
// Used to calculate agreementScore — two "Strong Buy" signals score 100,
// a "Strong Buy" vs a "Buy" scores slightly lower, etc.

function radarStrength(signal: Recommendation): number {
  switch (signal) {
    case "strong-buy": return 5;
    case "buy":        return 4;
    case "hold":       return 3;
    case "dont-buy":   return 2;
    case "sell":       return 1;
  }
}

function analystStrength(consensus: AnalystConsensus): number {
  switch (consensus) {
    case "Strong Buy":  return 5;
    case "Buy":         return 4;
    case "Hold":        return 3;
    case "Sell":        return 2;
    case "Strong Sell": return 1;
  }
}

// ─── 3. Agreement score (0–100) ─────────────────────────────────────────────
//
// Measures how closely the two signals agree, accounting for:
//   - Polarity alignment (same direction = base score)
//   - Strength proximity (same tier = bonus)
// Max disagreement (Strong Buy vs Strong Sell) → 0
// Perfect agreement (Strong Buy vs Strong Buy) → 100

function calculateAgreementScore(
  radarSignal: Recommendation,
  analystConsensus: AnalystConsensus
): number {
  const rPolarity = radarPolarity(radarSignal);
  const aPolarity = analystPolarity(analystConsensus);

  // Polarity mismatch → scaled by distance
  if (rPolarity !== aPolarity) {
    const rStr = radarStrength(radarSignal);
    const aStr = analystStrength(analystConsensus);
    const maxDistance = 4; // max possible: 5 vs 1
    const distance = Math.abs(rStr - aStr);
    // Further apart in strength → lower score
    return Math.round(Math.max(0, (1 - distance / maxDistance) * 40));
  }

  // Same polarity: score based on strength proximity
  const rStr = radarStrength(radarSignal);
  const aStr = analystStrength(analystConsensus);
  const distance = Math.abs(rStr - aStr);

  if (distance === 0) return 100; // identical signals
  if (distance === 1) return 80;  // adjacent tiers (e.g. Buy vs Strong Buy)
  if (distance === 2) return 60;  // two tiers apart
  return 45;                      // same polarity but quite different strength
}

// ─── 4. Explanation text ─────────────────────────────────────────────────────

function buildExplanation(
  agreement: ConsensusAgreement,
  radarSignal: Recommendation,
  analystConsensus: AnalystConsensus,
  agreementScore: number
): string {
  const radarLabel   = radarSignal === "dont-buy" ? "Avoid" : radarSignal === "sell" ? "Sell" : radarSignal.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
  const analystLabel = analystConsensus;

  if (agreement === "aligned") {
    if (agreementScore === 100) {
      return `AI and analysts are in full agreement: ${radarLabel}. High-conviction signal.`;
    }
    return `AI (${radarLabel}) and analysts (${analystLabel}) are directionally aligned.`;
  }

  if (agreement === "divergent") {
    return `Divergence detected — AI signals ${radarLabel} while analysts rate ${analystLabel}. Investigate before acting.`;
  }

  // neutral
  return `Mixed signals — AI rates ${radarLabel}, analysts rate ${analystLabel}. No strong consensus.`;
}

// ─── 5. Main export ──────────────────────────────────────────────────────────

/**
 * Compare a RadarScore™ signal against analyst consensus.
 *
 * @param radarSignal      - signal from RadarScore for a given InvestorProfile
 * @param analystData      - AnalystData from the Stock entity (may be null)
 * @returns ConsensusSummary, or null if no analyst data is available
 */
export function getConsensusSummary(
  radarSignal: Recommendation,
  analystData: AnalystData | null | undefined
): ConsensusSummary | null {
  if (!analystData?.consensus) return null;

  const { consensus } = analystData;
  const rPolarity      = radarPolarity(radarSignal);
  const aPolarity      = analystPolarity(consensus);
  const agreementScore = calculateAgreementScore(radarSignal, consensus);

  let agreement: ConsensusAgreement;
  if (rPolarity === aPolarity)   agreement = "aligned";
  else if (rPolarity === "neutral" || aPolarity === "neutral") agreement = "neutral";
  else                           agreement = "divergent";

  return {
    agreement,
    radarSignal,
    analystConsensus: consensus,
    explanation: buildExplanation(agreement, radarSignal, consensus, agreementScore),
    agreementScore,
  };
}

// ─── 6. Convenience helpers for UI ───────────────────────────────────────────

/**
 * Returns a short UI badge string for the agreement state.
 *   "aligned"   → "AI + Analysts Agree"
 *   "divergent" → "Signals Diverge"
 *   "neutral"   → "Mixed Signals"
 */
export function getAgreementLabel(agreement: ConsensusAgreement): string {
  switch (agreement) {
    case "aligned":   return "AI + Analysts Agree";
    case "divergent": return "Signals Diverge";
    case "neutral":   return "Mixed Signals";
  }
}

/**
 * Returns the color key for the agreement badge.
 * Maps to the same token system as getSignalColor().
 */
export function getAgreementColor(
  agreement: ConsensusAgreement
): "constructive" | "cautious" | "neutral" {
  switch (agreement) {
    case "aligned":   return "constructive";
    case "divergent": return "cautious";
    case "neutral":   return "neutral";
  }
}
