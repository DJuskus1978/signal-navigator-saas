import type { Stock } from "@/lib/types";

export type SignalLevel = "bullish" | "bearish" | "neutral";

export interface StockDetailProps {
  stock: Stock;
}

export function getRadarStatus(score: number): { label: string; color: "constructive" | "neutral" | "cautious" } {
  if (score >= 15) return { label: "Constructive", color: "constructive" };
  if (score >= -10) return { label: "Neutral", color: "neutral" };
  return { label: "Cautious", color: "cautious" };
}

export function getPhaseStatus(score: number): { label: string; level: SignalLevel } {
  if (score >= 20) return { label: "Strong", level: "bullish" };
  if (score >= 5) return { label: "Stable", level: "neutral" };
  return { label: "Weakening", level: "bearish" };
}

export function getConfidencePercent(confidence: string, score: number): number {
  const absScore = Math.abs(score);
  // Map absolute combined score to 0-100 confidence percentage
  return Math.min(95, Math.max(15, Math.round(absScore * 0.8 + 20)));
}
