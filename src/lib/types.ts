/**
 * STOCKSRADARS — Core Type Definitions
 *
 * v2.0 — March 2026
 * Changes from v1:
 *  - Added CRYPTO_PROFILE_WEIGHTS (separate from equity weights)
 *  - Added AssetWeightMap helper type
 *  - Added SignalMeta interface (label + shortLabel + description per signal)
 *  - Added ConsensusAgreement type + ConsensusSummary interface (for signal-consensus.ts)
 *  - Added dominantDimension to RadarScore (used by AIDecisionGuidance)
 *  - PhaseScores.combined marked @deprecated (legacy field, do not use in new code)
 */

// ─── 1. Primitive types ──────────────────────────────────────────────────────

export type Recommendation  = "strong-buy" | "buy" | "hold" | "dont-buy" | "sell";
export type Confidence      = "Strong" | "Moderate" | "Weak";
export type Exchange        = "nasdaq" | "dow" | "sp500" | "crypto";
export type SentimentRating = "very-positive" | "positive" | "neutral" | "negative" | "very-negative";
export type AssetType       = "stock" | "crypto";
export type InvestorProfile = "short-term" | "medium-term" | "long-term";

/** Agreement between RadarScore™ signal and Wall Street analyst consensus */
export type ConsensusAgreement = "aligned" | "divergent" | "neutral";

/** Which scoring dimension has the highest weighted contribution for a given profile */
export type DominantDimension = "fundamental" | "technical" | "sentiment";

// ─── 2. Profile weights ──────────────────────────────────────────────────────

export interface ProfileWeights {
  fundamental: number;  // 0–1, must sum to 1 with technical + sentiment
  technical:   number;
  sentiment:   number;
}

/**
 * Equity PROFILE_WEIGHTS
 * Calibrated for traditional stocks where fundamentals scale with horizon.
 */
export const PROFILE_WEIGHTS: Record<InvestorProfile, ProfileWeights> = {
  "short-term":  { fundamental: 0.25, technical: 0.55, sentiment: 0.20 },
  "medium-term": { fundamental: 0.35, technical: 0.40, sentiment: 0.25 },
  "long-term":   { fundamental: 0.50, technical: 0.25, sentiment: 0.25 },
};

/**
 * Crypto PROFILE_WEIGHTS
 * Crypto markets are momentum- and sentiment-driven with limited fundamental
 * signals (no P/E, earnings etc.). Technical and sentiment therefore carry
 * higher weight at all horizons. Fundamental proxy = on-chain/market-structure
 * data (marketCap rank, volumeToMarketCap, circulatingSupplyPercent).
 */
export const CRYPTO_PROFILE_WEIGHTS: Record<InvestorProfile, ProfileWeights> = {
  "short-term":  { fundamental: 0.10, technical: 0.65, sentiment: 0.25 },
  "medium-term": { fundamental: 0.15, technical: 0.55, sentiment: 0.30 },
  "long-term":   { fundamental: 0.25, technical: 0.45, sentiment: 0.30 },
};

/** Helper: resolve the correct weight map for a given asset type */
export function getProfileWeights(
  profile: InvestorProfile,
  assetType: AssetType = "stock"
): ProfileWeights {
  return assetType === "crypto"
    ? CRYPTO_PROFILE_WEIGHTS[profile]
    : PROFILE_WEIGHTS[profile];
}

// ─── 3. Signal metadata ──────────────────────────────────────────────────────

/**
 * Rich metadata for each signal tier.
 * Used by the UI to render labels, descriptions, and short labels consistently.
 * Single source of truth — no label logic scattered across components.
 */
export interface SignalMeta {
  label:       string;  // Full display label  e.g. "Strong Buy"
  shortLabel:  string;  // Compact label       e.g. "S.Buy"
  description: string;  // Tooltip / card description
  colorKey:    "constructive" | "neutral" | "cautious" | "strong-constructive" | "strong-cautious";
}

export const SIGNAL_META: Record<Recommendation, SignalMeta> = {
  "strong-buy": {
    label:       "Strong Buy",
    shortLabel:  "Strong Buy",
    description: "High-conviction signal. RadarScore™ indicates strong alignment across fundamentals, technicals, and sentiment.",
    colorKey:    "strong-constructive",
  },
  "buy": {
    label:       "Buy",
    shortLabel:  "Buy",
    description: "Positive signal. RadarScore™ indicates favourable conditions for entry.",
    colorKey:    "constructive",
  },
  "hold": {
    label:       "Hold",
    shortLabel:  "Hold",
    description: "Neutral signal. No strong reason to enter or exit. Monitor for a clearer signal.",
    colorKey:    "neutral",
  },
  "dont-buy": {
    label:       "Avoid",
    shortLabel:  "Avoid",
    description: "Weak signal. Conditions do not justify entry. This is not a sell trigger — existing positions may be held.",
    colorKey:    "cautious",
  },
  "sell": {
    label:       "Sell",
    shortLabel:  "Sell",
    description: "Bearish signal. RadarScore™ indicates deteriorating conditions across multiple dimensions. Consider exit.",
    colorKey:    "strong-cautious",
  },
};

// ─── 4. Indicator interfaces ─────────────────────────────────────────────────

export interface TechnicalIndicators {
  rsi:            number;
  macd:           number;
  macdSignal:     number;
  sma50:          number;
  sma200:         number;
  ema20:          number;
  volume:         number;
  avgVolume:      number;
  bollingerUpper: number;
  bollingerLower: number;
  atr:            number; // Average True Range — volatility proxy
}

export interface FundamentalIndicators {
  peRatio:           number;
  forwardPE:         number;
  earningsGrowth:    number;
  debtToEquity:      number;
  revenueGrowth:     number;
  profitMargin:      number;
  returnOnEquity:    number;
  freeCashFlowYield: number;
}

/**
 * Crypto-specific market structure indicators.
 * Replaces FundamentalIndicators for assetType === "crypto".
 * These feed into the fundamental score dimension via the crypto scoring engine.
 */
export interface CryptoMarketIndicators {
  marketCap:                number;
  marketCapRank:            number; // 1 = BTC, 2 = ETH, etc.
  volumeToMarketCap:        number; // liquidity ratio
  circulatingSupplyPercent: number; // % of max supply in circulation
  priceChange24h:           number;
  priceChange7d:            number;
  priceChange30d:           number;
  volatility30d:            number; // annualized 30-day volatility
}

export interface SentimentIndicators {
  newsScore:      number;         // –100 to +100
  newsCount:      number;         // articles analyzed
  socialScore:    number;         // –100 to +100
  analystRating:  number;         // 1 (strong sell) to 5 (strong buy)
  insiderActivity:number;         // net insider buy/sell ratio –1 to +1
  headline:       string;         // most impactful recent headline
  sentimentRating:SentimentRating;
}

// ─── 5. Score interfaces ─────────────────────────────────────────────────────

export interface PhaseScores {
  fundamental: number; // raw score (unbounded)
  sentiment:   number; // raw score (unbounded)
  technical:   number; // raw score (unbounded)
  /** @deprecated Legacy combined score. Use RadarScore.radarScore instead. */
  combined:    number;
}

/** Normalized 0–100 scores — output of Stage 1+2 in the pipeline */
export interface NormalizedScores {
  fundamental: number; // 0–100
  sentiment:   number; // 0–100
  technical:   number; // 0–100
}

/** Full RadarScore result for a single investor profile */
export interface RadarScore {
  normalized:        NormalizedScores;
  radarScore:        number;           // 0–100 weighted composite
  signal:            Recommendation;
  confidence:        Confidence;
  profile:           InvestorProfile;
  dominantDimension: DominantDimension; // which dimension drove the score most
}

// ─── 6. Analyst data ─────────────────────────────────────────────────────────

export interface AnalystRatingsDistribution {
  strongBuy:     number;
  buy:           number;
  hold:          number;
  sell:          number;
  strongSell:    number;
  totalAnalysts: number;
}

export interface AnalystPriceTarget {
  targetHigh:      number;
  targetLow:       number;
  targetConsensus: number;
  targetMedian:    number;
  totalAnalysts:   number;
}

export type AnalystConsensus = "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";

export interface AnalystData {
  consensus:           AnalystConsensus;
  priceTarget:         AnalystPriceTarget | null;
  ratingsDistribution: AnalystRatingsDistribution | null;
}

/**
 * Summary of the comparison between RadarScore™ and analyst consensus.
 * Produced by signal-consensus.ts and consumed by the UI consensus panel.
 */
export interface ConsensusSummary {
  agreement:       ConsensusAgreement;
  radarSignal:     Recommendation;
  analystConsensus:AnalystConsensus;
  /** Human-readable explanation of agreement/divergence */
  explanation:     string;
  /** 0–100 strength of agreement (100 = both signals identical polarity + strength) */
  agreementScore:  number;
}

// ─── 7. Stock entity ─────────────────────────────────────────────────────────

export interface Stock {
  ticker:          string;
  name:            string;
  exchange:        Exchange;
  assetType?:      AssetType;
  price:           number;
  change:          number;
  changePercent:   number;
  recommendation:  Recommendation;
  confidence:      Confidence;
  score:           number;
  phaseScores:     PhaseScores;
  technical:       TechnicalIndicators;
  fundamental:     FundamentalIndicators;
  sentiment:       SentimentIndicators;
  cryptoMarket?:   CryptoMarketIndicators;
  hasDetailData?:  boolean;
  radarScores?:    Record<InvestorProfile, RadarScore>;
  analystData?:    AnalystData;
  technicalNulls?: string[]; // technical fields that returned null from API
}
