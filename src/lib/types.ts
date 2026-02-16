export type Recommendation = "strong-buy" | "buy" | "hold" | "dont-buy" | "sell";
export type Confidence = "Strong" | "Moderate" | "Weak";
export type Exchange = "nasdaq" | "dow" | "sp500";
export type SentimentRating = "very-positive" | "positive" | "neutral" | "negative" | "very-negative";

export interface TechnicalIndicators {
  rsi: number;
  macd: number;
  macdSignal: number;
  sma50: number;
  sma200: number;
  ema20: number;
  volume: number;
  avgVolume: number;
  bollingerUpper: number;
  bollingerLower: number;
  atr: number; // Average True Range — volatility
}

export interface FundamentalIndicators {
  peRatio: number;
  forwardPE: number;
  earningsGrowth: number;
  debtToEquity: number;
  revenueGrowth: number;
  profitMargin: number;
  returnOnEquity: number;
  freeCashFlowYield: number;
}

export interface SentimentIndicators {
  newsScore: number; // -100 to +100
  newsCount: number; // articles analyzed
  socialScore: number; // -100 to +100
  analystRating: number; // 1 (strong sell) to 5 (strong buy)
  insiderActivity: number; // net insider buy/sell ratio -1 to 1
  headline: string; // most impactful headline
  sentimentRating: SentimentRating;
}

export interface PhaseScores {
  fundamental: number;
  sentiment: number;
  technical: number;
  combined: number;
}

export interface Stock {
  ticker: string;
  name: string;
  exchange: Exchange;
  price: number;
  change: number;
  changePercent: number;
  recommendation: Recommendation;
  confidence: Confidence;
  score: number;
  phaseScores: PhaseScores;
  technical: TechnicalIndicators;
  fundamental: FundamentalIndicators;
  sentiment: SentimentIndicators;
}
