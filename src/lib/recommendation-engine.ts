import type { TechnicalIndicators, FundamentalIndicators, SentimentIndicators, Recommendation, Confidence, PhaseScores } from "./types";

// ─── Phase 1: Fundamentals (scored first — the foundation) ───────────────────

export function calculateFundamentalScore(f: FundamentalIndicators): number {
  let score = 0;

  // P/E ratio — undervalued stocks score higher
  if (f.peRatio > 0 && f.peRatio < 12) score += 25;
  else if (f.peRatio < 18) score += 15;
  else if (f.peRatio < 25) score += 5;
  else if (f.peRatio < 35) score -= 5;
  else score -= 15;

  // Forward P/E — growth expectation
  if (f.forwardPE > 0 && f.forwardPE < f.peRatio * 0.8) score += 15; // earnings expected to grow
  else if (f.forwardPE < f.peRatio) score += 8;
  else score -= 5;

  // Earnings growth
  if (f.earningsGrowth > 25) score += 25;
  else if (f.earningsGrowth > 15) score += 18;
  else if (f.earningsGrowth > 5) score += 8;
  else if (f.earningsGrowth > 0) score += 3;
  else if (f.earningsGrowth > -10) score -= 8;
  else score -= 18;

  // Debt to equity — lower is healthier
  if (f.debtToEquity < 0.3) score += 15;
  else if (f.debtToEquity < 0.7) score += 10;
  else if (f.debtToEquity < 1.2) score += 3;
  else if (f.debtToEquity < 2) score -= 5;
  else score -= 12;

  // Revenue growth
  if (f.revenueGrowth > 20) score += 18;
  else if (f.revenueGrowth > 10) score += 12;
  else if (f.revenueGrowth > 3) score += 5;
  else if (f.revenueGrowth > 0) score += 2;
  else score -= 10;

  // Profit margin
  if (f.profitMargin > 25) score += 12;
  else if (f.profitMargin > 15) score += 8;
  else if (f.profitMargin > 5) score += 3;
  else if (f.profitMargin > 0) score -= 2;
  else score -= 10;

  // Return on Equity
  if (f.returnOnEquity > 25) score += 12;
  else if (f.returnOnEquity > 15) score += 8;
  else if (f.returnOnEquity > 8) score += 3;
  else score -= 5;

  // Free Cash Flow Yield
  if (f.freeCashFlowYield > 8) score += 10;
  else if (f.freeCashFlowYield > 4) score += 6;
  else if (f.freeCashFlowYield > 2) score += 2;
  else score -= 5;

  return score;
}

// ─── Phase 2: Sentiment (news, social, analysts) ─────────────────────────────

export function calculateSentimentScore(s: SentimentIndicators): number {
  let score = 0;

  // News sentiment (-100 to +100)
  score += Math.round(s.newsScore * 0.35); // max ±35

  // Social sentiment
  score += Math.round(s.socialScore * 0.15); // max ±15

  // Analyst consensus (1-5 scale → mapped)
  if (s.analystRating >= 4.5) score += 20;
  else if (s.analystRating >= 4) score += 14;
  else if (s.analystRating >= 3.5) score += 7;
  else if (s.analystRating >= 3) score += 0;
  else if (s.analystRating >= 2) score -= 10;
  else score -= 18;

  // Insider activity — insiders buying is very bullish
  if (s.insiderActivity > 0.5) score += 15;
  else if (s.insiderActivity > 0.2) score += 8;
  else if (s.insiderActivity > -0.2) score += 0;
  else if (s.insiderActivity > -0.5) score -= 8;
  else score -= 15;

  // Volume of news — more coverage with positive sentiment amplifies
  const coverageMultiplier = Math.min(s.newsCount / 10, 1.5); // caps at 1.5x
  score = Math.round(score * coverageMultiplier);

  return score;
}

// ─── Phase 3: Technicals (re-evaluates with fundamental+sentiment context) ───

export function calculateTechnicalScore(t: TechnicalIndicators, fundamentalBias: number): number {
  let score = 0;

  // RSI: oversold (<30) = bullish, overbought (>70) = bearish
  if (t.rsi < 25) score += 25;
  else if (t.rsi < 35) score += 15;
  else if (t.rsi < 55) score += 5;
  else if (t.rsi < 65) score += 0;
  else if (t.rsi < 75) score -= 10;
  else score -= 20;

  // MACD crossover
  const macdDiff = t.macd - t.macdSignal;
  if (macdDiff > 2) score += 22;
  else if (macdDiff > 0.5) score += 14;
  else if (macdDiff > 0) score += 5;
  else if (macdDiff > -0.5) score -= 5;
  else if (macdDiff > -2) score -= 12;
  else score -= 20;

  // Golden/Death Cross: SMA50 vs SMA200
  const maRatio = t.sma50 / t.sma200;
  if (maRatio > 1.05) score += 20;
  else if (maRatio > 1.01) score += 12;
  else if (maRatio > 0.99) score += 0;
  else if (maRatio > 0.95) score -= 10;
  else score -= 18;

  // EMA20 vs price (short-term trend — use sma50 as proxy for current price level)
  if (t.ema20 > t.sma50 * 1.02) score += 10;
  else if (t.ema20 > t.sma50) score += 5;
  else score -= 5;

  // Volume trend — conviction
  const volRatio = t.volume / t.avgVolume;
  if (volRatio > 2) score += 12;
  else if (volRatio > 1.3) score += 7;
  else if (volRatio > 0.8) score += 0;
  else score -= 5;

  // Bollinger Band position — price relative to bands
  const bbRange = t.bollingerUpper - t.bollingerLower;
  const bbMid = (t.bollingerUpper + t.bollingerLower) / 2;
  if (bbRange > 0) {
    const bbPosition = (t.sma50 - t.bollingerLower) / bbRange; // 0 = lower band, 1 = upper band
    if (bbPosition < 0.2) score += 12; // near lower band = potential bounce
    else if (bbPosition > 0.8) score -= 8; // near upper band = potential pullback
  }

  // Volatility (ATR) — high ATR + good fundamentals = opportunity
  if (t.atr > 3 && fundamentalBias > 20) score += 8; // volatile but fundamentally strong
  else if (t.atr > 5) score -= 5; // too volatile without strong fundamentals

  return score;
}

// ─── Multi-Phase Scoring ─────────────────────────────────────────────────────

export function calculatePhaseScores(
  fundamental: FundamentalIndicators,
  sentiment: SentimentIndicators,
  technical: TechnicalIndicators
): PhaseScores {
  const fundScore = calculateFundamentalScore(fundamental);
  const sentScore = calculateSentimentScore(sentiment);
  // Technicals get a bias from fundamentals — strong fundamentals make technical dips look like opportunities
  const techScore = calculateTechnicalScore(technical, fundScore);

  // Weighted combination:
  // Fundamentals: 40% (the bedrock)
  // Sentiment: 25% (news/market mood for day-trading relevance)
  // Technicals: 35% (entry/exit timing, re-evaluated with fundamental context)
  const combined = Math.round(fundScore * 0.40 + sentScore * 0.25 + techScore * 0.35);

  return { fundamental: fundScore, sentiment: sentScore, technical: techScore, combined };
}

// ─── Recommendation Mapping ──────────────────────────────────────────────────

export function getRecommendation(score: number): Recommendation {
  if (score >= 60) return "strong-buy";
  if (score >= 30) return "buy";
  if (score >= 5) return "hold";
  if (score >= -15) return "dont-buy";
  return "sell";
}

export function getConfidence(score: number): Confidence {
  const abs = Math.abs(score);
  if (abs >= 55) return "Strong";
  if (abs >= 25) return "Moderate";
  return "Weak";
}

export function getRecommendationLabel(rec: Recommendation): string {
  switch (rec) {
    case "strong-buy": return "Strong Buy";
    case "buy": return "Buy";
    case "hold": return "Hold";
    case "dont-buy": return "Don't Buy";
    case "sell": return "Sell";
  }
}

export function getRecommendationColor(rec: Recommendation): string {
  switch (rec) {
    case "strong-buy": return "text-signal-strong-buy";
    case "buy": return "text-signal-buy";
    case "hold": return "text-signal-hold";
    case "dont-buy": return "text-signal-dont-buy";
    case "sell": return "text-signal-sell";
  }
}

export function getRecommendationBg(rec: Recommendation): string {
  switch (rec) {
    case "strong-buy": return "bg-signal-strong-buy-bg";
    case "buy": return "bg-signal-buy-bg";
    case "hold": return "bg-signal-hold-bg";
    case "dont-buy": return "bg-signal-dont-buy-bg";
    case "sell": return "bg-signal-sell-bg";
  }
}

export function getPhaseLabel(phase: keyof PhaseScores): string {
  switch (phase) {
    case "fundamental": return "Fundamentals";
    case "sentiment": return "News & Sentiment";
    case "technical": return "Technicals";
    case "combined": return "Overall";
  }
}

export function getPhaseEmoji(score: number): string {
  if (score >= 30) return "🟢";
  if (score >= 10) return "🟡";
  if (score >= -5) return "🟠";
  return "🔴";
}
