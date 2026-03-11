import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const H = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const AV = "https://www.alphavantage.co/query";
const SB_URL = () => Deno.env.get("SUPABASE_URL")!;
const SB_KEY = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Top tickers per index — we sample and score to pick the best 10
const INDEX_TICKERS: Record<string, string[]> = {
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

interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

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
  } catch {
    return null;
  }
}

// Score: momentum-based — positive daily change = higher score
function quickScore(q: Quote): number {
  return 50 + q.changePercent * 5;
}

interface Holding {
  ticker: string;
  exchange: string;
  score: number;
  price: number;
  changePercent: number;
  action: "buy" | "hold" | "sell";
}

async function selectTopHoldings(apiKey: string): Promise<Holding[]> {
  const allHoldings: Holding[] = [];

  for (const [exchange, tickers] of Object.entries(INDEX_TICKERS)) {
    // Sample 12 random tickers to stay within rate limits
    const sampled = tickers.sort(() => Math.random() - 0.5).slice(0, 12);
    const quotes: Quote[] = [];

    for (let i = 0; i < sampled.length; i += 4) {
      const batch = sampled.slice(i, i + 4);
      const results = await Promise.all(batch.map((s) => fetchQuote(s, apiKey)));
      quotes.push(...(results.filter(Boolean) as Quote[]));
      if (i + 4 < sampled.length) await delay(1200);
    }

    // Score and pick top 10 per index
    const scored = quotes
      .map((q) => ({ ...q, score: quickScore(q) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    for (const s of scored) {
      allHoldings.push({
        ticker: s.symbol,
        exchange,
        score: Math.round(s.score),
        price: s.price,
        changePercent: s.changePercent,
        action: s.changePercent >= 0 ? "buy" : "sell",
      });
    }
  }
  return allHoldings;
}

async function fetchBenchmarks(apiKey: string) {
  // SPY ≈ S&P 500 / 10, QQQ ≈ Nasdaq / 40, DIA ≈ Dow / 100
  const [spy, qqq, dia] = await Promise.all([
    fetchQuote("SPY", apiKey),
    fetchQuote("QQQ", apiKey),
    fetchQuote("DIA", apiKey),
  ]);
  return {
    sp500: spy ? spy.price * 10 : null,
    nasdaq: qqq ? qqq.price * 40 : null,
    dow: dia ? dia.price * 100 : null,
    sp500Change: spy?.changePercent ?? null,
    nasdaqChange: qqq?.changePercent ?? null,
    dowChange: dia?.changePercent ?? null,
  };
}

async function getPreviousSnapshot() {
  const res = await fetch(
    `${SB_URL()}/rest/v1/portfolio_snapshots?select=portfolio_value,snapshot_date&order=snapshot_date.desc&limit=1`,
    { headers: { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}` } }
  );
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? parseFloat(rows[0].portfolio_value) : null;
}

async function getFirstSnapshot() {
  const res = await fetch(
    `${SB_URL()}/rest/v1/portfolio_snapshots?select=benchmark_sp500_initial,benchmark_nasdaq_initial,benchmark_dow_initial&order=snapshot_date.asc&limit=1`,
    { headers: { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}` } }
  );
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: H });
  const j = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...H, "Content-Type": "application/json" } });

  try {
    const apiKey = Deno.env.get("ALPHA_VANTAGE_API_KEY")!;
    const INITIAL_VALUE = 100000;

    // 1. Select top holdings
    const holdings = await selectTopHoldings(apiKey);
    if (holdings.length === 0) return j({ error: "No quotes available" }, 500);

    // 2. Fetch benchmarks
    await delay(1200);
    const bench = await fetchBenchmarks(apiKey);

    // 3. Calculate portfolio value
    const prevValue = await getPreviousSnapshot();
    const isFirstDay = prevValue === null;

    let portfolioValue = INITIAL_VALUE;
    if (!isFirstDay) {
      // Portfolio return = weighted avg of daily change% across all holdings
      const avgDailyReturn = holdings.reduce((sum, h) => sum + h.changePercent, 0) / holdings.length;
      portfolioValue = prevValue * (1 + avgDailyReturn / 100);
    }

    // 4. Resolve initial benchmark values
    const firstSnap = await getFirstSnapshot();
    const sp500Initial = isFirstDay ? bench.sp500 : (firstSnap?.benchmark_sp500_initial ?? bench.sp500);
    const nasdaqInitial = isFirstDay ? bench.nasdaq : (firstSnap?.benchmark_nasdaq_initial ?? bench.nasdaq);
    const dowInitial = isFirstDay ? bench.dow : (firstSnap?.benchmark_dow_initial ?? bench.dow);

    // 5. Upsert today's snapshot
    const today = new Date().toISOString().split("T")[0];
    const snapshot = {
      snapshot_date: today,
      portfolio_value: Math.round(portfolioValue * 100) / 100,
      initial_value: INITIAL_VALUE,
      holdings,
      benchmark_sp500: bench.sp500,
      benchmark_nasdaq: bench.nasdaq,
      benchmark_dow: bench.dow,
      benchmark_sp500_initial: sp500Initial,
      benchmark_nasdaq_initial: nasdaqInitial,
      benchmark_dow_initial: dowInitial,
    };

    await fetch(`${SB_URL()}/rest/v1/portfolio_snapshots`, {
      method: "POST",
      headers: {
        apikey: SB_KEY(),
        Authorization: `Bearer ${SB_KEY()}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(snapshot),
    });

    return j({
      success: true,
      date: today,
      portfolio_value: snapshot.portfolio_value,
      holdings_count: holdings.length,
      benchmark_sp500: bench.sp500,
      benchmark_nasdaq: bench.nasdaq,
      benchmark_dow: bench.dow,
      buy_signals: holdings.filter((h) => h.action === "buy").length,
      sell_signals: holdings.filter((h) => h.action === "sell").length,
    });
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
});
