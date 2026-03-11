/**
 * STOCKSRADARS — Balanced AI Signal System
 *
 * Converts raw phase scores into a normalized 0–100 RadarScore,
 * applies investor-profile weighting, and maps to a 5-tier signal.
 */

import type {
  PhaseScores,
  NormalizedScores,
  RadarScore,
  InvestorProfile,
  Recommendation,
  Confidence,
  ProfileWeights,
} from "./types";
import { PROFILE_WEIGHTS } from "./types";

// ─── 1. Raw → Normalised (0–100) ────────────────────────────────────────────
// Fundamental & Technical raw ranges are roughly –80 … +110 (from the scoring engines).
// Sentiment raw range is roughly –100 … +100.
// We clamp to the documented –2…+2 / –1…+1 conceptual range after mapping.

/** Map an unbounded raw score to –2…+2 range */
function clampFundamental(raw: number): number {
  // Empirical range from scoring engine: roughly –60 to +130
  // Map to –2…+2
  return Math.max(-2, Math.min(2, raw / 35));
}

function clampTechnical(raw: number): number {
  // Empirical range: roughly –80 to +100
  return Math.max(-2, Math.min(2, raw / 35));
}

function clampSentiment(raw: number): number {
  // Empirical range: roughly –100 to +100
  return Math.max(-1, Math.min(1, raw / 50));
}

/** Normalize a –2…+2 value to 0–100 */
function normFundTech(clamped: number): number {
  return ((clamped + 2) / 4) * 100;
}

/** Normalize a –1…+1 value to 0–100 */
function normSentiment(clamped: number): number {
  return ((clamped + 1) / 2) * 100;
}

export function normalizePhaseScores(phase: PhaseScores): NormalizedScores {
  return {
    fundamental: Math.round(normFundTech(clampFundamental(phase.fundamental))),
    sentiment: Math.round(normSentiment(clampSentiment(phase.sentiment))),
    technical: Math.round(normFundTech(clampTechnical(phase.technical))),
  };
}

// ─── 2. Weighted RadarScore ──────────────────────────────────────────────────

export function calculateRadarScore(
  normalized: NormalizedScores,
  weights: ProfileWeights
): number {
  const score =
    weights.fundamental * normalized.fundamental +
    weights.technical * normalized.technical +
    weights.sentiment * normalized.sentiment;
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
// Based on: alignment across phases, distance from neutral

export function radarScoreToConfidence(
  normalized: NormalizedScores,
  radarScore: number
): Confidence {
  // How far the overall score is from the neutral zone (50)
  const distanceFromNeutral = Math.abs(radarScore - 50);

  // Cross-phase alignment: all phases roughly agree?
  const vals = [normalized.fundamental, normalized.sentiment, normalized.technical];
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length;
  const alignment = Math.max(0, 1 - variance / 800); // 0 = total disagreement, 1 = aligned

  const confidenceScore = distanceFromNeutral * 0.6 + alignment * 25;

  if (confidenceScore >= 30) return "Strong";
  if (confidenceScore >= 15) return "Moderate";
  return "Weak";
}

// ─── 5. Full Radar Calculation for all profiles ──────────────────────────────

export function calculateAllRadarScores(
  phaseScores: PhaseScores
): Record<InvestorProfile, RadarScore> {
  const normalized = normalizePhaseScores(phaseScores);
  const profiles: InvestorProfile[] = ["short-term", "medium-term", "long-term"];

  const result = {} as Record<InvestorProfile, RadarScore>;
  for (const profile of profiles) {
    const weights = PROFILE_WEIGHTS[profile];
    const score = calculateRadarScore(normalized, weights);
    result[profile] = {
      normalized,
      radarScore: score,
      signal: radarScoreToSignal(score),
      confidence: radarScoreToConfidence(normalized, score),
      profile,
    };
  }
  return result;
}

// ─── 6. Signal labels & colors ───────────────────────────────────────────────

export function getSignalLabel(rec: Recommendation): string {
  switch (rec) {
    case "strong-buy": return "Strong Buy";
    case "buy": return "Buy";
    case "hold": return "Hold";
    case "dont-buy": return "Sell";
    case "sell": return "Strong Sell";
  }
}

export function getSignalColor(rec: Recommendation): "constructive" | "neutral" | "cautious" {
  switch (rec) {
    case "strong-buy":
    case "buy":
      return "constructive";
    case "hold":
      return "neutral";
    case "dont-buy":
    case "sell":
      return "cautious";
  }
}
