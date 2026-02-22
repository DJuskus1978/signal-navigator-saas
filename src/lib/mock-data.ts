import type { Stock, Exchange, TechnicalIndicators, FundamentalIndicators, SentimentIndicators, SentimentRating } from "./types";
import { calculatePhaseScores, getRecommendation, getConfidence } from "./recommendation-engine";
import { calculateAllRadarScores } from "./radar-scoring";

function rand(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function generateTechnical(priceBase: number): TechnicalIndicators {
  const sma200 = priceBase * rand(0.85, 1.1);
  const sma50 = sma200 * rand(0.92, 1.12);
  const ema20 = sma50 * rand(0.97, 1.05);
  const bbMid = sma50;
  const atr = priceBase * rand(0.01, 0.06);
  return {
    rsi: rand(15, 85),
    macd: rand(-3, 5),
    macdSignal: rand(-2, 4),
    sma50,
    sma200,
    ema20,
    volume: rand(1_000_000, 80_000_000),
    avgVolume: rand(2_000_000, 50_000_000),
    bollingerUpper: bbMid + atr * 2,
    bollingerLower: bbMid - atr * 2,
    atr,
  };
}

function generateFundamental(): FundamentalIndicators {
  const pe = rand(5, 60);
  return {
    peRatio: pe,
    forwardPE: pe * rand(0.7, 1.2),
    earningsGrowth: rand(-20, 50),
    debtToEquity: rand(0.1, 3),
    revenueGrowth: rand(-10, 40),
    profitMargin: rand(-5, 35),
    returnOnEquity: rand(2, 40),
    freeCashFlowYield: rand(-2, 12),
  };
}

const headlines: Record<string, string[]> = {
  positive: [
    "beats earnings expectations by 15%",
    "announces major share buyback program",
    "reports record quarterly revenue",
    "expands into high-growth market",
    "wins large government contract",
    "raises full-year guidance",
    "partners with industry leader",
    "launches breakthrough product",
  ],
  neutral: [
    "reports earnings in line with expectations",
    "maintains current dividend",
    "CEO speaks at industry conference",
    "completes planned restructuring",
    "market cap holds steady amid sector rotation",
  ],
  negative: [
    "faces regulatory investigation",
    "misses revenue targets by 8%",
    "announces layoffs amid cost cuts",
    "loses key patent dispute",
    "downgrades outlook for next quarter",
    "CFO departure raises concerns",
    "supply chain issues persist",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSentiment(name: string): SentimentIndicators {
  const newsScore = rand(-80, 90);
  const socialScore = rand(-60, 80);
  const analystRating = rand(1.5, 5);
  const insiderActivity = rand(-0.8, 0.9);

  let category: "positive" | "neutral" | "negative";
  if (newsScore > 25) category = "positive";
  else if (newsScore > -25) category = "neutral";
  else category = "negative";

  const avgSentiment = (newsScore + socialScore) / 2;
  let sentimentRating: SentimentRating;
  if (avgSentiment > 50) sentimentRating = "very-positive";
  else if (avgSentiment > 15) sentimentRating = "positive";
  else if (avgSentiment > -15) sentimentRating = "neutral";
  else if (avgSentiment > -50) sentimentRating = "negative";
  else sentimentRating = "very-negative";

  return {
    newsScore,
    newsCount: Math.floor(rand(2, 25)),
    socialScore,
    analystRating,
    insiderActivity,
    headline: `${name} ${pickRandom(headlines[category])}`,
    sentimentRating,
  };
}

function createStock(ticker: string, name: string, exchange: Exchange, priceBase: number): Stock {
  const technical = generateTechnical(priceBase);
  const fundamental = generateFundamental();
  const sentiment = generateSentiment(name);
  const phaseScores = calculatePhaseScores(fundamental, sentiment, technical);
  const { combined } = phaseScores;
  const radarScores = calculateAllRadarScores(phaseScores);
  const change = rand(-priceBase * 0.05, priceBase * 0.05);

  return {
    ticker,
    name,
    exchange,
    price: priceBase + change,
    change,
    changePercent: (change / priceBase) * 100,
    recommendation: radarScores.balanced.signal,
    confidence: radarScores.balanced.confidence,
    score: radarScores.balanced.radarScore,
    phaseScores,
    technical,
    fundamental,
    sentiment,
    radarScores,
  };
}

export const mockStocks: Stock[] = [
  // Nasdaq
  createStock("AAPL", "Apple Inc.", "nasdaq", 178.50),
  createStock("MSFT", "Microsoft Corp.", "nasdaq", 415.20),
  createStock("GOOGL", "Alphabet Inc.", "nasdaq", 141.80),
  createStock("AMZN", "Amazon.com Inc.", "nasdaq", 186.50),
  createStock("NVDA", "NVIDIA Corp.", "nasdaq", 875.30),
  createStock("META", "Meta Platforms Inc.", "nasdaq", 505.75),
  createStock("TSLA", "Tesla Inc.", "nasdaq", 175.20),
  createStock("AVGO", "Broadcom Inc.", "nasdaq", 1320.50),
  createStock("NFLX", "Netflix Inc.", "nasdaq", 628.40),
  createStock("AMD", "Advanced Micro Devices", "nasdaq", 162.30),
  createStock("INTC", "Intel Corp.", "nasdaq", 31.50),
  createStock("CSCO", "Cisco Systems Inc.", "nasdaq", 50.20),

  // Dow Jones
  createStock("UNH", "UnitedHealth Group", "dow", 520.80),
  createStock("GS", "Goldman Sachs", "dow", 458.90),
  createStock("HD", "Home Depot Inc.", "dow", 362.40),
  createStock("CAT", "Caterpillar Inc.", "dow", 335.60),
  createStock("CRM", "Salesforce Inc.", "dow", 272.50),
  createStock("V", "Visa Inc.", "dow", 282.30),
  createStock("JPM", "JPMorgan Chase", "dow", 198.40),
  createStock("WMT", "Walmart Inc.", "dow", 170.80),
  createStock("PG", "Procter & Gamble", "dow", 162.50),
  createStock("JNJ", "Johnson & Johnson", "dow", 156.20),
  createStock("KO", "Coca-Cola Co.", "dow", 60.80),
  createStock("DIS", "Walt Disney Co.", "dow", 112.50),

  // S&P 500
  createStock("BRK.B", "Berkshire Hathaway", "sp500", 412.50),
  createStock("XOM", "Exxon Mobil Corp.", "sp500", 108.70),
  createStock("LLY", "Eli Lilly & Co.", "sp500", 782.30),
  createStock("MA", "Mastercard Inc.", "sp500", 465.80),
  createStock("ABBV", "AbbVie Inc.", "sp500", 175.60),
  createStock("PFE", "Pfizer Inc.", "sp500", 27.40),
  createStock("COST", "Costco Wholesale", "sp500", 732.50),
  createStock("T", "AT&T Inc.", "sp500", 17.80),
  createStock("BAC", "Bank of America", "sp500", 35.60),
  createStock("NEE", "NextEra Energy", "sp500", 62.30),
  createStock("ADBE", "Adobe Inc.", "sp500", 570.40),
  createStock("COP", "ConocoPhillips", "sp500", 118.20),
];

export function getStocksByExchange(exchange: Exchange): Stock[] {
  return mockStocks.filter((s) => s.exchange === exchange);
}

export function getStockByTicker(ticker: string): Stock | undefined {
  return mockStocks.find((s) => s.ticker === ticker);
}
