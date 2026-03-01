import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const key = Deno.env.get('FMP_API_KEY')!;
    const S = (new URL(req.url).searchParams.get('symbol') || '').toUpperCase();
    if (!S) return j({ error: 'Provide ?symbol=' }, 400);

    const FMP = "https://financialmodelingprep.com";
    const ic = S.endsWith("USD") && S.length <= 10;
    const f = (p: string) => fetch(`${FMP}${p}${p.includes('?') ? '&' : '?'}apikey=${key}`).then(r => r.json()).catch(() => []);
    const F = (v: unknown) => Array.isArray(v) ? v[0] ?? null : v;

    const [qd, rsi, sma50, sma200, ema20, e12, e26, km, gr, news, grades, pt, cs] = await Promise.all([
      f(`/stable/quote?symbol=${S}`),
      f(`/stable/technical-indicators/rsi?symbol=${S}&period=14`),
      f(`/stable/technical-indicators/sma?symbol=${S}&period=50`),
      f(`/stable/technical-indicators/sma?symbol=${S}&period=200`),
      f(`/stable/technical-indicators/ema?symbol=${S}&period=20`),
      f(`/stable/technical-indicators/ema?symbol=${S}&period=12`),
      f(`/stable/technical-indicators/ema?symbol=${S}&period=26`),
      ic ? [] : f(`/stable/key-metrics?symbol=${S}&limit=1`),
      ic ? [] : f(`/stable/income-statement-growth?symbol=${S}&limit=1`),
      f(`/stable/news/stock?symbols=${S}&limit=20`),
      ic ? [] : f(`/stable/grades?symbol=${S}&limit=10`),
      ic ? [] : f(`/stable/price-target-consensus?symbol=${S}`),
      ic ? [] : f(`/stable/upgrades-downgrades-consensus?symbol=${S}`),
    ]);

    const q = F(qd);
    if (!q?.symbol) return j({ error: 'No data' }, 400);

    const macd = (F(e12)?.ema != null && F(e26)?.ema != null) ? F(e12).ema - F(e26).ema : null;
    const k = F(km), g = F(gr), ptD = F(pt), csD = F(cs);
    const nl = Array.isArray(news) ? news : [];
    const gl = (Array.isArray(grades) ? grades : []).slice(0, 10);

    const gs = (x: string) => { const l = x.toLowerCase(); if (l.includes("strong buy")) return 5; if (l.includes("buy")) return 4; if (l.includes("hold")) return 3; if (l.includes("sell")) return 2; return 3; };
    const ar = gl.length ? Math.round(gl.reduce((a: number, x: Record<string, string>) => a + gs(x.newGrade || ""), 0) / gl.length * 10) / 10 : 3;

    const ad: Record<string, unknown> = {};
    if (ptD?.targetConsensus) ad.priceTarget = { targetHigh: ptD.targetHigh, targetLow: ptD.targetLow, targetConsensus: ptD.targetConsensus, targetMedian: ptD.targetMedian, totalAnalysts: ptD.totalAnalysts ?? 0 };
    if (csD?.consensus) { ad.consensus = csD.consensus; ad.ratingsDistribution = { strongBuy: csD.strongBuy ?? 0, buy: csD.buy ?? 0, hold: csD.hold ?? 0, sell: csD.sell ?? 0, strongSell: csD.strongSell ?? 0, totalAnalysts: (csD.strongBuy ?? 0) + (csD.buy ?? 0) + (csD.hold ?? 0) + (csD.sell ?? 0) + (csD.strongSell ?? 0) }; }

    const p = q.price ?? 0;
    return j({
      symbol: S, name: q.name || S, exchange: q.exchange || '', price: p, previousClose: q.previousClose ?? 0,
      change: q.change ?? 0, changePercent: q.changesPercentage ?? 0, volume: q.volume ?? 0, avgVolume: q.avgVolume ?? 0,
      technical: { rsi: F(rsi)?.rsi ?? null, macd, macdSignal: macd != null ? macd * 0.8 : null, sma50: F(sma50)?.sma ?? null, sma200: F(sma200)?.sma ?? null, ema20: F(ema20)?.ema ?? null, bollingerUpper: null, bollingerLower: null, atr: null },
      fundamental: { peRatio: q.pe ?? k?.peRatio ?? null, forwardPE: k?.forwardPeRatio ?? null, earningsGrowth: g?.growthNetIncome != null ? g.growthNetIncome * 100 : null, debtToEquity: k?.debtToEquity ?? null, revenueGrowth: g?.growthRevenue != null ? g.growthRevenue * 100 : null, profitMargin: k?.netIncomePerRevenue != null ? k.netIncomePerRevenue * 100 : null, returnOnEquity: k?.roe != null ? k.roe * 100 : null, freeCashFlowYield: k?.freeCashFlowYield != null ? k.freeCashFlowYield * 100 : null },
      sentiment: { newsCount: nl.length, analystRating: ar, insiderActivity: 0, headline: nl[0]?.title || `${q.name || S} at $${p.toFixed(2)}`, recentNews: nl.slice(0, 5).map((n: Record<string, string>) => ({ title: n.title, publisher: n.publisher || n.site, date: n.publishedDate })), grades: gl.slice(0, 5).map((x: Record<string, string>) => ({ company: x.gradingCompany, grade: x.newGrade, action: x.action, date: x.date })) },
      analystData: Object.keys(ad).length ? ad : null,
    });
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
});
