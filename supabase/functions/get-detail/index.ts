import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const AV = "https://www.alphavantage.co/query";

// ─── Cache helpers (stock_cache table via REST) ──────────────────────────────
const SB_URL = () => Deno.env.get('SUPABASE_URL')!;
const SB_KEY = () => Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function cacheGet(key: string): Promise<unknown | null> {
  try {
    const r = await fetch(
      `${SB_URL()}/rest/v1/stock_cache?cache_key=eq.${encodeURIComponent(key)}&select=data,expires_at&limit=1`,
      { headers: { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}` } }
    );
    const rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    if (new Date(rows[0].expires_at) < new Date()) return null;
    return rows[0].data;
  } catch { return null; }
}

async function cacheSet(key: string, data: unknown, ttlSeconds: number) {
  try {
    const expires_at = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    await fetch(`${SB_URL()}/rest/v1/stock_cache`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}`,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ cache_key: key, data, expires_at, fetched_at: new Date().toISOString() }),
    });
  } catch { /* silent */ }
}

// ─── Retry wrapper for AV calls ──────────────────────────────────────────────
async function avWithRetry(params: string, apiKey: string, retries = 2): Promise<Record<string, unknown>> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${AV}?${params}&apikey=${apiKey}`);
      const data = await res.json();
      // Alpha Vantage returns a "Note" or "Information" key when rate-limited
      if (data?.Note || data?.Information) {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1500 * (attempt + 1))); // backoff: 1.5s, 3s
          continue;
        }
      }
      return data;
    } catch {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
    }
  }
  return {};
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: H });
  const j = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...H, 'Content-Type': 'application/json' } });
  try {
    const ah = req.headers.get('Authorization');
    if (!ah?.startsWith('Bearer ')) return j({ error: 'Unauthorized' }, 401);
    const ur = await fetch(`${SB_URL()}/auth/v1/user`, { headers: { Authorization: ah, apikey: Deno.env.get('SUPABASE_ANON_KEY')! } });
    if (!ur.ok) return j({ error: 'Unauthorized' }, 401);
    const u = await ur.json();
    if (!u?.id) return j({ error: 'Unauthorized' }, 401);

    const key = Deno.env.get('ALPHA_VANTAGE_API_KEY')!;
    const S = (new URL(req.url).searchParams.get('symbol') || '').toUpperCase();
    if (!S) return j({ error: 'Provide ?symbol=' }, 400);

    // Check cache first (2-min TTL for detail)
    const cacheKey = `detail:${S}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return j(cached);

    const ic = S.endsWith("USD") && S.length <= 10;
    const av = (params: string) => avWithRetry(params, key);

    if (ic) {
      const fromCurrency = S.replace("USD", "");
      const [exchangeRate, rsiData, smaData50, emaData20, newsData] = await Promise.all([
        av(`function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=USD`),
        av(`function=RSI&symbol=${S}&interval=daily&time_period=14&series_type=close`),
        av(`function=SMA&symbol=${S}&interval=daily&time_period=50&series_type=close`),
        av(`function=EMA&symbol=${S}&interval=daily&time_period=20&series_type=close`),
        av(`function=NEWS_SENTIMENT&tickers=CRYPTO:${fromCurrency}&limit=10`),
      ]);

      const rate = exchangeRate?.["Realtime Currency Exchange Rate"] as Record<string, string> | undefined;
      const price = rate ? parseFloat(rate["5. Exchange Rate"] || "0") : 0;
      if (!price) return j({ error: 'No data for crypto symbol' }, 400);
      const name = rate?.["2. From_Currency Name"] || S;

      const rsiSeries = rsiData?.["Technical Analysis: RSI"] as Record<string, Record<string, string>> | undefined;
      const rsiVal = rsiSeries ? parseFloat(Object.values(rsiSeries)[0]?.["RSI"] || "50") : null;
      const smaSeries = smaData50?.["Technical Analysis: SMA"] as Record<string, Record<string, string>> | undefined;
      const sma50Val = smaSeries ? parseFloat(Object.values(smaSeries)[0]?.["SMA"] || "0") : null;
      const emaSeries = emaData20?.["Technical Analysis: EMA"] as Record<string, Record<string, string>> | undefined;
      const ema20Val = emaSeries ? parseFloat(Object.values(emaSeries)[0]?.["EMA"] || "0") : null;

      const feed = Array.isArray((newsData as Record<string, unknown>)?.feed) ? (newsData as Record<string, unknown>).feed as Record<string, string>[] : [];
      const recentNews = feed.slice(0, 5).map((n) => ({
        title: n.title || "", publisher: n.source || "", date: n.time_published || "",
      }));

      const result = {
        symbol: S, name, exchange: "CRYPTO", price, previousClose: price,
        change: 0, changePercent: 0, volume: 0, avgVolume: 0,
        technical: { rsi: rsiVal, macd: null, macdSignal: null, sma50: sma50Val, sma200: null, ema20: ema20Val, bollingerUpper: null, bollingerLower: null, atr: null },
        fundamental: { peRatio: null, forwardPE: null, earningsGrowth: null, debtToEquity: null, revenueGrowth: null, profitMargin: null, returnOnEquity: null, freeCashFlowYield: null },
        sentiment: { newsCount: feed.length, analystRating: 3, insiderActivity: 0, headline: feed[0]?.title || `${name} at $${price.toFixed(2)}`, recentNews, grades: [] },
        analystData: null,
      };
      cacheSet(cacheKey, result, 120);
      return j(result);
    }

    // ─── Stock detail — BATCHED to avoid rate limits ─────────────────
    // Batch 1: Core data (quote, overview, news + 2 key technicals)
    const [quoteData, overviewData, rsiData, sma50Data, newsData] = await Promise.all([
      av(`function=GLOBAL_QUOTE&symbol=${S}`),
      av(`function=OVERVIEW&symbol=${S}`),
      av(`function=RSI&symbol=${S}&interval=daily&time_period=14&series_type=close`),
      av(`function=SMA&symbol=${S}&interval=daily&time_period=50&series_type=close`),
      av(`function=NEWS_SENTIMENT&tickers=${S}&limit=20`),
    ]);

    const gq = quoteData?.["Global Quote"] as Record<string, string> | undefined;
    if (!gq || !gq["05. price"]) return j({ error: 'No data' }, 400);

    // Small delay between batches to avoid rate limiting
    await new Promise(r => setTimeout(r, 800));

    // Batch 2: Remaining technicals
    const [sma200Data, ema20Data, macdData, bbandsData, atrData] = await Promise.all([
      av(`function=SMA&symbol=${S}&interval=daily&time_period=200&series_type=close`),
      av(`function=EMA&symbol=${S}&interval=daily&time_period=20&series_type=close`),
      av(`function=MACD&symbol=${S}&interval=daily&series_type=close`),
      av(`function=BBANDS&symbol=${S}&interval=daily&time_period=20&series_type=close`),
      av(`function=ATR&symbol=${S}&interval=daily&time_period=14`),
    ]);

    const price = parseFloat(gq["05. price"]);
    const previousClose = parseFloat(gq["08. previous close"] || "0");
    const change = Math.round((price - previousClose) * 100) / 100;
    const changePercent = previousClose > 0 ? Math.round((change / previousClose) * 10000) / 100 : 0;
    const volume = parseInt(gq["06. volume"] || "0", 10);

    const ov = (overviewData || {}) as Record<string, string>;
    const name = ov["Name"] || S;
    const exchange = ov["Exchange"] || "";

    const getLatest = (data: Record<string, unknown>, k: string): number | null => {
      const analysisKey = Object.keys(data).find(x => x.startsWith("Technical Analysis"));
      if (!analysisKey) return null;
      const series = data[analysisKey] as Record<string, Record<string, string>>;
      const firstDate = Object.keys(series)[0];
      if (!firstDate) return null;
      const val = series[firstDate][k];
      return val ? parseFloat(val) : null;
    };

    const rsi = getLatest(rsiData, "RSI");
    const sma50 = getLatest(sma50Data, "SMA");
    const sma200 = getLatest(sma200Data, "SMA");
    const ema20 = getLatest(ema20Data, "EMA");
    const macd = getLatest(macdData, "MACD");
    const macdSignal = getLatest(macdData, "MACD_Signal");
    const bbUpper = getLatest(bbandsData, "Real Upper Band");
    const bbLower = getLatest(bbandsData, "Real Lower Band");
    const atr = getLatest(atrData, "ATR");

    const pf = (field: string): number | null => {
      const v = ov[field];
      if (v === undefined || v === null || v === "None" || v === "-") return null;
      const n = parseFloat(v);
      return isNaN(n) ? null : n;
    };

    const peRatio = pf("TrailingPE");
    const forwardPE = pf("ForwardPE");
    const profitMargin = pf("ProfitMargin") != null ? pf("ProfitMargin")! * 100 : null;
    const returnOnEquity = pf("ReturnOnEquityTTM") != null ? pf("ReturnOnEquityTTM")! * 100 : null;
    const earningsGrowth = pf("QuarterlyEarningsGrowthYOY") != null ? pf("QuarterlyEarningsGrowthYOY")! * 100 : null;
    const revenueGrowth = pf("QuarterlyRevenueGrowthYOY") != null ? pf("QuarterlyRevenueGrowthYOY")! * 100 : null;
    const debtToEquity = pf("DebtToEquity") != null ? pf("DebtToEquity")! / 100 : null;

    const feed = Array.isArray((newsData as Record<string, unknown>)?.feed) ? (newsData as Record<string, unknown>).feed as Record<string, unknown>[] : [];
    const recentNews = feed.slice(0, 5).map((n) => ({
      title: (n.title as string) || "", publisher: (n.source as string) || "", date: (n.time_published as string) || "",
    }));

    let analystRating = 3;
    const tickerSentiments = feed
      .map((n) => {
        const ts = Array.isArray(n.ticker_sentiment) ? n.ticker_sentiment : [];
        const match = (ts as Record<string, string>[]).find((t) => t.ticker === S);
        return match ? parseFloat(match.ticker_sentiment_score || "0") : null;
      })
      .filter((v): v is number => v !== null);
    if (tickerSentiments.length > 0) {
      const avgSentiment = tickerSentiments.reduce((a, b) => a + b, 0) / tickerSentiments.length;
      analystRating = Math.round((avgSentiment + 1) * 2.5 * 10) / 10;
      analystRating = Math.max(1, Math.min(5, analystRating));
    }

    const ad: Record<string, unknown> = {};
    const strongBuy = pf("AnalystRatingStrongBuy") ?? 0;
    const buy = pf("AnalystRatingBuy") ?? 0;
    const hold = pf("AnalystRatingHold") ?? 0;
    const sell = pf("AnalystRatingSell") ?? 0;
    const strongSell = pf("AnalystRatingStrongSell") ?? 0;
    const totalAnalysts = strongBuy + buy + hold + sell + strongSell;

    const targetPrice = pf("AnalystTargetPrice");
    if (targetPrice) {
      const numOpinions = pf("NumberOfAnalystOpinions") || totalAnalysts || 0;
      ad.priceTarget = { targetHigh: targetPrice, targetLow: targetPrice * 0.85, targetConsensus: targetPrice, targetMedian: targetPrice, totalAnalysts: numOpinions };
    }
    if (totalAnalysts > 0) {
      const weighted = (strongBuy * 5 + buy * 4 + hold * 3 + sell * 2 + strongSell * 1) / totalAnalysts;
      let consensus = "Hold";
      if (weighted >= 4.3) consensus = "Strong Buy";
      else if (weighted >= 3.5) consensus = "Buy";
      else if (weighted >= 2.5) consensus = "Hold";
      else if (weighted >= 1.5) consensus = "Sell";
      else consensus = "Strong Sell";
      ad.consensus = consensus;
      ad.ratingsDistribution = { strongBuy, buy, hold, sell, strongSell, totalAnalysts };
    }

    const result = {
      symbol: S, name, exchange, price, previousClose,
      change, changePercent, volume, avgVolume: volume,
      technical: { rsi, macd, macdSignal, sma50, sma200, ema20, bollingerUpper: bbUpper, bollingerLower: bbLower, atr },
      fundamental: { peRatio, forwardPE, earningsGrowth, debtToEquity, revenueGrowth, profitMargin, returnOnEquity, freeCashFlowYield: null },
      sentiment: { newsCount: feed.length, analystRating, insiderActivity: 0, headline: (feed[0] as Record<string, string>)?.title || `${name} at $${price.toFixed(2)}`, recentNews, grades: [] },
      analystData: Object.keys(ad).length ? ad : null,
    };
    cacheSet(cacheKey, result, 120);
    return j(result);
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
});
