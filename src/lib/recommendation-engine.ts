import type { TechnicalIndicators, FundamentalIndicators, Recommendation, Confidence } from "./types";

export function calculateTechnicalScore(t: TechnicalIndicators): number {
  let score = 0;

  // RSI: oversold (<30) = bullish, overbought (>70) = bearish
  if (t.rsi < 30) score += 25;
  else if (t.rsi < 40) score += 15;
  else if (t.rsi < 60) score += 10;
  else if (t.rsi < 70) score += 0;
  else score -= 15;

  // MACD above signal = bullish
  const macdDiff = t.macd - t.macdSignal;
  if (macdDiff > 1) score += 20;
  else if (macdDiff > 0) score += 10;
  else if (macdDiff > -1) score -= 5;
  else score -= 15;

  // Price above SMA200 = long-term bullish
  // We use sma50 vs sma200 as golden/death cross proxy
  if (t.sma50 > t.sma200 * 1.03) score += 20;
  else if (t.sma50 > t.sma200) score += 10;
  else if (t.sma50 > t.sma200 * 0.97) score -= 5;
  else score -= 15;

  // Volume trend
  const volRatio = t.volume / t.avgVolume;
  if (volRatio > 1.5) score += 10;
  else if (volRatio > 1) score += 5;

  return score;
}

export function calculateFundamentalScore(f: FundamentalIndicators): number {
  let score = 0;

  // P/E ratio
  if (f.peRatio > 0 && f.peRatio < 15) score += 20;
  else if (f.peRatio < 25) score += 10;
  else if (f.peRatio < 35) score += 0;
  else score -= 10;

  // Earnings growth
  if (f.earningsGrowth > 20) score += 25;
  else if (f.earningsGrowth > 10) score += 15;
  else if (f.earningsGrowth > 0) score += 5;
  else score -= 15;

  // Debt to equity
  if (f.debtToEquity < 0.5) score += 15;
  else if (f.debtToEquity < 1) score += 10;
  else if (f.debtToEquity < 2) score += 0;
  else score -= 10;

  // Revenue growth
  if (f.revenueGrowth > 15) score += 15;
  else if (f.revenueGrowth > 5) score += 10;
  else if (f.revenueGrowth > 0) score += 5;
  else score -= 10;

  return score;
}

export function getRecommendation(score: number): Recommendation {
  if (score >= 50) return "buy";
  if (score >= 20) return "hold";
  if (score >= 0) return "dont-buy";
  return "sell";
}

export function getConfidence(score: number): Confidence {
  const abs = Math.abs(score);
  if (abs >= 60) return "Strong";
  if (abs >= 30) return "Moderate";
  return "Weak";
}

export function getRecommendationLabel(rec: Recommendation): string {
  switch (rec) {
    case "buy": return "Buy";
    case "hold": return "Hold";
    case "dont-buy": return "Don't Buy";
    case "sell": return "Sell";
  }
}

export function getRecommendationColor(rec: Recommendation): string {
  switch (rec) {
    case "buy": return "text-signal-buy";
    case "hold": return "text-signal-hold";
    case "dont-buy": return "text-signal-dont-buy";
    case "sell": return "text-signal-sell";
  }
}

export function getRecommendationBg(rec: Recommendation): string {
  switch (rec) {
    case "buy": return "bg-signal-buy-bg";
    case "hold": return "bg-signal-hold-bg";
    case "dont-buy": return "bg-signal-dont-buy-bg";
    case "sell": return "bg-signal-sell-bg";
  }
}
