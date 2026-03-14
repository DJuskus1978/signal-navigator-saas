/**
 * STOCKSRADARS — Balanced AI Signal System
 *
 * v2.0 — March 2026
 * Changes from v1:
 *  - FIX:     getSignalLabel() — dont-buy now maps to "Avoid" (was "Sell")
 *             sell now maps to "Sell" (was "Strong Sell")
 *  - FIX:     radarScoreToConfidence() — requires minimum phase alignment
 *             before awarding "Strong" confidence (prevents misleading signals)
 *  - UPGRADE: calculateAllRadarScores() — now accepts assetType to select
 *             correct weight map (equity vs crypto PROFILE_WEIGHTS)
 *  - UPGRADE: getDominantDimension() — new helper, identifies which scoring
 *             dimension drove the RadarScore most for a given profile
 *  - UPGRADE: getSignalColor() — now returns 5-tier colors matching all signals
 *
 * Pipeline (unchanged):
 *   Raw PhaseScores → Clamp → Normalize (0–100) → Profile Weights →
 *   RadarScore (0–100) → Signal Tier → Confidence
 */

import type {
  PhaseScores,
  NormalizedScores,
  RadarScore,
  InvestorProfile,
  Recommendation,
  Confidence,
  ProfileWeights,
  AssetType,
  DominantDimension,
} from "./types";
import { PROFILE_WEIGHTS, CRYPTO_PROFILE_WEIGHTS, SIGNAL_META, getProfileWeights } from "./types";

// ─── 1. Raw → Normalised (0–100) ────────────────────────────────────────────
//
// Fundamental & Technical raw ranges: roughly –80 … +110 (from scoring engines).
// Sentiment raw range: roughly –100 … +100.
// Each dimension is independently clamped then scaled to 0–100.

/** Clamp fundamental raw score to –2 … +2 conceptual range */
function clampFundamental(raw: number): number {
  // Empirical engine range: –60 to +130 → divide by 65 to land in –2…+2
  // (previously 35, which saturated at raw > +70 and wasted the upper half of the range)
  return Math.max(-2, Math.min(2, raw / 65));
}

/** Clamp technical raw score to –2 … +2 conceptual range */
function clampTechnical(raw: number): number {
  // Empirical engine range: –80 to +100
  return Math.max(-2, Math.min(2, raw / 35));
}

/** Clamp sentiment raw score to –1 … +1 conceptual range */
function clampSentiment(raw: number): number {
  // Empirical engine range: –100 to +100
  return Math.max(-1, Math.min(1, raw / 50));
}

/** Scale a –2…+2 clamped value to 0–100 */
function normFundTech(clamped: number): number {
  return ((clamped + 2) / 4) * 100;
}

/** Scale a –1…+1 clamped value to 0–100 */
function normSentiment(clamped: number): number {
  return ((clamped + 1) / 2) * 100;
}

export function normalizePhaseScores(phase: PhaseScores): NormalizedScores {
  return {
    fundamental: Math.round(normFundTech(clampFundamental(phase.fundamental))),
    sentiment:   Math.round(normSentiment(clampSentiment(phase.sentiment))),
    technical:   Math.round(normFundTech(clampTechnical(phase.technical))),
  };
}

// ─── 2. Weighted RadarScore ──────────────────────────────────────────────────

export function calculateRadarScore(
  normalized: NormalizedScores,
  weights: ProfileWeights
): number {
  const score =
    weights.fundamental * normalized.fundamental +
    weights.technical   * normalized.technical   +
    weights.sentiment   * normalized.sentiment;
  return Math.round(Math.max(0, Math.min(100, score)));
}

// ─── 3. Signal Conversion ────────────────────────────────────────────────────

export function radarScoreToSignal(score: number): Recommendation {
  if (score >= 80) return "strong-buy";
  if (score >= 65) return "buy";
  if (score >= 45) return "hold";
  if (score >= 30) return "dont-buy";
  return "sell";
}

// ─── 4. Confidence Overlay ───────────────────────────────────────────────────
//
// v2 change: "Strong" now requires BOTH meaningful distance from neutral AND
// minimum phase alignment. Previously a score of 80 with high cross-phase
// disagreement still returned "Strong" — which could mislead users.
//
// New thresholds (calibrated):
//   Strong:   distance ≥ 20 AND alignment ≥ 0.45
//   Moderate: distance ≥ 10 AND alignment ≥ 0.25
//   Weak:     all other cases

export function radarScoreToConfidence(
  normalized: NormalizedScores,
  radarScore: number
): Confidence {
  // Distance from neutral midpoint (50)
  const distanceFromNeutral = Math.abs(radarScore - 50);

  // Cross-phase alignment: how much do all three dimensions agree?
  const vals = [normalized.fundamental, normalized.sentiment, normalized.technical];
  const avg  = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length;
  // alignment: 1 = fully aligned, 0 = total disagreement
  // Max variance for three 0–100 values ≈ 2222 (e.g. [0, 0, 100] → var = 2222)
  // (previously 800, which under-calibrated alignment and collapsed most real
  //  cross-phase disagreements to 0 well before the true theoretical minimum)
  const alignment = Math.max(0, 1 - variance / 2222);

  if (distanceFromNeutral >= 20 && alignment >= 0.45) return "Strong";
  if (distanceFromNeutral >= 10 && alignment >= 0.25) return "Moderate";
  return "Weak";
}

// ─── 5. Dominant Dimension ───────────────────────────────────────────────────
//
// Identifies which scoring dimension contributed most to the final RadarScore
// for a given profile. Used by AIDecisionGuidance to personalise output copy.
//
// Example: short-term has technical weight 0.55 — if technical is also high,
// the guidance copy will reference chart patterns / momentum specifically.

export function getDominantDimension(
  normalized: NormalizedScores,
  weights: ProfileWeights
): DominantDimension {
  const contributions = {
    fundamental: weights.fundamental * normalized.fundamental,
    technical:   weights.technical   * normalized.technical,
    sentiment:   weights.sentiment   * normalized.sentiment,
  };
  // Return the dimension with the highest weighted contribution
  return (Object.keys(contributions) as DominantDimension[]).reduce(
    (best, key) => contributions[key] > contributions[best] ? key : best,
    "fundamental" as DominantDimension
  );
}

// ─── 6. Full Radar Calculation for all profiles ──────────────────────────────
//
// v2 change: accepts optional assetType — selects CRYPTO_PROFILE_WEIGHTS
// for crypto assets, PROFILE_WEIGHTS for equities.
// Backward-compatible: assetType defaults to "stock" if omitted.

export function calculateAllRadarScores(
  phaseScores: PhaseScores,
  assetType: AssetType = "stock"
): Record<InvestorProfile, RadarScore> {
  const normalized = normalizePhaseScores(phaseScores);
  const profiles: InvestorProfile[] = ["short-term", "medium-term", "long-term"];

  const result = {} as Record<InvestorProfile, RadarScore>;

  for (const profile of profiles) {
    const weights   = getProfileWeights(profile, assetType);
    const score     = calculateRadarScore(normalized, weights);
    const dominant  = getDominantDimension(normalized, weights);

    result[profile] = {
      normalized,
      radarScore:        score,
      signal:            radarScoreToSignal(score),
      confidence:        radarScoreToConfidence(normalized, score),
      profile,
      dominantDimension: dominant,
    };
  }

  return result;
}

// ─── 7. Signal labels, descriptions & colors ─────────────────────────────────
//
// v2 change: getSignalLabel() now returns distinct labels for all 5 tiers.
//   dont-buy → "Avoid"      (was "Sell"        — hid the unique 5th tier)
//   sell     → "Sell"       (was "Strong Sell"  — overstated severity)
//
// All label/description logic is driven by SIGNAL_META in types.ts —
// single source of truth, no duplication across components.

export function getSignalLabel(rec: Recommendation): string {
  return SIGNAL_META[rec].label;
}

export function getSignalShortLabel(rec: Recommendation): string {
  return SIGNAL_META[rec].shortLabel;
}

export function getSignalDescription(rec: Recommendation): string {
  return SIGNAL_META[rec].description;
}

/**
 * v2 change: returns 5 distinct color keys instead of 3.
 * UI components can map these to their color tokens however they choose.
 *
 *   "strong-constructive" → strong-buy   (deep green)
 *   "constructive"        → buy          (green)
 *   "neutral"             → hold         (gold/amber)
 *   "cautious"            → dont-buy     (orange)
 *   "strong-cautious"     → sell         (red)
 */
export function getSignalColor(
  rec: Recommendation
): "strong-constructive" | "constructive" | "neutral" | "cautious" | "strong-cautious" {
  return SIGNAL_META[rec].colorKey;
}
