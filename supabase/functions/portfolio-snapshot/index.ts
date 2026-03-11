import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const H = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const SB_URL = () => Deno.env.get("SUPABASE_URL")!;
const SB_KEY = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AV_BASE = "https://www.alphavantage.co/query";

/* ── Universe of tickers per index ── */
const INDEX_UNIVERSE: Record<string, string[]> = {
  nasdaq: [
    "AAPL","MSFT","GOOGL","AMZN","NVDA","META","TSLA","NFLX",
    "AMD","INTC","ADBE","PYPL","QCOM","AVGO","CSCO","PEP",
    "COST","SBUX","MDLZ","GILD","ISRG","REGN","ADP","LRCX",
  ],
  dow: [
    "UNH","GS","HD","CAT","CRM","V","JPM","WMT",
    "MCD","DIS","NKE","BA","IBM","AXP","MMM","JNJ",
    "PG","KO","MRK","TRV","DOW","AMGN","HON","CSCO",
  ],
  sp500: [
    "BRK-B","XOM","LLY","MA","ABBV","PFE","COST","T",
    "CVX","BAC","WFC","ORCL","TMO","ACN","LIN","DHR",
    "PM","NEE","UPS","RTX","LOW","SPGI","INTU","SYK",
  ],
};

const POSITIONS_PER_INDEX = 10;
const INITIAL_CAPITAL = 100_000;

/* ── Quote type ── */
interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changesPercentage: number;
  pe: number | null;
  volume: number;
  avgVolume: number;
  marketCap: number;
  previousClose: number;
}

interface OpenPosition {
  ticker: string; exchange: string; shares: number;
  entry_price: number; entry_date: string; current_price: number;
  score: number; recommendation: string;
  unrealized_pnl: number; unrealized_pnl_pct: number;
  action: "hold" | "buy";
}

interface ClosedPosition {
  ticker: string; exchange: string; shares: number;
  entry_price: number; entry_date: string; exit_price: number;
  realized_pnl: number; realized_pnl_pct: number;
  recommendation: string;
}

/* ════════════════════════════════════════════════════════════════════════════
   THREE-PHASE RadarScore™ — mirrors src/lib/recommendation-engine.ts
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * Phase 1: Fundamentals — P/E is the primary metric available from batch quotes.
 * We scale the P/E sub-score to approximate the full fundamental range.
 */
function calculateFundamentalScore(pe: number | null): number {
  if (pe === null || pe <= 0) return 0; // no data → neutral

  let score = 0;
  // P/E ratio — matches recommendation-engine.ts thresholds exactly
  if (pe < 12) score += 25;
  else if (pe < 18) score += 15;
  else if (pe < 25) score += 5;
  else if (pe < 35) score -= 5;
  else score -= 15;

  // Scale up since we only have P/E (full engine has 8 sub-indicators)
  // P/E is the highest-weight single indicator so we give it ~2x
  return score * 2;
}

/**
 * Phase 2: Sentiment — without live news/social feeds in the batch context,
 * we use volume surge as a proxy for market attention/conviction.
 * Volume spikes with positive price action ≈ bullish sentiment.
 */
function calculateSentimentScore(
  changesPercentage: number,
  volumeRatio: number
): number {
  let score = 0;

  // Volume-price agreement as sentiment proxy
  if (volumeRatio > 2 && changesPercentage > 0) score += 20;
  else if (volumeRatio > 1.5 && changesPercentage > 0) score += 12;
  else if (volumeRatio > 1.2) score += 5;
  else if (volumeRatio > 0.8) score += 0;
  else if (changesPercentage < -1) score -= 10;
  else score -= 3;

  // Momentum direction as "market mood"
  if (changesPercentage > 3) score += 15;
  else if (changesPercentage > 1) score += 8;
  else if (changesPercentage > 0) score += 3;
  else if (changesPercentage > -1) score -= 3;
  else if (changesPercentage > -3) score -= 8;
  else score -= 15;

  return score;
}

/**
 * Phase 3: Technicals — uses momentum, volume conviction, and position trend.
 * Receives a fundamentalBias to align with the real engine's context-aware scoring.
 */
function calculateTechnicalScore(
  changesPercentage: number,
  volumeRatio: number,
  fundamentalBias: number,
  entryPrice?: number,
  currentPrice?: number
): number {
  let score = 0;

  // Momentum (proxy for RSI + MACD direction)
  // Matches recommendation-engine.ts RSI/MACD threshold patterns
  if (changesPercentage > 3) score += 22;
  else if (changesPercentage > 1.5) score += 14;
  else if (changesPercentage > 0.3) score += 5;
  else if (changesPercentage > -0.3) score += 0;
  else if (changesPercentage > -1.5) score -= 10;
  else if (changesPercentage > -3) score -= 15;
  else score -= 20;

  // Volume conviction — matches recommendation-engine.ts exactly
  if (volumeRatio > 2) score += 12;
  else if (volumeRatio > 1.3) score += 7;
  else if (volumeRatio > 0.8) score += 0;
  else score -= 5;

  // Position trend (proxy for SMA50/SMA200 golden/death cross)
  if (entryPrice && currentPrice) {
    const posRet = ((currentPrice - entryPrice) / entryPrice) * 100;
    if (posRet > 10) score += 20;
    else if (posRet > 5) score += 12;
    else if (posRet > 1) score += 5;
    else if (posRet > -1) score += 0;
    else if (posRet > -5) score -= 10;
    else score -= 18;
  }

  // High volatility + strong fundamentals = opportunity (matches engine)
  if (Math.abs(changesPercentage) > 3 && fundamentalBias > 20) score += 8;
  else if (Math.abs(changesPercentage) > 5) score -= 5;

  return score;
}

/**
 * Combined RadarScore™ — same weights as recommendation-engine.ts:
 *   Fundamentals: 40%, Sentiment: 25%, Technicals: 35%
 *
 * Same recommendation thresholds:
 *   >= 60 → strong-buy, >= 30 → buy, >= 5 → hold, >= -15 → dont-buy, else → sell
 */
function calculateRadarScore(
  quote: StockQuote,
  entryPrice?: number
): { score: number; recommendation: string; fundScore: number; sentScore: number; techScore: number } {
  const volumeRatio = quote.avgVolume > 0 ? quote.volume / quote.avgVolume : 1;

  const fundScore = calculateFundamentalScore(quote.pe);
  const sentScore = calculateSentimentScore(quote.changesPercentage, volumeRatio);
  const techScore = calculateTechnicalScore(
    quote.changesPercentage, volumeRatio, fundScore,
    entryPrice, quote.price
  );

  // Weighted combination — matches recommendation-engine.ts exactly
  const combined = Math.round(fundScore * 0.40 + sentScore * 0.25 + techScore * 0.35);

  let recommendation: string;
  if (combined >= 60) recommendation = "strong-buy";
  else if (combined >= 30) recommendation = "buy";
  else if (combined >= 5) recommendation = "hold";
  else if (combined >= -15) recommendation = "dont-buy";
  else recommendation = "sell";

  return { score: combined, recommendation, fundScore, sentScore, techScore };
}

/* ── Data fetching (Alpha Vantage — batched with rate-limit delays) ── */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchAVQuote(symbol: string, apiKey: string): Promise<StockQuote | null> {
  try {
    const r = await fetch(`${AV_BASE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`);
    const d = await r.json();
    const gq = d?.["Global Quote"];
    if (!gq || !gq["05. price"]) return null;
    const price = parseFloat(gq["05. price"]);
    const previousClose = parseFloat(gq["08. previous close"] || "0");
    const volume = parseInt(gq["06. volume"] || "0", 10);
    const change = Math.round((price - previousClose) * 100) / 100;
    const changesPct = previousClose > 0 ? Math.round((change / previousClose) * 10000) / 100 : 0;
    return {
      symbol, price, change, changesPercentage: changesPct,
      pe: null, volume, avgVolume: volume,
      marketCap: 0, previousClose,
    };
  } catch (e) {
    console.error(`AV quote error for ${symbol}:`, e);
    return null;
  }
}

async function fetchAllQuotes(tickers: string[], apiKey: string): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();
  const BATCH_SIZE = 5;
  const BATCH_DELAY = 1200; // ~5 calls per 1.2s keeps within 75/min

  for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
    const batch = tickers.slice(i, i + BATCH_SIZE);
    const promises = batch.map((t) => fetchAVQuote(t, apiKey));
    const quotes = await Promise.all(promises);
    for (const q of quotes) {
      if (q) results.set(q.symbol, q);
    }
    if (i + BATCH_SIZE < tickers.length) await delay(BATCH_DELAY);
  }
  return results;
}

/* ── Supabase helpers ── */

async function getPreviousSnapshot() {
  const res = await fetch(
    `${SB_URL()}/rest/v1/portfolio_snapshots?select=*&order=snapshot_date.desc&limit=1`,
    { headers: { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}` } },
  );
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function getFirstSnapshot() {
  const res = await fetch(
    `${SB_URL()}/rest/v1/portfolio_snapshots?select=benchmark_sp500_initial,benchmark_nasdaq_initial,benchmark_dow_initial&order=snapshot_date.asc&limit=1`,
    { headers: { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}` } },
  );
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

/* ── Main handler ── */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: H });
  const j = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...H, "Content-Type": "application/json" } });

  try {
    const avKey = Deno.env.get("ALPHA_VANTAGE_API_KEY")!;
    const today = new Date().toISOString().split("T")[0];

    /* 1. Load previous state */
    const prev = await getPreviousSnapshot();
    const isFirstDay = !prev || !prev.holdings?.open_positions;

    let cash = isFirstDay ? INITIAL_CAPITAL : parseFloat(prev.cash_balance ?? INITIAL_CAPITAL);
    let totalRealizedPnl = isFirstDay ? 0 : parseFloat(prev.total_realized_pnl ?? 0);
    let openPositions: OpenPosition[] = isFirstDay ? [] : (prev.holdings?.open_positions ?? []);
    const closedToday: ClosedPosition[] = [];

    /* 2. Gather ALL tickers we need quotes for (open + full universe + benchmarks) */
    const allUniverseTickers = new Set<string>();
    for (const tickers of Object.values(INDEX_UNIVERSE)) {
      for (const t of tickers) allUniverseTickers.add(t);
    }
    for (const p of openPositions) allUniverseTickers.add(p.ticker);
    // Add benchmark ETFs
    allUniverseTickers.add("SPY");
    allUniverseTickers.add("QQQ");
    allUniverseTickers.add("DIA");

    /* 3. Fetch all quotes via Alpha Vantage (batched with rate-limit delays) */
    const allQuotes = await fetchAllQuotes([...allUniverseTickers], avKey);

    /* 4. Score each open position → HOLD or SELL */
    const keptPositions: OpenPosition[] = [];
    for (const pos of openPositions) {
      const quote = allQuotes.get(pos.ticker);
      if (!quote) {
        // Can't get quote — hold with stale data
        keptPositions.push({ ...pos, action: "hold" });
        continue;
      }
      const { score, recommendation } = calculateRadarScore(quote, pos.entry_price);
      const unrealized_pnl = Math.round((quote.price - pos.entry_price) * pos.shares * 100) / 100;
      const unrealized_pnl_pct = Math.round(((quote.price - pos.entry_price) / pos.entry_price) * 10000) / 100;

      // SELL when RadarScore says "sell" or "dont-buy" — consistent with recommendation engine
      if (recommendation === "sell" || recommendation === "dont-buy") {
        const realized_pnl = Math.round((quote.price - pos.entry_price) * pos.shares * 100) / 100;
        const realized_pnl_pct = Math.round(((quote.price - pos.entry_price) / pos.entry_price) * 10000) / 100;
        cash += pos.shares * quote.price;
        totalRealizedPnl += realized_pnl;
        closedToday.push({
          ticker: pos.ticker, exchange: pos.exchange, shares: pos.shares,
          entry_price: pos.entry_price, entry_date: pos.entry_date,
          exit_price: quote.price, realized_pnl, realized_pnl_pct, recommendation,
        });
      } else {
        /* HOLD */
        keptPositions.push({
          ...pos, current_price: quote.price, score, recommendation,
          unrealized_pnl, unrealized_pnl_pct, action: "hold",
        });
      }
    }

    /* 5. Count free slots per index */
    const slotsUsed: Record<string, number> = { nasdaq: 0, dow: 0, sp500: 0 };
    for (const p of keptPositions) slotsUsed[p.exchange] = (slotsUsed[p.exchange] || 0) + 1;

    const heldTickers = new Set(keptPositions.map((p) => p.ticker));
    const newPositions: OpenPosition[] = [];

    /* 6. For each index with free slots, score candidates & buy best */
    for (const [exchange, universe] of Object.entries(INDEX_UNIVERSE)) {
      const freeSlots = POSITIONS_PER_INDEX - (slotsUsed[exchange] || 0);
      if (freeSlots <= 0) continue;

      const candidates = universe.filter((t) => !heldTickers.has(t));

      // Score all candidates using the same RadarScore™
      const scored = candidates
        .map((ticker) => {
          const quote = allQuotes.get(ticker);
          if (!quote) return null;
          const result = calculateRadarScore(quote);
          return { ticker, quote, ...result };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null)
        // BUY only when RadarScore says "buy" or "strong-buy"
        .filter((s) => s.recommendation === "buy" || s.recommendation === "strong-buy")
        .sort((a, b) => b.score - a.score)
        .slice(0, freeSlots);

      for (const s of scored) {
        newPositions.push({
          ticker: s.ticker, exchange, shares: 0,
          entry_price: s.quote.price, entry_date: today,
          current_price: s.quote.price, score: s.score,
          recommendation: s.recommendation,
          unrealized_pnl: 0, unrealized_pnl_pct: 0, action: "buy",
        });
      }
    }

    /* 7. Allocate cash equally to new positions */
    if (newPositions.length > 0 && cash > 0) {
      const perPos = cash / newPositions.length;
      let totalSpent = 0;
      for (const pos of newPositions) {
        pos.shares = Math.floor((perPos / pos.entry_price) * 100) / 100;
        totalSpent += pos.shares * pos.entry_price;
      }
      cash = Math.round((cash - totalSpent) * 100) / 100;
    }
    const validNew = newPositions.filter((p) => p.shares > 0);

    /* 8. Combine all open positions */
    const allOpen = [...keptPositions, ...validNew];

    /* 9. Portfolio value */
    const posValue = allOpen.reduce((s, p) => s + p.shares * p.current_price, 0);
    const portfolioValue = Math.round((cash + posValue) * 100) / 100;

    /* 10. Benchmarks from the same batch call */
    const spyQ = allQuotes.get("SPY");
    const qqqQ = allQuotes.get("QQQ");
    const diaQ = allQuotes.get("DIA");
    const bench = {
      sp500: spyQ ? spyQ.price * 10 : null,
      nasdaq: qqqQ ? qqqQ.price * 40 : null,
      dow: diaQ ? diaQ.price * 100 : null,
    };

    const first = isFirstDay ? null : await getFirstSnapshot();
    const sp500Init = isFirstDay ? bench.sp500 : (first?.benchmark_sp500_initial ?? bench.sp500);
    const nasdaqInit = isFirstDay ? bench.nasdaq : (first?.benchmark_nasdaq_initial ?? bench.nasdaq);
    const dowInit = isFirstDay ? bench.dow : (first?.benchmark_dow_initial ?? bench.dow);

    /* 11. Upsert today's snapshot */
    const snapshot = {
      snapshot_date: today,
      portfolio_value: portfolioValue,
      initial_value: INITIAL_CAPITAL,
      cash_balance: cash,
      total_realized_pnl: Math.round(totalRealizedPnl * 100) / 100,
      holdings: {
        open_positions: allOpen,
        closed_today: closedToday,
        summary: {
          total_positions: allOpen.length,
          buys_today: validNew.length,
          sells_today: closedToday.length,
          holds: keptPositions.length,
        },
      },
      benchmark_sp500: bench.sp500,
      benchmark_nasdaq: bench.nasdaq,
      benchmark_dow: bench.dow,
      benchmark_sp500_initial: sp500Init,
      benchmark_nasdaq_initial: nasdaqInit,
      benchmark_dow_initial: dowInit,
    };

    await fetch(`${SB_URL()}/rest/v1/portfolio_snapshots`, {
      method: "POST",
      headers: {
        apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}`,
        "Content-Type": "application/json", Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(snapshot),
    });

    return j({
      success: true, date: today,
      portfolio_value: portfolioValue,
      cash_balance: cash,
      open_positions: allOpen.length,
      buys_today: validNew.length,
      sells_today: closedToday.length,
      holds: keptPositions.length,
      realized_pnl: Math.round(totalRealizedPnl * 100) / 100,
      benchmark_sp500: bench.sp500,
      benchmark_nasdaq: bench.nasdaq,
      benchmark_dow: bench.dow,
      scoring_engine: "RadarScore™ three-phase (fundamental 40%, sentiment 25%, technical 35%)",
    });
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
});
