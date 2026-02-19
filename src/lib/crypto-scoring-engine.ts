import type { TechnicalIndicators, SentimentIndicators, CryptoMarketIndicators, PhaseScores } from "./types";

// ─── Phase 1: Market Structure (replaces Fundamentals for crypto) ────────────

export function calculateCryptoMarketScore(m: CryptoMarketIndicators): number {
  let score = 0;

  // Market cap rank — top coins are more established/safer
  if (m.marketCapRank <= 3) score += 20;
  else if (m.marketCapRank <= 10) score += 12;
  else if (m.marketCapRank <= 25) score += 5;
  else if (m.marketCapRank <= 50) score -= 5;
  else score -= 15;

  // Volume-to-market-cap ratio — higher = more liquid/active
  if (m.volumeToMarketCap > 0.15) score += 15;
  else if (m.volumeToMarketCap > 0.08) score += 10;
  else if (m.volumeToMarketCap > 0.03) score += 3;
  else score -= 5;

  // Circulating supply % — scarcity signal
  if (m.circulatingSupplyPercent > 90) score += 10;
  else if (m.circulatingSupplyPercent > 70) score += 5;
  else if (m.circulatingSupplyPercent > 50) score += 0;
  else score -= 8; // lots of supply still to be released = dilution risk

  // Multi-timeframe momentum
  // 24h change
  if (m.priceChange24h > 5) score += 10;
  else if (m.priceChange24h > 1) score += 5;
  else if (m.priceChange24h > -1) score += 0;
  else if (m.priceChange24h > -5) score -= 5;
  else score -= 12;

  // 7d change
  if (m.priceChange7d > 10) score += 12;
  else if (m.priceChange7d > 3) score += 7;
  else if (m.priceChange7d > -3) score += 0;
  else if (m.priceChange7d > -10) score -= 7;
  else score -= 15;

  // 30d change (trend confirmation)
  if (m.priceChange30d > 20) score += 15;
  else if (m.priceChange30d > 5) score += 8;
  else if (m.priceChange30d > -5) score += 0;
  else if (m.priceChange30d > -20) score -= 8;
  else score -= 18;

  // Volatility — extremely high vol is risky
  if (m.volatility30d > 100) score -= 15;
  else if (m.volatility30d > 70) score -= 8;
  else if (m.volatility30d > 40) score += 0;
  else score += 5; // low vol crypto is relatively stable

  return score;
}

// ─── Phase 2: Sentiment (higher weight for crypto — market is sentiment-driven) ──

export function calculateCryptoSentimentScore(s: SentimentIndicators): number {
  let score = 0;

  // News sentiment (-100 to +100) — weighted more heavily for crypto
  score += Math.round(s.newsScore * 0.45); // max ±45

  // Social sentiment — very important for crypto
  score += Math.round(s.socialScore * 0.25); // max ±25

  // Analyst/community rating (1-5)
  if (s.analystRating >= 4.5) score += 15;
  else if (s.analystRating >= 4) score += 10;
  else if (s.analystRating >= 3.5) score += 5;
  else if (s.analystRating >= 3) score += 0;
  else if (s.analystRating >= 2) score -= 8;
  else score -= 15;

  // News volume amplifier
  const coverageMultiplier = Math.min(s.newsCount / 8, 1.5);
  score = Math.round(score * coverageMultiplier);

  return score;
}

// ─── Phase 3: Technicals (similar to stocks but adapted for crypto volatility) ──

export function calculateCryptoTechnicalScore(t: TechnicalIndicators, marketBias: number): number {
  let score = 0;

  // RSI — crypto runs hotter, adjust thresholds
  if (t.rsi < 20) score += 25;
  else if (t.rsi < 30) score += 18;
  else if (t.rsi < 45) score += 8;
  else if (t.rsi < 60) score += 0;
  else if (t.rsi < 75) score -= 5;
  else if (t.rsi < 85) score -= 12;
  else score -= 20;

  // MACD crossover
  const macdDiff = t.macd - t.macdSignal;
  if (macdDiff > 2) score += 20;
  else if (macdDiff > 0.5) score += 12;
  else if (macdDiff > 0) score += 5;
  else if (macdDiff > -0.5) score -= 5;
  else if (macdDiff > -2) score -= 12;
  else score -= 18;

  // SMA50 vs SMA200 (Golden/Death Cross)
  const maRatio = t.sma50 / t.sma200;
  if (maRatio > 1.08) score += 18;
  else if (maRatio > 1.02) score += 10;
  else if (maRatio > 0.98) score += 0;
  else if (maRatio > 0.92) score -= 10;
  else score -= 18;

  // EMA20 trend
  if (t.ema20 > t.sma50 * 1.03) score += 10;
  else if (t.ema20 > t.sma50) score += 5;
  else score -= 5;

  // Volume conviction
  const volRatio = t.volume / t.avgVolume;
  if (volRatio > 2.5) score += 12;
  else if (volRatio > 1.5) score += 7;
  else if (volRatio > 0.7) score += 0;
  else score -= 5;

  // Strong market structure + technical dip = opportunity
  if (marketBias > 20 && t.rsi < 35) score += 10;

  return score;
}

// ─── Crypto Multi-Phase Scoring ──────────────────────────────────────────────

export function calculateCryptoPhaseScores(
  market: CryptoMarketIndicators,
  sentiment: SentimentIndicators,
  technical: TechnicalIndicators
): PhaseScores {
  const marketScore = calculateCryptoMarketScore(market);
  const sentScore = calculateCryptoSentimentScore(sentiment);
  const techScore = calculateCryptoTechnicalScore(technical, marketScore);

  // Crypto weights: Market Structure 25%, Sentiment 40%, Technicals 35%
  // Sentiment is king in crypto markets
  const combined = Math.round(marketScore * 0.25 + sentScore * 0.40 + techScore * 0.35);

  return { fundamental: marketScore, sentiment: sentScore, technical: techScore, combined };
}
