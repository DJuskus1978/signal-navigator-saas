export type Recommendation = "buy" | "hold" | "dont-buy" | "sell";
export type Confidence = "Strong" | "Moderate" | "Weak";
export type Exchange = "nasdaq" | "dow" | "sp500";

export interface TechnicalIndicators {
  rsi: number;
  macd: number;
  macdSignal: number;
  sma50: number;
  sma200: number;
  volume: number;
  avgVolume: number;
}

export interface FundamentalIndicators {
  peRatio: number;
  earningsGrowth: number;
  debtToEquity: number;
  revenueGrowth: number;
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
  technical: TechnicalIndicators;
  fundamental: FundamentalIndicators;
}
