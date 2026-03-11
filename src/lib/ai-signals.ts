/**
 * AI Signals — "Why StocksRadars likes this stock"
 * Generates human-readable bullet points from stock data.
 */

import type { Stock, PhaseScores, FundamentalIndicators, SentimentIndicators, TechnicalIndicators } from "./types";

export interface AISignal {
  label: string;
  positive: boolean;
}

export function generateAISignals(stock: Stock): AISignal[] {
  const signals: AISignal[] = [];
  const f = stock.fundamental;
  const s = stock.sentiment;
  const t = stock.technical;
  const ps = stock.phaseScores;

  // ─── Fundamental signals ───────────────────────────────────────────
  if (f.earningsGrowth > 15) {
    signals.push({ label: "Strong earnings growth", positive: true });
  } else if (f.earningsGrowth > 5) {
    signals.push({ label: "Steady earnings growth", positive: true });
  } else if (f.earningsGrowth < -5) {
    signals.push({ label: "Declining earnings", positive: false });
  }

  if (f.revenueGrowth > 15) {
    signals.push({ label: "Revenue growth acceleration", positive: true });
  } else if (f.revenueGrowth > 5) {
    signals.push({ label: "Healthy revenue growth", positive: true });
  } else if (f.revenueGrowth < 0) {
    signals.push({ label: "Revenue declining", positive: false });
  }

  if (f.peRatio > 0 && f.peRatio < 15) {
    signals.push({ label: "Attractively valued (low P/E)", positive: true });
  } else if (f.peRatio > 35) {
    signals.push({ label: "High valuation risk", positive: false });
  }

  if (f.debtToEquity < 0.5) {
    signals.push({ label: "Low debt, strong balance sheet", positive: true });
  } else if (f.debtToEquity > 1.5) {
    signals.push({ label: "High debt levels", positive: false });
  }

  if (f.profitMargin > 20) {
    signals.push({ label: "High profit margins", positive: true });
  } else if (f.profitMargin < 5 && f.profitMargin > 0) {
    signals.push({ label: "Thin profit margins", positive: false });
  }

  if (f.returnOnEquity > 20) {
    signals.push({ label: "Excellent return on equity", positive: true });
  }

  // ─── Sentiment signals ─────────────────────────────────────────────
  if (s.analystRating >= 4) {
    signals.push({ label: "Strong analyst consensus", positive: true });
  } else if (s.analystRating <= 2) {
    signals.push({ label: "Weak analyst sentiment", positive: false });
  }

  if (s.newsScore > 30) {
    signals.push({ label: "Positive news sentiment", positive: true });
  } else if (s.newsScore < -30) {
    signals.push({ label: "Negative news coverage", positive: false });
  }

  if (s.insiderActivity > 0.3) {
    signals.push({ label: "Strong institutional buying", positive: true });
  } else if (s.insiderActivity < -0.3) {
    signals.push({ label: "Insider selling detected", positive: false });
  }

  // ─── Technical signals ─────────────────────────────────────────────
  if (t.rsi < 30) {
    signals.push({ label: "Oversold — potential bounce", positive: true });
  } else if (t.rsi > 70) {
    signals.push({ label: "Overbought — pullback risk", positive: false });
  }

  if (t.sma50 > t.sma200 * 1.02) {
    signals.push({ label: "Bullish momentum (Golden Cross)", positive: true });
  } else if (t.sma50 < t.sma200 * 0.98) {
    signals.push({ label: "Bearish trend (Death Cross)", positive: false });
  }

  const macdDiff = t.macd - t.macdSignal;
  if (macdDiff > 1) {
    signals.push({ label: "MACD bullish crossover", positive: true });
  } else if (macdDiff < -1) {
    signals.push({ label: "MACD bearish signal", positive: false });
  }

  if (t.volume > t.avgVolume * 1.5) {
    signals.push({ label: "High volume conviction", positive: true });
  }

  // ─── Phase-level signals ───────────────────────────────────────────
  if (ps.fundamental > 30) {
    signals.push({ label: "Strong fundamental foundation", positive: true });
  }
  if (ps.technical > 25) {
    signals.push({ label: "Technical breakout pattern", positive: true });
  }

  // Sort: positive first, then negative
  signals.sort((a, b) => (a.positive === b.positive ? 0 : a.positive ? -1 : 1));

  // Return top 6 max
  return signals.slice(0, 6);
}

/**
 * Generate the "Why StocksRadars likes/doesn't like" summary
 */
export function getAIVerdict(stock: Stock): { liked: boolean; title: string } {
  const score = stock.radarScores?.["medium-term"]?.radarScore ?? stock.score;
  if (score >= 60) {
    return { liked: true, title: `Why StocksRadars favors ${stock.name}` };
  } else if (score >= 45) {
    return { liked: true, title: `StocksRadars is neutral on ${stock.name}` };
  } else {
    return { liked: false, title: `Why StocksRadars is cautious on ${stock.name}` };
  }
}
