import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const H = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const AV = "https://www.alphavantage.co/query";
const SB_URL = () => Deno.env.get("SUPABASE_URL")!;
const SB_KEY = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Top tickers per index (superset — we'll score and pick top 10)
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

async function fetchQuote(symbol: string, apiKey: string): Promise<{ symbol: string; price: number; change: number; changePercent: number } | null> {
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

// Simple scoring for portfolio selection (positive change% + momentum)
function quickScore(q: { price: number; change: number; changePercent: number }): number {
  // Simple momentum score: positive change = higher score
  return 50 + q.changePercent * 5;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: H });
  const j = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...H, "Content-Type": "application/json" } });

  try {
    const apiKey = Deno.env.get("ALPHA_VANTAGE_API_KEY")!;
    const allHoldings: { ticker: string; exchange: string; score: number; price: number; weight: number }[] = [];

    // Process each index — pick a sample of 5 tickers to stay within rate limits
    for (const [exchange, tickers] of Object.entries(INDEX_TICKERS)) {
      // Sample 12 random tickers to score (API rate limit friendly)
      const sampled = tickers.sort(() => Math.random() - 0.5).slice(0, 12);
      
      // Fetch in batches of 4 with delays
      const quotes: { symbol: string; price: number; change: number; changePercent: number }[] = [];
      for (let i = 0; i < sampled.length; i += 4) {
        const batch = sampled.slice(i, i + 4);
        const results = await Promise.all(batch.map((s) => fetchQuote(s, apiKey)));
        quotes.push(...results.filter(Boolean) as typeof quotes);
        if (i + 4 < sampled.length) {
          await new Promise((r) => setTimeout(r, 1200)); // rate limit delay
        }
      }

      // Score and pick top 10
      const scored = quotes
        .map((q) => ({ ...q, score: quickScore(q) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      const weight = 1 / 30; // equal weight across 30 stocks
      for (const s of scored) {
        allHoldings.push({
          ticker: s.symbol,
          exchange,
          score: Math.round(s.score),
          price: s.price,
          weight,
        });
      }
    }

    if (allHoldings.length === 0) {
      return j({ error: "No quotes available" }, 500);
    }

    // Calculate portfolio value (equal-weight $100k)
    const initialValue = 100000;
    const perStock = initialValue / allHoldings.length;
    
    // For the first snapshot, portfolio value = initial value
    // For subsequent snapshots, we'd track shares bought at initial prices
    // For now, portfolio tracks daily performance attribution
    const portfolioValue = allHoldings.reduce((sum, h) => {
      // Each stock contributes its daily change% to the portfolio
      return sum;
    }, 0);

    // Simple approach: portfolio value = initial * (1 + avg daily return of holdings)
    // We need the previous snapshot to calculate properly
    const prevSnapshotRes = await fetch(
      `${SB_URL()}/rest/v1/portfolio_snapshots?select=portfolio_value,snapshot_date&order=snapshot_date.desc&limit=1`,
      { headers: { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}` } }
    );
    const prevRows = await prevSnapshotRes.json();
    const prevValue = Array.isArray(prevRows) && prevRows.length > 0 
      ? parseFloat(prevRows[0].portfolio_value) 
      : initialValue;

    // Calculate avg daily change across holdings
    const avgChange = allHoldings.reduce((sum, h) => {
      const holdingQuote = allHoldings.find((q) => q.ticker === h.ticker);
      // Use the changePercent from the quote data
      return sum;
    }, 0);

    // Fetch benchmark prices (SPY for S&P 500, QQQ for Nasdaq)
    await new Promise((r) => setTimeout(r, 1200));
    const [spyQuote, qqqQuote] = await Promise.all([
      fetchQuote("SPY", apiKey),
      fetchQuote("QQQ", apiKey),
    ]);

    // Get initial benchmark values from first snapshot
    const firstSnapshotRes = await fetch(
      `${SB_URL()}/rest/v1/portfolio_snapshots?select=benchmark_sp500_initial,benchmark_nasdaq_initial&order=snapshot_date.asc&limit=1`,
      { headers: { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}` } }
    );
    const firstRows = await firstSnapshotRes.json();
    const isFirstSnapshot = !Array.isArray(firstRows) || firstRows.length === 0;

    const sp500Price = spyQuote ? spyQuote.price * 10 : null; // SPY ~= S&P 500 / 10
    const nasdaqPrice = qqqQuote ? qqqQuote.price * 40 : null; // QQQ ~= Nasdaq / 40

    // For first snapshot, set initial benchmarks
    const sp500Initial = isFirstSnapshot ? sp500Price : (firstRows[0]?.benchmark_sp500_initial ?? sp500Price);
    const nasdaqInitial = isFirstSnapshot ? nasdaqPrice : (firstRows[0]?.benchmark_nasdaq_initial ?? nasdaqPrice);

    // Portfolio value: first day = initial, subsequent = previous * (1 + weighted avg daily return)
    let newPortfolioValue = initialValue;
    if (!isFirstSnapshot) {
      // Calculate weighted return from today's holdings
      // Use each holding's daily changePercent
      const fetchedQuotes = allHoldings.map((h) => h);
      // We need the actual changePercent — let's re-fetch or use stored data
      // For simplicity, use the average changePercent from all holdings
      // The holdings already have price but not changePercent directly
      // Let's recalculate from the original quote data
      
      // Since we already have the scores which incorporate changePercent,
      // let's approximate: score = 50 + changePercent * 5, so changePercent = (score - 50) / 5
      const avgDailyReturn = allHoldings.reduce((sum, h) => {
        const estimatedChangePct = (h.score - 50) / 5;
        return sum + estimatedChangePct / allHoldings.length;
      }, 0);
      
      newPortfolioValue = prevValue * (1 + avgDailyReturn / 100);
    }

    // Upsert today's snapshot
    const today = new Date().toISOString().split("T")[0];
    const snapshot = {
      snapshot_date: today,
      portfolio_value: Math.round(newPortfolioValue * 100) / 100,
      initial_value: initialValue,
      holdings: allHoldings,
      benchmark_sp500: sp500Price,
      benchmark_nasdaq: nasdaqPrice,
      benchmark_sp500_initial: sp500Initial,
      benchmark_nasdaq_initial: nasdaqInitial,
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
      holdings_count: allHoldings.length,
      benchmark_sp500: sp500Price,
      benchmark_nasdaq: nasdaqPrice,
    });
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
});
