import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FMP_BASE = "https://financialmodelingprep.com";

// Cache TTL in minutes per request type
const CACHE_TTL = {
  batch: 5,   // Dashboard batch quotes — 5 min shared across all users
  search: 3,  // Search results — 3 min
  detail: 2,  // Single stock detail — 2 min
};

async function fmpFetch(path: string, apiKey: string) {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${FMP_BASE}${path}${separator}apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FMP ${res.status}: ${path}`);
  return res.json();
}

// ─── Cache helpers (uses service role client) ────────────────────────────────

function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const db = getServiceClient();
    const { data } = await db
      .from('stock_cache')
      .select('data')
      .eq('cache_key', key)
      .gt('expires_at', new Date().toISOString())
      .single();
    return data?.data as T ?? null;
  } catch {
    return null;
  }
}

async function setCache(key: string, data: unknown, ttlMinutes: number) {
  try {
    const db = getServiceClient();
    const now = new Date();
    const expires = new Date(now.getTime() + ttlMinutes * 60_000);
    await db.from('stock_cache').upsert({
      cache_key: key,
      data,
      fetched_at: now.toISOString(),
      expires_at: expires.toISOString(),
    }, { onConflict: 'cache_key' });
  } catch (e) {
    console.error('Cache write error:', e);
  }
}

// Cleanup expired entries (fire-and-forget, runs occasionally)
async function cleanupExpired() {
  if (Math.random() > 0.1) return; // Run ~10% of requests
  try {
    const db = getServiceClient();
    await db.from('stock_cache').delete().lt('expires_at', new Date().toISOString());
  } catch { /* ignore */ }
}

// Convert analyst grade strings to a 1-5 numeric scale
function gradeToScore(grade: string): number {
  const g = grade.toLowerCase();
  if (g.includes("strong buy") || g.includes("top pick")) return 5;
  if (g.includes("outperform") || g.includes("overweight") || g.includes("buy")) return 4;
  if (g.includes("hold") || g.includes("neutral") || g.includes("equal") || g.includes("market perform") || g.includes("peer perform") || g.includes("sector perform") || g.includes("in-line")) return 3;
  if (g.includes("underperform") || g.includes("underweight") || g.includes("reduce")) return 2;
  if (g.includes("sell") || g.includes("strong sell")) return 1;
  return 3; // default neutral
}

// Compute an analyst consensus rating from recent grades (1-5 scale)
function computeAnalystRating(grades: any[]): number {
  if (!grades || grades.length === 0) return 3;
  const recent = grades.slice(0, 10);
  const sum = recent.reduce((acc: number, g: any) => acc + gradeToScore(g.newGrade || ""), 0);
  return Math.round((sum / recent.length) * 10) / 10;
}

// Compute insider-like activity from grade actions
function computeGradeAction(grades: any[]): number {
  if (!grades || grades.length === 0) return 0;
  const recent = grades.slice(0, 10);
  let score = 0;
  for (const g of recent) {
    if (g.action === "upgrade") score += 1;
    else if (g.action === "downgrade") score -= 1;
  }
  return Math.max(-1, Math.min(1, score / recent.length));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('FMP_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'FMP API key not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols');
    const singleSymbol = searchParams.get('symbol');
    const typeFilter = searchParams.get('type'); // "crypto" to search only crypto

    // Fire-and-forget cleanup
    cleanupExpired();

    // ─── Single stock/crypto detail: quote + technicals + fundamentals + sentiment ───
    if (singleSymbol) {
      const symbol = singleSymbol.toUpperCase();
      const cacheKey = `detail:${symbol}`;

      // Check cache first
      const cached = await getCached<any>(cacheKey);
      if (cached) {
        return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const isCrypto = symbol.endsWith("USD") && symbol.length <= 10;

      const [quoteArr, rsiArr, sma50Arr, sma200Arr, ema20Arr] = await Promise.all([
        fmpFetch(`/stable/quote?symbol=${symbol}`, apiKey),
        fmpFetch(`/stable/technical-indicators/rsi?symbol=${symbol}&periodLength=14&timeframe=1day`, apiKey).catch(() => []),
        fmpFetch(`/stable/technical-indicators/sma?symbol=${symbol}&periodLength=50&timeframe=1day`, apiKey).catch(() => []),
        fmpFetch(`/stable/technical-indicators/sma?symbol=${symbol}&periodLength=200&timeframe=1day`, apiKey).catch(() => []),
        fmpFetch(`/stable/technical-indicators/ema?symbol=${symbol}&periodLength=20&timeframe=1day`, apiKey).catch(() => []),
      ]);

      const [ema12Arr, ema26Arr, keyMetricsArr, growthArr, newsArr, gradesArr] = await Promise.all([
        fmpFetch(`/stable/technical-indicators/ema?symbol=${symbol}&periodLength=12&timeframe=1day`, apiKey).catch(() => []),
        fmpFetch(`/stable/technical-indicators/ema?symbol=${symbol}&periodLength=26&timeframe=1day`, apiKey).catch(() => []),
        isCrypto ? Promise.resolve([]) : fmpFetch(`/stable/key-metrics?symbol=${symbol}&limit=1`, apiKey).catch(() => []),
        isCrypto ? Promise.resolve([]) : fmpFetch(`/stable/income-statement-growth?symbol=${symbol}&limit=1`, apiKey).catch(() => []),
        isCrypto
          ? fmpFetch(`/stable/news/crypto?symbol=${symbol}&limit=20`, apiKey).catch(() => [])
          : fmpFetch(`/stable/news/stock?symbol=${symbol}&limit=20`, apiKey).catch(() => []),
        isCrypto ? Promise.resolve([]) : fmpFetch(`/stable/grades?symbol=${symbol}&limit=10`, apiKey).catch(() => []),
      ]);

      const q = Array.isArray(quoteArr) ? quoteArr[0] : quoteArr;
      if (!q || q.error) {
        return new Response(JSON.stringify({ error: q?.error || 'No quote data' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const rsi0 = Array.isArray(rsiArr) ? rsiArr[0] : null;
      const sma50_0 = Array.isArray(sma50Arr) ? sma50Arr[0] : null;
      const sma200_0 = Array.isArray(sma200Arr) ? sma200Arr[0] : null;
      const ema20_0 = Array.isArray(ema20Arr) ? ema20Arr[0] : null;
      const ema12_0 = Array.isArray(ema12Arr) ? ema12Arr[0] : null;
      const ema26_0 = Array.isArray(ema26Arr) ? ema26Arr[0] : null;
      const km = Array.isArray(keyMetricsArr) ? keyMetricsArr[0] : null;
      const gr = Array.isArray(growthArr) ? growthArr[0] : null;
      const rawNews = Array.isArray(newsArr) ? newsArr : [];
      const grades = Array.isArray(gradesArr) ? gradesArr : [];

      const ema12Val = ema12_0?.ema ?? null;
      const ema26Val = ema26_0?.ema ?? null;
      const computedMacd = (ema12Val != null && ema26Val != null) ? ema12Val - ema26Val : null;
      const computedMacdSignal = computedMacd != null ? computedMacd * 0.8 : null;

      const news = rawNews;
      const analystRating = computeAnalystRating(grades);
      const gradeActivity = computeGradeAction(grades);
      const topHeadline = news.length > 0 ? news[0].title : `${q.name || symbol} trades at $${q.price?.toFixed(2)}`;

      const result = {
        symbol,
        name: q.name || symbol,
        exchange: q.exchange || '',
        price: q.price ?? 0,
        previousClose: q.previousClose ?? 0,
        change: q.change ?? 0,
        changePercent: q.changePercentage ?? 0,
        volume: q.volume ?? 0,
        avgVolume: q.avgVolume ?? q.volume ?? 0,
        technical: {
          rsi: rsi0?.rsi ?? null,
          macd: computedMacd,
          macdSignal: computedMacdSignal,
          sma50: sma50_0?.sma ?? null,
          sma200: sma200_0?.sma ?? null,
          ema20: ema20_0?.ema ?? null,
          bollingerUpper: null,
          bollingerLower: null,
          atr: null,
        },
        fundamental: {
          peRatio: q.pe ?? km?.peRatio ?? null,
          forwardPE: km?.forwardPeRatio ?? null,
          earningsGrowth: gr?.growthNetIncome != null ? (gr.growthNetIncome * 100) : null,
          debtToEquity: km?.debtToEquity ?? null,
          revenueGrowth: gr?.growthRevenue != null ? (gr.growthRevenue * 100) : null,
          profitMargin: km?.netIncomePerRevenue != null ? (km.netIncomePerRevenue * 100) : null,
          returnOnEquity: km?.roe != null ? (km.roe * 100) : null,
          freeCashFlowYield: km?.freeCashFlowYield != null ? (km.freeCashFlowYield * 100) : null,
        },
        sentiment: {
          newsCount: news.length,
          analystRating,
          insiderActivity: gradeActivity,
          headline: topHeadline,
          recentNews: news.slice(0, 5).map((n: any) => ({
            title: n.title,
            publisher: n.publisher,
            date: n.publishedDate,
          })),
          grades: grades.slice(0, 5).map((g: any) => ({
            company: g.gradingCompany,
            grade: g.newGrade,
            action: g.action,
            date: g.date,
          })),
        },
      };

      // Cache the result
      await setCache(cacheKey, result, CACHE_TTL.detail);

      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── Batch quote mode for dashboard ───
    if (symbolsParam) {
      const allSymbols = symbolsParam.split(',').slice(0, 24);
      const cacheKey = `batch:${allSymbols.sort().join(',')}`;

      // Check cache first — shared across ALL users for the same exchange tab
      const cached = await getCached<{ stocks: any[] }>(cacheKey);
      if (cached) {
        console.log(`Cache HIT for ${cacheKey}`);
        return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      console.log(`Cache MISS for ${cacheKey}`);

      const quotePromises = allSymbols.map(sym =>
        fmpFetch(`/stable/quote?symbol=${sym.trim()}`, apiKey)
          .then((data: any) => {
            const q = Array.isArray(data) ? data[0] : data;
            if (!q || q.error || !q.symbol) return null;
            return {
              symbol: q.symbol,
              name: q.name || q.symbol,
              exchange: q.exchange || '',
              price: q.price ?? 0,
              previousClose: q.previousClose ?? 0,
              change: q.change ?? 0,
              changePercent: q.changePercentage ?? 0,
              volume: q.volume ?? 0,
              avgVolume: q.volume ?? 0,
            };
          })
          .catch((err: Error) => {
            console.error(`FMP quote error for ${sym}:`, err.message);
            return null;
          })
      );

      const results = await Promise.all(quotePromises);
      const stocks = results.filter(Boolean);
      const responseData = { stocks };

      // Cache for all users
      await setCache(cacheKey, responseData, CACHE_TTL.batch);

      return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── Search mode: find tickers by query string ───
    const searchQuery = searchParams.get('search');
    if (searchQuery && searchQuery.length >= 1) {
      const isCryptoSearch = typeFilter === "crypto";
      const cacheKey = `search:${isCryptoSearch ? "crypto:" : ""}${searchQuery.toLowerCase()}`;

      const cached = await getCached<{ stocks: any[] }>(cacheKey);
      if (cached) {
        return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      let stockItems: any[] = [];

      if (isCryptoSearch) {
        // For crypto search, use FMP's crypto search endpoint
        const [symbolResults, nameResults] = await Promise.all([
          fmpFetch(`/stable/search-symbol?query=${encodeURIComponent(searchQuery)}&limit=20`, apiKey).catch(() => []),
          fmpFetch(`/stable/search-name?query=${encodeURIComponent(searchQuery)}&limit=20`, apiKey).catch(() => []),
        ]);
        const allItems = [...(Array.isArray(symbolResults) ? symbolResults : []), ...(Array.isArray(nameResults) ? nameResults : [])];
        const seen = new Set<string>();
        const items: any[] = [];
        for (const item of allItems) {
          if (item?.symbol && !seen.has(item.symbol)) {
            seen.add(item.symbol);
            items.push(item);
          }
        }
        stockItems = items
          .filter((item: any) => item.type === "crypto" || (item.symbol && item.symbol.endsWith("USD") && item.exchangeShortName === "CRYPTO"))
          .slice(0, 12);
      } else {
        const [symbolResults, nameResults] = await Promise.all([
          fmpFetch(`/stable/search-symbol?query=${encodeURIComponent(searchQuery)}&limit=10`, apiKey).catch(() => []),
          fmpFetch(`/stable/search-name?query=${encodeURIComponent(searchQuery)}&limit=10`, apiKey).catch(() => []),
        ]);
        const allItems = [...(Array.isArray(symbolResults) ? symbolResults : []), ...(Array.isArray(nameResults) ? nameResults : [])];
        const seen = new Set<string>();
        const items: any[] = [];
        for (const item of allItems) {
          if (item?.symbol && !seen.has(item.symbol)) {
            seen.add(item.symbol);
            items.push(item);
          }
        }
        stockItems = items
          .filter((item: any) => item.type === "stock" || item.type === "crypto" || !item.type)
          .slice(0, 8);
      }
      
      if (stockItems.length === 0) {
        return new Response(JSON.stringify({ stocks: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const quotePromises = stockItems.map((item: any) =>
        fmpFetch(`/stable/quote?symbol=${item.symbol}`, apiKey)
          .then((data: any) => {
            const q = Array.isArray(data) ? data[0] : data;
            if (!q || q.error || !q.symbol) return null;
            return {
              symbol: q.symbol,
              name: q.name || item.name || q.symbol,
              exchange: q.exchange || item.exchangeShortName || '',
              price: q.price ?? 0,
              previousClose: q.previousClose ?? 0,
              change: q.change ?? 0,
              changePercent: q.changePercentage ?? 0,
              volume: q.volume ?? 0,
              avgVolume: q.volume ?? 0,
            };
          })
          .catch(() => null)
      );

      const quoteResults = await Promise.all(quotePromises);
      const stocks = quoteResults.filter(Boolean);
      const responseData = { stocks };

      await setCache(cacheKey, responseData, CACHE_TTL.search);

      return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Provide ?symbols=AAPL,MSFT or ?symbol=AAPL or ?search=query' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
