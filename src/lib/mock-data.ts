import type { Stock, Exchange, TechnicalIndicators, FundamentalIndicators } from "./types";
import { calculateTechnicalScore, calculateFundamentalScore, getRecommendation, getConfidence } from "./recommendation-engine";

function rand(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function generateTechnical(): TechnicalIndicators {
  const sma200 = rand(50, 400);
  return {
    rsi: rand(15, 85),
    macd: rand(-3, 5),
    macdSignal: rand(-2, 4),
    sma50: sma200 * rand(0.9, 1.15),
    sma200,
    volume: rand(1_000_000, 80_000_000),
    avgVolume: rand(2_000_000, 50_000_000),
  };
}

function generateFundamental(): FundamentalIndicators {
  return {
    peRatio: rand(5, 60),
    earningsGrowth: rand(-20, 50),
    debtToEquity: rand(0.1, 3),
    revenueGrowth: rand(-10, 40),
  };
}

function createStock(ticker: string, name: string, exchange: Exchange, priceBase: number): Stock {
  const technical = generateTechnical();
  const fundamental = generateFundamental();
  const techScore = calculateTechnicalScore(technical);
  const fundScore = calculateFundamentalScore(fundamental);
  const score = techScore + fundScore;
  const change = rand(-priceBase * 0.05, priceBase * 0.05);

  return {
    ticker,
    name,
    exchange,
    price: priceBase + change,
    change,
    changePercent: (change / priceBase) * 100,
    recommendation: getRecommendation(score),
    confidence: getConfidence(score),
    score,
    technical,
    fundamental,
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

  // S&P 500 (extras beyond Nasdaq/Dow overlap)
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
