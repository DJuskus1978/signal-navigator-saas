import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Stock, Exchange, TechnicalIndicators, FundamentalIndicators, SentimentIndicators, SentimentRating, CryptoMarketIndicators } from "@/lib/types";
import { calculatePhaseScores, getRecommendation, getConfidence } from "@/lib/recommendation-engine";
import { calculateCryptoPhaseScores } from "@/lib/crypto-scoring-engine";
import { calculateAllRadarScores } from "@/lib/radar-scoring";

// Tickers grouped by our exchange categories
const EXCHANGE_TICKERS: Record<Exchange, string[]> = {
  nasdaq: [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "NFLX",
    "AMD", "INTC", "ADBE", "PYPL", "QCOM", "AVGO", "CSCO", "PEP",
    "COST", "SBUX", "MDLZ", "GILD", "ISRG", "REGN", "ADP", "LRCX",
  ],
  dow: [
    "UNH", "GS", "HD", "CAT", "CRM", "V", "JPM", "WMT",
    "MCD", "DIS", "NKE", "BA", "IBM", "AXP", "MMM", "JNJ",
    "PG", "KO", "MRK", "TRV", "DOW", "AMGN", "HON", "CSCO",
  ],
  sp500: [
    "BRK-B", "XOM", "LLY", "MA", "ABBV", "PFE", "COST", "T",
    "CVX", "BAC", "WFC", "ORCL", "TMO", "ACN", "LIN", "DHR",
    "PM", "NEE", "UPS", "RTX", "LOW", "SPGI", "INTU", "SYK",
  ],
  crypto: [
    "BTCUSD", "ETHUSD", "BNBUSD", "SOLUSD", "XRPUSD",
    "ADAUSD", "DOGEUSD", "AVAXUSD", "DOTUSD", "MATICUSD",
  ],
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

interface DetailSentiment {
  newsCount: number;
  analystRating: number;
  insiderActivity: number;
  headline: string;
  recentNews: { title: string; publisher: string; date: string }[];
  grades: { company: string; grade: string; action: string; date: string }[];
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
  fundamental: {
    peRatio: number | null;
    forwardPE: number | null;
    earningsGrowth: number | null;
    debtToEquity: number | null;
    revenueGrowth: number | null;
    profitMargin: number | null;
    returnOnEquity: number | null;
    freeCashFlowYield: number | null;
  };
  sentiment: DetailSentiment;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

function edgeFnUrl(path: string) {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1/fetch-stocks${path}`;
}

async function fetchBatchQuotes(symbols: string[]): Promise<QuoteResponse[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(edgeFnUrl(`?symbols=${symbols.join(",")}`), { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.stocks || [];
}

async function fetchStockDetail(symbol: string): Promise<DetailResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(edgeFnUrl(`?symbol=${symbol}`), { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Data mapping ────────────────────────────────────────────────────────────

const DEFAULT_FUNDAMENTAL: FundamentalIndicators = {
  peRatio: 20, forwardPE: 18, earningsGrowth: 10, debtToEquity: 0.8,
  revenueGrowth: 8, profitMargin: 15, returnOnEquity: 18, freeCashFlowYield: 4,
};

const DEFAULT_SENTIMENT: SentimentIndicators = {
  newsScore: 0, newsCount: 5, socialScore: 0, analystRating: 3,
  insiderActivity: 0, headline: "", sentimentRating: "neutral",
};

function buildTechnicals(price: number, volume: number, avgVolume: number, tech?: DetailResponse["technical"]): TechnicalIndicators {
  return {
    rsi: tech?.rsi ?? 50,
    macd: tech?.macd ?? 0,
    macdSignal: tech?.macdSignal ?? 0,
    sma50: tech?.sma50 ?? price,
    sma200: tech?.sma200 ?? price,
    ema20: tech?.ema20 ?? price,
    volume,
    avgVolume,
    bollingerUpper: tech?.bollingerUpper ?? price * 1.05,
    bollingerLower: tech?.bollingerLower ?? price * 0.95,
    atr: tech?.atr ?? price * 0.02,
  };
}

function buildFundamentals(f?: DetailResponse["fundamental"]): FundamentalIndicators {
  if (!f) return DEFAULT_FUNDAMENTAL;
  return {
    peRatio: f.peRatio ?? DEFAULT_FUNDAMENTAL.peRatio,
    forwardPE: f.forwardPE ?? DEFAULT_FUNDAMENTAL.forwardPE,
    earningsGrowth: f.earningsGrowth ?? DEFAULT_FUNDAMENTAL.earningsGrowth,
    debtToEquity: f.debtToEquity ?? DEFAULT_FUNDAMENTAL.debtToEquity,
    revenueGrowth: f.revenueGrowth ?? DEFAULT_FUNDAMENTAL.revenueGrowth,
    profitMargin: f.profitMargin ?? DEFAULT_FUNDAMENTAL.profitMargin,
    returnOnEquity: f.returnOnEquity ?? DEFAULT_FUNDAMENTAL.returnOnEquity,
    freeCashFlowYield: f.freeCashFlowYield ?? DEFAULT_FUNDAMENTAL.freeCashFlowYield,
  };
}

function deriveSentimentRating(analystRating: number): SentimentRating {
  if (analystRating >= 4.3) return "very-positive";
  if (analystRating >= 3.7) return "positive";
  if (analystRating >= 2.8) return "neutral";
  if (analystRating >= 2.0) return "negative";
  return "very-negative";
}

function buildSentiment(s?: DetailSentiment): SentimentIndicators {
  if (!s) return { ...DEFAULT_SENTIMENT };
  
  // Derive a news score from analyst rating + grade activity
  // analystRating: 1-5 → map to -100 to +100
  const analystRating = s.analystRating ?? 3;
  const newsScore = Math.round((analystRating - 3) * 50); // 1→-100, 3→0, 5→+100
  
  return {
    newsScore,
    newsCount: s.newsCount ?? 0,
    socialScore: 0, // Not available on this plan
    analystRating,
    insiderActivity: s.insiderActivity ?? 0,
    headline: s.headline ?? "",
    sentimentRating: deriveSentimentRating(analystRating),
  };
}

// ─── Crypto helpers ──────────────────────────────────────────────────────────

const CRYPTO_NAMES: Record<string, string> = {
  BTCUSD: "Bitcoin", ETHUSD: "Ethereum", BNBUSD: "BNB", SOLUSD: "Solana",
  XRPUSD: "XRP", ADAUSD: "Cardano", DOGEUSD: "Dogecoin", AVAXUSD: "Avalanche",
  DOTUSD: "Polkadot", MATICUSD: "Polygon",
};

function isCryptoSymbol(symbol: string): boolean {
  return symbol.endsWith("USD") && EXCHANGE_TICKERS.crypto.includes(symbol);
}

const DEFAULT_CRYPTO_MARKET: CryptoMarketIndicators = {
  marketCap: 0, marketCapRank: 50, volumeToMarketCap: 0.05,
  circulatingSupplyPercent: 80, priceChange24h: 0, priceChange7d: 0,
  priceChange30d: 0, volatility30d: 60,
};

function buildCryptoMarket(quote: QuoteResponse): CryptoMarketIndicators {
  const rankMap: Record<string, number> = {
    BTCUSD: 1, ETHUSD: 2, BNBUSD: 4, SOLUSD: 5, XRPUSD: 6,
    ADAUSD: 9, DOGEUSD: 8, AVAXUSD: 12, DOTUSD: 14, MATICUSD: 15,
  };
  return {
    ...DEFAULT_CRYPTO_MARKET,
    marketCapRank: rankMap[quote.symbol] ?? 50,
    priceChange24h: quote.changePercent,
    volumeToMarketCap: 0.05, // approximation from batch quote
  };
}

function cryptoQuoteToStock(quote: QuoteResponse): Stock {
  const technical = buildTechnicals(quote.price, quote.volume, quote.avgVolume);
  const sentiment: SentimentIndicators = {
    ...DEFAULT_SENTIMENT,
    headline: `${CRYPTO_NAMES[quote.symbol] || quote.name} trades at $${quote.price.toFixed(2)}`,
  };
  const cryptoMarket = buildCryptoMarket(quote);
  const phaseScores = calculateCryptoPhaseScores(cryptoMarket, sentiment, technical);
  const radarScores = calculateAllRadarScores(phaseScores);
  const displayTicker = quote.symbol.replace("USD", "");
  return {
    ticker: quote.symbol,
    name: CRYPTO_NAMES[quote.symbol] || quote.name,
    exchange: "crypto" as Exchange,
    assetType: "crypto",
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    recommendation: radarScores.balanced.signal,
    confidence: radarScores.balanced.confidence,
    score: radarScores.balanced.radarScore,
    phaseScores,
    technical,
    fundamental: DEFAULT_FUNDAMENTAL,
    sentiment,
    cryptoMarket,
    hasDetailData: false,
    radarScores,
  };
}

function cryptoDetailToStock(detail: DetailResponse): Stock {
  const technical = buildTechnicals(detail.price, detail.volume, detail.avgVolume, detail.technical);
  const sentiment = buildSentiment(detail.sentiment);
  
  // Build crypto market indicators from detail data
  const cryptoMarket: CryptoMarketIndicators = {
    ...DEFAULT_CRYPTO_MARKET,
    priceChange24h: detail.changePercent,
  };
  // Use crypto fundamental data if available
  if (detail.fundamental) {
    const f = detail.fundamental;
    // Map FMP crypto fields
    cryptoMarket.priceChange7d = f.revenueGrowth ?? 0; // reused field from edge fn
    cryptoMarket.priceChange30d = f.earningsGrowth ?? 0; // reused field from edge fn
  }
  
  const phaseScores = calculateCryptoPhaseScores(cryptoMarket, sentiment, technical);
  const radarScores = calculateAllRadarScores(phaseScores);
  return {
    ticker: detail.symbol,
    name: CRYPTO_NAMES[detail.symbol] || detail.name,
    exchange: "crypto" as Exchange,
    assetType: "crypto",
    price: detail.price,
    change: detail.change,
    changePercent: detail.changePercent,
    recommendation: radarScores.balanced.signal,
    confidence: radarScores.balanced.confidence,
    score: radarScores.balanced.radarScore,
    phaseScores,
    technical,
    fundamental: DEFAULT_FUNDAMENTAL,
    sentiment,
    cryptoMarket,
    hasDetailData: true,
    radarScores,
  };
}

// ─── Stock helpers ───────────────────────────────────────────────────────────

function quoteToStock(quote: QuoteResponse, exchange: Exchange): Stock {
  if (isCryptoSymbol(quote.symbol)) return cryptoQuoteToStock(quote);
  const technical = buildTechnicals(quote.price, quote.volume, quote.avgVolume);
  const fundamental = DEFAULT_FUNDAMENTAL;
  const sentiment: SentimentIndicators = {
    ...DEFAULT_SENTIMENT,
    headline: `${quote.name} trades at $${quote.price.toFixed(2)}`,
  };
  const phaseScores = calculatePhaseScores(fundamental, sentiment, technical);
  const radarScores = calculateAllRadarScores(phaseScores);
  return {
    ticker: quote.symbol,
    name: quote.name,
    exchange,
    assetType: "stock",
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    recommendation: radarScores.balanced.signal,
    confidence: radarScores.balanced.confidence,
    score: radarScores.balanced.radarScore,
    phaseScores,
    technical,
    fundamental,
    sentiment,
    hasDetailData: false,
    radarScores,
  };
}

function detailToStock(detail: DetailResponse, exchange: Exchange): Stock {
  if (isCryptoSymbol(detail.symbol)) return cryptoDetailToStock(detail);
  const technical = buildTechnicals(detail.price, detail.volume, detail.avgVolume, detail.technical);
  const fundamental = buildFundamentals(detail.fundamental);
  const sentiment = buildSentiment(detail.sentiment);
  const phaseScores = calculatePhaseScores(fundamental, sentiment, technical);
  const radarScores = calculateAllRadarScores(phaseScores);
  return {
    ticker: detail.symbol,
    name: detail.name,
    exchange,
    assetType: "stock",
    price: detail.price,
    change: detail.change,
    changePercent: detail.changePercent,
    recommendation: radarScores.balanced.signal,
    confidence: radarScores.balanced.confidence,
    score: radarScores.balanced.radarScore,
    phaseScores,
    technical,
    fundamental,
    sentiment,
    hasDetailData: true,
    radarScores,
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
      return quotes.map((q) => quoteToStock(q, exchange));
    },
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 1,
  });
}

export function useSearchStocks(query: string, assetType: "stock" | "crypto" = "stock") {
  return useQuery<Stock[]>({
    queryKey: ["search-stocks", query, assetType],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const typeParam = assetType === "crypto" ? "&type=crypto" : "";
      const res = await fetch(edgeFnUrl(`?search=${encodeURIComponent(query)}${typeParam}`), { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const quotes: QuoteResponse[] = data.stocks || [];
      return quotes.map((q) => {
        if (assetType === "crypto") return cryptoQuoteToStock(q);
        const exchange = findExchangeForTicker(q.symbol);
        return quoteToStock(q, exchange);
      });
    },
    staleTime: 60_000,
    retry: 1,
    enabled: query.length >= 2,
  });
}

export function useLiveStockDetail(ticker: string) {
  const exchange = findExchangeForTicker(ticker);
  return useQuery<Stock>({
    queryKey: ["live-stock-detail", ticker],
    queryFn: async () => {
      const detail = await fetchStockDetail(ticker);
      return detailToStock(detail, exchange);
    },
    staleTime: 30_000,
    retry: 2,
    enabled: !!ticker,
  });
}
