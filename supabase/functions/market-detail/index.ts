import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const FMP = "https://financialmodelingprep.com";

// deno-lint-ignore no-explicit-any
const F = (v: any) => Array.isArray(v) ? v[0] ?? null : v;

function gs(g: string): number {
  const l = g.toLowerCase();
  if (l.includes("strong buy")) return 5;
  if (l.includes("buy") || l.includes("outperform") || l.includes("overweight")) return 4;
  if (l.includes("hold") || l.includes("neutral")) return 3;
  if (l.includes("underperform") || l.includes("sell")) return 2;
  return 3;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: H });
  try {
    const ah = req.headers.get('Authorization');
    if (!ah?.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...H, 'Content-Type': 'application/json' } });
    const ur = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, { headers: { Authorization: ah, apikey: Deno.env.get('SUPABASE_ANON_KEY')! } });
    if (!ur.ok) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...H, 'Content-Type': 'application/json' } });
    const u = await ur.json();
    if (!u?.id) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...H, 'Content-Type': 'application/json' } });

    const key = Deno.env.get('FMP_API_KEY')!;
    const S = (new URL(req.url).searchParams.get('symbol') || '').toUpperCase();
    if (!S) return new Response(JSON.stringify({ error: 'Provide ?symbol=' }), { status: 400, headers: { ...H, 'Content-Type': 'application/json' } });

    const ic = S.endsWith("USD") && S.length <= 10;
    const f = (p: string) => fetch(`${FMP}${p}${p.includes('?') ? '&' : '?'}apikey=${key}`).then(r => r.json()).catch(() => []);

    const [rsiData, sma50, sma200, ema20, e12, e26, km, gr, news, grades, pt, cs, searchData] = await Promise.all([
      f(`/stable/technical-indicators/rsi?symbol=${S}&periodLength=14&timeframe=1day`),
      f(`/stable/technical-indicators/sma?symbol=${S}&periodLength=50&timeframe=1day`),
      f(`/stable/technical-indicators/sma?symbol=${S}&periodLength=200&timeframe=1day`),
      f(`/stable/technical-indicators/ema?symbol=${S}&periodLength=20&timeframe=1day`),
      f(`/stable/technical-indicators/ema?symbol=${S}&periodLength=12&timeframe=1day`),
      f(`/stable/technical-indicators/ema?symbol=${S}&periodLength=26&timeframe=1day`),
      ic ? [] : f(`/stable/key-metrics?symbol=${S}&limit=1`),
      ic ? [] : f(`/stable/income-statement-growth?symbol=${S}&limit=1`),
      f(`/stable/news/stock?symbols=${S}&limit=20`),
      ic ? [] : f(`/stable/grades?symbol=${S}&limit=10`),
      ic ? [] : f(`/stable/price-target-consensus?symbol=${S}`),
      ic ? [] : f(`/stable/upgrades-downgrades-consensus?symbol=${S}`),
      f(`/stable/search-symbol?query=${S}&limit=5`),
    ]);

    const rsiArr = Array.isArray(rsiData) ? rsiData : [];
    const latest = rsiArr[0];
    const prev = rsiArr[1];
    if (!latest?.close) return new Response(JSON.stringify({ error: 'No data' }), { status: 400, headers: { ...H, 'Content-Type': 'application/json' } });

    const p = latest.close;
    const previousClose = prev?.close ?? p;
    const change = Math.round((p - previousClose) * 100) / 100;
    const changePercent = previousClose > 0 ? Math.round((change / previousClose) * 10000) / 100 : 0;

    const searchArr = Array.isArray(searchData) ? searchData : [];
    const matchedMeta = searchArr.find((x: Record<string, string>) => x.symbol === S);
    const name = matchedMeta?.name || S;
    const exchange = matchedMeta?.exchangeShortName || '';

    const macd = (F(e12)?.ema != null && F(e26)?.ema != null) ? F(e12).ema - F(e26).ema : null;
    const k = F(km), g = F(gr), ptD = F(pt), csD = F(cs);
    const nl = Array.isArray(news) ? news : [];
    const gl = (Array.isArray(grades) ? grades : []).slice(0, 10);
    const ar = gl.length ? Math.round(gl.reduce((a: number, x: Record<string, string>) => a + gs(x.newGrade || ""), 0) / gl.length * 10) / 10 : 3;

    const ad: Record<string, unknown> = {};
    if (ptD?.targetConsensus) ad.priceTarget = { targetHigh: ptD.targetHigh, targetLow: ptD.targetLow, targetConsensus: ptD.targetConsensus, targetMedian: ptD.targetMedian, totalAnalysts: ptD.totalAnalysts ?? 0 };
    if (csD?.consensus) { ad.consensus = csD.consensus; ad.ratingsDistribution = { strongBuy: csD.strongBuy ?? 0, buy: csD.buy ?? 0, hold: csD.hold ?? 0, sell: csD.sell ?? 0, strongSell: csD.strongSell ?? 0, totalAnalysts: (csD.strongBuy ?? 0) + (csD.buy ?? 0) + (csD.hold ?? 0) + (csD.sell ?? 0) + (csD.strongSell ?? 0) }; }

    const res = {
      symbol: S, name, exchange, price: p, previousClose,
      change, changePercent, volume: latest.volume ?? 0, avgVolume: latest.volume ?? 0,
      technical: { rsi: latest.rsi ?? null, macd, macdSignal: macd != null ? macd * 0.8 : null, sma50: F(sma50)?.sma ?? null, sma200: F(sma200)?.sma ?? null, ema20: F(ema20)?.ema ?? null, bollingerUpper: null, bollingerLower: null, atr: null },
      fundamental: { peRatio: k?.peRatio ?? null, forwardPE: k?.forwardPeRatio ?? null, earningsGrowth: g?.growthNetIncome != null ? g.growthNetIncome * 100 : null, debtToEquity: k?.debtToEquity ?? null, revenueGrowth: g?.growthRevenue != null ? g.growthRevenue * 100 : null, profitMargin: k?.netIncomePerRevenue != null ? k.netIncomePerRevenue * 100 : null, returnOnEquity: k?.roe != null ? k.roe * 100 : null, freeCashFlowYield: k?.freeCashFlowYield != null ? k.freeCashFlowYield * 100 : null },
      sentiment: { newsCount: nl.length, analystRating: ar, insiderActivity: 0, headline: nl[0]?.title || `${name} at $${p.toFixed(2)}`, recentNews: nl.slice(0, 5).map((n: Record<string, string>) => ({ title: n.title, publisher: n.publisher || n.site, date: n.publishedDate })), grades: gl.slice(0, 5).map((x: Record<string, string>) => ({ company: x.gradingCompany, grade: x.newGrade, action: x.action, date: x.date })) },
      analystData: Object.keys(ad).length ? ad : null,
    };
    return new Response(JSON.stringify(res), { headers: { ...H, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...H, 'Content-Type': 'application/json' } });
  }
});
