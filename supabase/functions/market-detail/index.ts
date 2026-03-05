import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// market-detail is now a mirror of get-detail using Alpha Vantage
const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const AV = "https://www.alphavantage.co/query";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: H });
  const j = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...H, 'Content-Type': 'application/json' } });
  try {
    const ah = req.headers.get('Authorization');
    if (!ah?.startsWith('Bearer ')) return j({ error: 'Unauthorized' }, 401);
    const ur = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, { headers: { Authorization: ah, apikey: Deno.env.get('SUPABASE_ANON_KEY')! } });
    if (!ur.ok) return j({ error: 'Unauthorized' }, 401);
    const u = await ur.json();
    if (!u?.id) return j({ error: 'Unauthorized' }, 401);

    const key = Deno.env.get('ALPHA_VANTAGE_API_KEY')!;
    const S = (new URL(req.url).searchParams.get('symbol') || '').toUpperCase();
    if (!S) return j({ error: 'Provide ?symbol=' }, 400);

    const av = (params: string) => fetch(`${AV}?${params}&apikey=${key}`).then(r => r.json()).catch(() => ({}));
    const ic = S.endsWith("USD") && S.length <= 10;

    if (ic) {
      const fromCurrency = S.replace("USD", "");
      const [exchangeRate, newsData] = await Promise.all([
        av(`function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=USD`),
        av(`function=NEWS_SENTIMENT&tickers=CRYPTO:${fromCurrency}&limit=10`),
      ]);
      const rate = exchangeRate?.["Realtime Currency Exchange Rate"];
      const price = rate ? parseFloat(rate["5. Exchange Rate"] || "0") : 0;
      if (!price) return j({ error: 'No data' }, 400);
      const name = rate?.["2. From_Currency Name"] || S;
      const feed = Array.isArray(newsData?.feed) ? newsData.feed : [];
      return j({
        symbol: S, name, exchange: "CRYPTO", price, previousClose: price,
        change: 0, changePercent: 0, volume: 0, avgVolume: 0,
        technical: { rsi: null, macd: null, macdSignal: null, sma50: null, sma200: null, ema20: null, bollingerUpper: null, bollingerLower: null, atr: null },
        fundamental: { peRatio: null, forwardPE: null, earningsGrowth: null, debtToEquity: null, revenueGrowth: null, profitMargin: null, returnOnEquity: null, freeCashFlowYield: null },
        sentiment: { newsCount: feed.length, analystRating: 3, insiderActivity: 0, headline: feed[0]?.title || `${name} at $${price.toFixed(2)}`, recentNews: feed.slice(0, 5).map((n: Record<string, string>) => ({ title: n.title || "", publisher: n.source || "", date: n.time_published || "" })), grades: [] },
        analystData: null,
      });
    }

    // Stock detail
    const [quoteData, overviewData, newsData] = await Promise.all([
      av(`function=GLOBAL_QUOTE&symbol=${S}`),
      av(`function=OVERVIEW&symbol=${S}`),
      av(`function=NEWS_SENTIMENT&tickers=${S}&limit=20`),
    ]);

    const gq = quoteData?.["Global Quote"];
    if (!gq || !gq["05. price"]) return j({ error: 'No data' }, 400);

    const price = parseFloat(gq["05. price"]);
    const previousClose = parseFloat(gq["08. previous close"] || "0");
    const change = Math.round((price - previousClose) * 100) / 100;
    const changePercent = previousClose > 0 ? Math.round((change / previousClose) * 10000) / 100 : 0;
    const volume = parseInt(gq["06. volume"] || "0", 10);
    const ov = overviewData || {};
    const name = ov["Name"] || S;
    const exchange = ov["Exchange"] || "";

    const pf = (field: string): number | null => {
      const v = ov[field];
      if (v === undefined || v === null || v === "None" || v === "-") return null;
      const n = parseFloat(v as string);
      return isNaN(n) ? null : n;
    };

    const feed = Array.isArray(newsData?.feed) ? newsData.feed : [];
    const recentNews = feed.slice(0, 5).map((n: Record<string, string>) => ({
      title: n.title || "", publisher: n.source || "", date: n.time_published || "",
    }));

    // Analyst data from OVERVIEW
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

    return j({
      symbol: S, name, exchange, price, previousClose,
      change, changePercent, volume, avgVolume: volume,
      technical: { rsi: null, macd: null, macdSignal: null, sma50: null, sma200: null, ema20: null, bollingerUpper: null, bollingerLower: null, atr: null },
      fundamental: { peRatio: pf("TrailingPE"), forwardPE: pf("ForwardPE"), earningsGrowth: pf("QuarterlyEarningsGrowthYOY") != null ? pf("QuarterlyEarningsGrowthYOY")! * 100 : null, debtToEquity: pf("DebtToEquity") != null ? pf("DebtToEquity")! / 100 : null, revenueGrowth: pf("QuarterlyRevenueGrowthYOY") != null ? pf("QuarterlyRevenueGrowthYOY")! * 100 : null, profitMargin: pf("ProfitMargin") != null ? pf("ProfitMargin")! * 100 : null, returnOnEquity: pf("ReturnOnEquityTTM") != null ? pf("ReturnOnEquityTTM")! * 100 : null, freeCashFlowYield: null },
      sentiment: { newsCount: feed.length, analystRating: 3, insiderActivity: 0, headline: feed[0]?.title || `${name} at $${price.toFixed(2)}`, recentNews, grades: [] },
      analystData: Object.keys(ad).length ? ad : null,
    });
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
});
