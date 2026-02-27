export type Recommendation = "strong-buy" | "buy" | "hold" | "dont-buy" | "sell";
export type Confidence = "Strong" | "Moderate" | "Weak";
export type Exchange = "nasdaq" | "dow" | "sp500" | "crypto";
export type SentimentRating = "very-positive" | "positive" | "neutral" | "negative" | "very-negative";
export type AssetType = "stock" | "crypto";
export type InvestorProfile = "conservative" | "balanced" | "active";

export interface ProfileWeights {
  fundamental: number;
  technical: number;
  sentiment: number;
}

export const PROFILE_WEIGHTS: Record<InvestorProfile, ProfileWeights> = {
  conservative: { fundamental: 0.50, technical: 0.30, sentiment: 0.20 },
  balanced:     { fundamental: 0.40, technical: 0.40, sentiment: 0.20 },
  active:       { fundamental: 0.25, technical: 0.55, sentiment: 0.20 },
};

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

// Crypto-specific market structure indicators (replaces fundamentals for crypto)
export interface CryptoMarketIndicators {
  marketCap: number;
  marketCapRank: number; // 1 = BTC, 2 = ETH, etc.
  volumeToMarketCap: number; // liquidity ratio
  circulatingSupplyPercent: number; // % of max supply in circulation
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  volatility30d: number; // annualized 30-day volatility
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
  fundamental: number;   // raw score
  sentiment: number;     // raw score
  technical: number;     // raw score
  combined: number;      // legacy weighted raw score
}

// Normalized 0-100 scores used by the Balanced AI Signal System
export interface NormalizedScores {
  fundamental: number;   // 0-100
  sentiment: number;     // 0-100
  technical: number;     // 0-100
}

export interface RadarScore {
  normalized: NormalizedScores;
  radarScore: number;    // 0-100 weighted score
  signal: Recommendation;
  confidence: Confidence;
  profile: InvestorProfile;
}

export interface AnalystRatingsDistribution {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  totalAnalysts: number;
}

export interface AnalystPriceTarget {
  targetHigh: number;
  targetLow: number;
  targetConsensus: number;
  targetMedian: number;
  totalAnalysts: number;
}

export type AnalystConsensus = "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";

export interface AnalystData {
  consensus: AnalystConsensus;
  priceTarget: AnalystPriceTarget | null;
  ratingsDistribution: AnalystRatingsDistribution | null;
}

export interface Stock {
  ticker: string;
  name: string;
  exchange: Exchange;
  assetType?: AssetType;
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
  cryptoMarket?: CryptoMarketIndicators;
  hasDetailData?: boolean;
  radarScores?: Record<InvestorProfile, RadarScore>;
  analystData?: AnalystData;
}
