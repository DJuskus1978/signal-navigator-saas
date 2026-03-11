import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const H = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const AV = "https://www.alphavantage.co/query";
const SB_URL = () => Deno.env.get("SUPABASE_URL")!;
const SB_KEY = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
const SELL_THRESHOLD = 38;
const BUY_THRESHOLD = 52;

/* ── Types ── */
interface Quote { symbol: string; price: number; change: number; changePercent: number; }

interface OpenPosition {
  ticker: string; exchange: string; shares: number;
  entry_price: number; entry_date: string; current_price: number;
  score: number; unrealized_pnl: number; unrealized_pnl_pct: number;
  action: "hold" | "buy";
}

interface ClosedPosition {
  ticker: string; exchange: string; shares: number;
  entry_price: number; entry_date: string; exit_price: number;
  realized_pnl: number; realized_pnl_pct: number;
}

/* ── Helpers ── */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchQuote(symbol: string, apiKey: string): Promise<Quote | null> {
  try {
    const r = await fetch(`${AV}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`);
    const d = await r.json();
    const gq = d?.["Global Quote"];
    if (!gq || !gq["05. price"]) return null;
    const price = parseFloat(gq["05. price"]);
    const prevClose = parseFloat(gq["08. previous close"] || "0");
    const change = Math.round((price - prevClose) * 100) / 100;
    const changePercent = prevClose > 0 ? Math.round((change / prevClose) * 10000) / 100 : 0;
    return { symbol, price, change, changePercent };
  } catch { return null; }
}

async function fetchQuotesBatched(tickers: string[], apiKey: string): Promise<Map<string, Quote>> {
  const results = new Map<string, Quote>();
  for (let i = 0; i < tickers.length; i += 4) {
    const batch = tickers.slice(i, i + 4);
    const quotes = await Promise.all(batch.map((t) => fetchQuote(t, apiKey)));
    for (const q of quotes) if (q) results.set(q.symbol, q);
    if (i + 4 < tickers.length) await delay(1200);
  }
  return results;
}

/**
 * RadarScore™ – momentum + position-aware scoring
 *  - Base: 50
 *  - Daily momentum: changePercent * 5 (capped ±15)
 *  - Position P&L factor: positionReturn * 2 (capped ±10)
 */
function radarScore(q: Quote, entryPrice?: number): number {
  let score = 50;
  score += Math.max(-15, Math.min(15, q.changePercent * 5));
  if (entryPrice) {
    const posRet = ((q.price - entryPrice) / entryPrice) * 100;
    score += Math.max(-10, Math.min(10, posRet * 2));
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

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

async function fetchBenchmarks(apiKey: string) {
  const [spy, qqq, dia] = await Promise.all([
    fetchQuote("SPY", apiKey),
    fetchQuote("QQQ", apiKey),
    fetchQuote("DIA", apiKey),
  ]);
  return {
    sp500: spy ? spy.price * 10 : null,
    nasdaq: qqq ? qqq.price * 40 : null,
    dow: dia ? dia.price * 100 : null,
  };
}

/* ── Main handler ── */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: H });
  const j = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...H, "Content-Type": "application/json" } });

  try {
    const apiKey = Deno.env.get("ALPHA_VANTAGE_API_KEY")!;
    const today = new Date().toISOString().split("T")[0];

    /* 1. Load previous state */
    const prev = await getPreviousSnapshot();
    const isFirstDay = !prev || !prev.holdings?.open_positions;

    let cash = isFirstDay ? INITIAL_CAPITAL : parseFloat(prev.cash_balance ?? INITIAL_CAPITAL);
    let totalRealizedPnl = isFirstDay ? 0 : parseFloat(prev.total_realized_pnl ?? 0);
    let openPositions: OpenPosition[] = isFirstDay ? [] : (prev.holdings?.open_positions ?? []);
    const closedToday: ClosedPosition[] = [];

    /* 2. Fetch current prices for all open positions */
    const openTickers = openPositions.map((p) => p.ticker);
    const openQuotes = openTickers.length > 0 ? await fetchQuotesBatched(openTickers, apiKey) : new Map<string, Quote>();

    /* 3. Score each open position → HOLD or SELL */
    const keptPositions: OpenPosition[] = [];
    for (const pos of openPositions) {
      const quote = openQuotes.get(pos.ticker);
      if (!quote) {
        // Can't get quote — hold with stale data
        keptPositions.push({ ...pos, action: "hold" });
        continue;
      }
      const score = radarScore(quote, pos.entry_price);
      const unrealized_pnl = Math.round((quote.price - pos.entry_price) * pos.shares * 100) / 100;
      const unrealized_pnl_pct = Math.round(((quote.price - pos.entry_price) / pos.entry_price) * 10000) / 100;

      if (score < SELL_THRESHOLD) {
        /* SELL */
        const realized_pnl = Math.round((quote.price - pos.entry_price) * pos.shares * 100) / 100;
        const realized_pnl_pct = Math.round(((quote.price - pos.entry_price) / pos.entry_price) * 10000) / 100;
        cash += pos.shares * quote.price;
        totalRealizedPnl += realized_pnl;
        closedToday.push({
          ticker: pos.ticker, exchange: pos.exchange, shares: pos.shares,
          entry_price: pos.entry_price, entry_date: pos.entry_date,
          exit_price: quote.price, realized_pnl, realized_pnl_pct,
        });
      } else {
        /* HOLD */
        keptPositions.push({
          ...pos, current_price: quote.price, score,
          unrealized_pnl, unrealized_pnl_pct, action: "hold",
        });
      }
    }

    /* 4. Count free slots per index */
    const slotsUsed: Record<string, number> = { nasdaq: 0, dow: 0, sp500: 0 };
    for (const p of keptPositions) slotsUsed[p.exchange] = (slotsUsed[p.exchange] || 0) + 1;

    const heldTickers = new Set(keptPositions.map((p) => p.ticker));
    const newPositions: OpenPosition[] = [];

    /* 5. For each index with free slots, scan & buy best candidates */
    for (const [exchange, universe] of Object.entries(INDEX_UNIVERSE)) {
      const freeSlots = POSITIONS_PER_INDEX - (slotsUsed[exchange] || 0);
      if (freeSlots <= 0) continue;

      const candidates = universe.filter((t) => !heldTickers.has(t));
      const sampled = candidates.sort(() => Math.random() - 0.5).slice(0, Math.min(14, candidates.length));

      await delay(1200);
      const candidateQuotes = await fetchQuotesBatched(sampled, apiKey);

      const scored = Array.from(candidateQuotes.values())
        .map((q) => ({ quote: q, score: radarScore(q) }))
        .filter((s) => s.score >= BUY_THRESHOLD)
        .sort((a, b) => b.score - a.score)
        .slice(0, freeSlots);

      for (const s of scored) {
        newPositions.push({
          ticker: s.quote.symbol, exchange, shares: 0,
          entry_price: s.quote.price, entry_date: today,
          current_price: s.quote.price, score: s.score,
          unrealized_pnl: 0, unrealized_pnl_pct: 0, action: "buy",
        });
      }
    }

    /* 6. Allocate cash equally to new positions */
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

    /* 7. Combine all open positions */
    const allOpen = [...keptPositions, ...validNew];

    /* 8. Portfolio value = cash + market value of all positions */
    const posValue = allOpen.reduce((s, p) => s + p.shares * p.current_price, 0);
    const portfolioValue = Math.round((cash + posValue) * 100) / 100;

    /* 9. Benchmarks */
    await delay(1200);
    const bench = await fetchBenchmarks(apiKey);
    const first = isFirstDay ? null : await getFirstSnapshot();
    const sp500Init = isFirstDay ? bench.sp500 : (first?.benchmark_sp500_initial ?? bench.sp500);
    const nasdaqInit = isFirstDay ? bench.nasdaq : (first?.benchmark_nasdaq_initial ?? bench.nasdaq);
    const dowInit = isFirstDay ? bench.dow : (first?.benchmark_dow_initial ?? bench.dow);

    /* 10. Upsert today's snapshot */
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
    });
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
});
