import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Stock, Exchange, TechnicalIndicators } from "@/lib/types";
import { calculatePhaseScores, getRecommendation, getConfidence } from "@/lib/recommendation-engine";
import { mockStocks } from "@/lib/mock-data";

// Tickers grouped by our exchange categories
const EXCHANGE_TICKERS: Record<Exchange, string[]> = {
  nasdaq: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "NFLX"],
  dow: ["UNH", "GS", "HD", "CAT", "CRM", "V", "JPM", "WMT"],
  sp500: ["BRK.B", "XOM", "LLY", "MA", "ABBV", "PFE", "COST", "T"],
};

interface QuoteResponse {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
}

interface DetailResponse extends QuoteResponse {
  technical: {
    rsi: number | null;
    macd: number | null;
    macdSignal: number | null;
    sma50: number | null;
    sma200: number | null;
    ema20: number | null;
    bollingerUpper: number | null;
    bollingerLower: number | null;
    atr: number | null;
  };
}

async function fetchBatchQuotes(symbols: string[]): Promise<QuoteResponse[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = `https://${projectId}.supabase.co/functions/v1/fetch-stocks?symbols=${symbols.join(",")}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.stocks || [];
}

async function fetchStockDetail(symbol: string): Promise<DetailResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = `https://${projectId}.supabase.co/functions/v1/fetch-stocks?symbol=${symbol}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Merge live quote data with mock fundamental/sentiment data to produce a full Stock object.
 * Technical data from the API replaces mock technicals when available.
 */
function mergeQuoteWithMock(quote: QuoteResponse, exchange: Exchange): Stock {
  // Find the matching mock stock for its fundamental & sentiment data
  const mock = mockStocks.find((s) => s.ticker === quote.symbol);
  if (!mock) {
    // Fallback: create a minimal stock
    const fundamental = mock?.fundamental || {
      peRatio: 20, forwardPE: 18, earningsGrowth: 10, debtToEquity: 0.8,
      revenueGrowth: 8, profitMargin: 15, returnOnEquity: 18, freeCashFlowYield: 4,
    };
    const sentiment = mock?.sentiment || {
      newsScore: 0, newsCount: 5, socialScore: 0, analystRating: 3,
      insiderActivity: 0, headline: `${quote.name} trades at $${quote.price.toFixed(2)}`,
      sentimentRating: "neutral" as const,
    };
    const technical: TechnicalIndicators = {
      rsi: 50, macd: 0, macdSignal: 0, sma50: quote.price, sma200: quote.price,
      ema20: quote.price, volume: quote.volume, avgVolume: quote.avgVolume,
      bollingerUpper: quote.price * 1.05, bollingerLower: quote.price * 0.95, atr: quote.price * 0.02,
    };
    const phaseScores = calculatePhaseScores(fundamental, sentiment, technical);
    return {
      ticker: quote.symbol,
      name: quote.name,
      exchange,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      recommendation: getRecommendation(phaseScores.combined),
      confidence: getConfidence(phaseScores.combined),
      score: phaseScores.combined,
      phaseScores,
      technical,
      fundamental,
      sentiment,
    };
  }

  // Use live price data, keep mock fundamentals & sentiment
  const technical: TechnicalIndicators = {
    ...mock.technical,
    volume: quote.volume || mock.technical.volume,
    avgVolume: quote.avgVolume || mock.technical.avgVolume,
  };

  const phaseScores = calculatePhaseScores(mock.fundamental, mock.sentiment, technical);

  return {
    ...mock,
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    technical,
    phaseScores,
    recommendation: getRecommendation(phaseScores.combined),
    confidence: getConfidence(phaseScores.combined),
    score: phaseScores.combined,
  };
}

function mergeDetailWithMock(detail: DetailResponse, exchange: Exchange): Stock {
  const mock = mockStocks.find((s) => s.ticker === detail.symbol);
  const fallbackTech = mock?.technical;

  const technical: TechnicalIndicators = {
    rsi: detail.technical.rsi ?? fallbackTech?.rsi ?? 50,
    macd: detail.technical.macd ?? fallbackTech?.macd ?? 0,
    macdSignal: detail.technical.macdSignal ?? fallbackTech?.macdSignal ?? 0,
    sma50: detail.technical.sma50 ?? fallbackTech?.sma50 ?? detail.price,
    sma200: detail.technical.sma200 ?? fallbackTech?.sma200 ?? detail.price,
    ema20: detail.technical.ema20 ?? fallbackTech?.ema20 ?? detail.price,
    volume: detail.volume || fallbackTech?.volume || 0,
    avgVolume: detail.avgVolume || fallbackTech?.avgVolume || 0,
    bollingerUpper: detail.technical.bollingerUpper ?? fallbackTech?.bollingerUpper ?? detail.price * 1.05,
    bollingerLower: detail.technical.bollingerLower ?? fallbackTech?.bollingerLower ?? detail.price * 0.95,
    atr: detail.technical.atr ?? fallbackTech?.atr ?? detail.price * 0.02,
  };

  const fundamental = mock?.fundamental || {
    peRatio: 20, forwardPE: 18, earningsGrowth: 10, debtToEquity: 0.8,
    revenueGrowth: 8, profitMargin: 15, returnOnEquity: 18, freeCashFlowYield: 4,
  };

  const sentiment = mock?.sentiment || {
    newsScore: 0, newsCount: 5, socialScore: 0, analystRating: 3,
    insiderActivity: 0, headline: `${detail.name} trades at $${detail.price.toFixed(2)}`,
    sentimentRating: "neutral" as const,
  };

  const phaseScores = calculatePhaseScores(fundamental, sentiment, technical);

  return {
    ticker: detail.symbol,
    name: detail.name,
    exchange,
    price: detail.price,
    change: detail.change,
    changePercent: detail.changePercent,
    recommendation: getRecommendation(phaseScores.combined),
    confidence: getConfidence(phaseScores.combined),
    score: phaseScores.combined,
    phaseScores,
    technical,
    fundamental,
    sentiment,
  };
}

function findExchangeForTicker(ticker: string): Exchange {
  for (const [ex, tickers] of Object.entries(EXCHANGE_TICKERS)) {
    if (tickers.includes(ticker)) return ex as Exchange;
  }
  return "nasdaq";
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useLiveStocks(exchange: Exchange) {
  return useQuery<Stock[]>({
    queryKey: ["live-stocks", exchange],
    queryFn: async () => {
      const symbols = EXCHANGE_TICKERS[exchange];
      const quotes = await fetchBatchQuotes(symbols);
      return quotes.map((q) => mergeQuoteWithMock(q, exchange));
    },
    staleTime: 5 * 60_000, // 5 minutes (free tier: 8 credits/min)
    refetchInterval: 5 * 60_000,
    retry: 1,
  });
}

export function useLiveStockDetail(ticker: string) {
  const exchange = findExchangeForTicker(ticker);
  return useQuery<Stock>({
    queryKey: ["live-stock-detail", ticker],
    queryFn: async () => {
      const detail = await fetchStockDetail(ticker);
      return mergeDetailWithMock(detail, exchange);
    },
    staleTime: 30_000,
    retry: 2,
    enabled: !!ticker,
  });
}
