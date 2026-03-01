import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FMP_BASE = "https://financialmodelingprep.com";
const CACHE_TTL_BATCH = 5;
const CACHE_TTL_SEARCH = 3;
const CACHE_TTL_DETAIL = 2;

async function fmpFetch(path: string, apiKey: string) {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${FMP_BASE}${path}${sep}apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FMP ${res.status}: ${path}`);
  return res.json();
}

function svc() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}

async function getCache(key: string) {
  try {
    const { data } = await svc().from('stock_cache').select('data').eq('cache_key', key).gt('expires_at', new Date().toISOString()).single();
    return data?.data ?? null;
  } catch { return null; }
}

async function setCache(key: string, val: unknown, mins: number) {
  try {
    const now = new Date();
    await svc().from('stock_cache').upsert({ cache_key: key, data: val, fetched_at: now.toISOString(), expires_at: new Date(now.getTime() + mins * 60000).toISOString() }, { onConflict: 'cache_key' });
  } catch (e) { console.error('cache write:', e); }
}

function gradeScore(g: string): number {
  const l = g.toLowerCase();
  if (l.includes("strong buy") || l.includes("top pick")) return 5;
  if (l.includes("outperform") || l.includes("overweight") || l.includes("buy")) return 4;
  if (l.includes("hold") || l.includes("neutral") || l.includes("equal") || l.includes("market perform") || l.includes("peer perform") || l.includes("sector perform") || l.includes("in-line")) return 3;
  if (l.includes("underperform") || l.includes("underweight") || l.includes("reduce")) return 2;
  if (l.includes("sell")) return 1;
  return 3;
}

function analystRating(grades: any[]): number {
  if (!grades?.length) return 3;
  const r = grades.slice(0, 10);
  return Math.round(r.reduce((a: number, g: any) => a + gradeScore(g.newGrade || ""), 0) / r.length * 10) / 10;
}

function gradeAction(grades: any[]): number {
  if (!grades?.length) return 0;
  const r = grades.slice(0, 10);
  let s = 0;
  for (const g of r) { if (g.action === "upgrade") s++; else if (g.action === "downgrade") s--; }
  return Math.max(-1, Math.min(1, s / r.length));
}

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return jsonRes({ error: 'Unauthorized' }, 401);

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error } = await sb.auth.getUser();
    if (error || !user) return jsonRes({ error: 'Unauthorized' }, 401);

    const apiKey = Deno.env.get('FMP_API_KEY');
    if (!apiKey) return jsonRes({ error: 'FMP API key not configured' }, 500);

    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols');
    const singleSymbol = searchParams.get('symbol');
    const typeFilter = searchParams.get('type');

    // cleanup expired cache ~10% of requests
    if (Math.random() < 0.1) svc().from('stock_cache').delete().lt('expires_at', new Date().toISOString()).then(() => {});

    // ── Detail ──
    if (singleSymbol) {
      const sym = singleSymbol.toUpperCase();
      const ck = `detail:${sym}`;
      const c = await getCache(ck);
      if (c) return jsonRes(c);

      const isCrypto = sym.endsWith("USD") && sym.length <= 10;
      const [qArr, rsiA, s50A, s200A, e20A, e12A, e26A, kmA, grA, nwA, gdA, ptA, csA] = await Promise.all([
        fmpFetch(`/stable/quote?symbol=${sym}`, apiKey),
        fmpFetch(`/stable/technical-indicators/rsi?symbol=${sym}&periodLength=14&timeframe=1day`, apiKey).catch(() => []),
        fmpFetch(`/stable/technical-indicators/sma?symbol=${sym}&periodLength=50&timeframe=1day`, apiKey).catch(() => []),
        fmpFetch(`/stable/technical-indicators/sma?symbol=${sym}&periodLength=200&timeframe=1day`, apiKey).catch(() => []),
        fmpFetch(`/stable/technical-indicators/ema?symbol=${sym}&periodLength=20&timeframe=1day`, apiKey).catch(() => []),
        fmpFetch(`/stable/technical-indicators/ema?symbol=${sym}&periodLength=12&timeframe=1day`, apiKey).catch(() => []),
        fmpFetch(`/stable/technical-indicators/ema?symbol=${sym}&periodLength=26&timeframe=1day`, apiKey).catch(() => []),
        isCrypto ? Promise.resolve([]) : fmpFetch(`/stable/key-metrics?symbol=${sym}&limit=1`, apiKey).catch(() => []),
        isCrypto ? Promise.resolve([]) : fmpFetch(`/stable/income-statement-growth?symbol=${sym}&limit=1`, apiKey).catch(() => []),
        isCrypto ? fmpFetch(`/stable/news/crypto?symbol=${sym}&limit=20`, apiKey).catch(() => []) : fmpFetch(`/stable/news/stock?symbol=${sym}&limit=20`, apiKey).catch(() => []),
        isCrypto ? Promise.resolve([]) : fmpFetch(`/stable/grades?symbol=${sym}&limit=10`, apiKey).catch(() => []),
        isCrypto ? Promise.resolve([]) : fmpFetch(`/stable/price-target-consensus?symbol=${sym}`, apiKey).catch(() => []),
        isCrypto ? Promise.resolve([]) : fmpFetch(`/stable/upgrades-downgrades-consensus?symbol=${sym}`, apiKey).catch(() => []),
      ]);

      const q = Array.isArray(qArr) ? qArr[0] : qArr;
      if (!q || q.error) return jsonRes({ error: q?.error || 'No quote data' }, 400);

      const r0 = Array.isArray(rsiA) ? rsiA[0] : null;
      const s50 = Array.isArray(s50A) ? s50A[0] : null;
      const s200 = Array.isArray(s200A) ? s200A[0] : null;
      const e20 = Array.isArray(e20A) ? e20A[0] : null;
      const e12 = Array.isArray(e12A) ? e12A[0] : null;
      const e26 = Array.isArray(e26A) ? e26A[0] : null;
      const km = Array.isArray(kmA) ? kmA[0] : null;
      const gr = Array.isArray(grA) ? grA[0] : null;
      const news = Array.isArray(nwA) ? nwA : [];
      const grades = Array.isArray(gdA) ? gdA : [];

      const macd = (e12?.ema != null && e26?.ema != null) ? e12.ema - e26.ema : null;

      const ptD = Array.isArray(ptA) ? ptA[0] : (typeof ptA === 'object' ? ptA : null);
      const csD = Array.isArray(csA) ? csA[0] : (typeof csA === 'object' ? csA : null);
      const ad: any = {};
      if (ptD?.targetConsensus) ad.priceTarget = { targetHigh: ptD.targetHigh ?? null, targetLow: ptD.targetLow ?? null, targetConsensus: ptD.targetConsensus ?? null, targetMedian: ptD.targetMedian ?? null, totalAnalysts: ptD.totalAnalysts ?? 0 };
      if (csD?.consensus) { ad.consensus = csD.consensus; ad.ratingsDistribution = { strongBuy: csD.strongBuy ?? 0, buy: csD.buy ?? 0, hold: csD.hold ?? 0, sell: csD.sell ?? 0, strongSell: csD.strongSell ?? 0, totalAnalysts: (csD.strongBuy ?? 0) + (csD.buy ?? 0) + (csD.hold ?? 0) + (csD.sell ?? 0) + (csD.strongSell ?? 0) }; }

      const result = {
        symbol: sym, name: q.name || sym, exchange: q.exchange || '', price: q.price ?? 0, previousClose: q.previousClose ?? 0, change: q.change ?? 0, changePercent: q.changePercentage ?? 0, volume: q.volume ?? 0, avgVolume: q.avgVolume ?? q.volume ?? 0,
        technical: { rsi: r0?.rsi ?? null, macd, macdSignal: macd != null ? macd * 0.8 : null, sma50: s50?.sma ?? null, sma200: s200?.sma ?? null, ema20: e20?.ema ?? null, bollingerUpper: null, bollingerLower: null, atr: null },
        fundamental: { peRatio: q.pe ?? km?.peRatio ?? null, forwardPE: km?.forwardPeRatio ?? null, earningsGrowth: gr?.growthNetIncome != null ? gr.growthNetIncome * 100 : null, debtToEquity: km?.debtToEquity ?? null, revenueGrowth: gr?.growthRevenue != null ? gr.growthRevenue * 100 : null, profitMargin: km?.netIncomePerRevenue != null ? km.netIncomePerRevenue * 100 : null, returnOnEquity: km?.roe != null ? km.roe * 100 : null, freeCashFlowYield: km?.freeCashFlowYield != null ? km.freeCashFlowYield * 100 : null },
        sentiment: { newsCount: news.length, analystRating: analystRating(grades), insiderActivity: gradeAction(grades), headline: news[0]?.title || `${q.name || sym} at $${q.price?.toFixed(2)}`, recentNews: news.slice(0, 5).map((n: any) => ({ title: n.title, publisher: n.publisher, date: n.publishedDate })), grades: grades.slice(0, 5).map((g: any) => ({ company: g.gradingCompany, grade: g.newGrade, action: g.action, date: g.date })) },
        analystData: Object.keys(ad).length ? ad : null,
      };
      await setCache(ck, result, CACHE_TTL_DETAIL);
      return jsonRes(result);
    }

    // ── Batch ──
    if (symbolsParam) {
      const syms = symbolsParam.split(',').slice(0, 30);
      const ck = `batch:${syms.sort().join(',')}`;
      const c = await getCache(ck);
      if (c) { console.log(`Cache HIT ${ck}`); return jsonRes(c); }
      console.log(`Cache MISS ${ck}`);

      const stocks = (await Promise.all(syms.map(s =>
        fmpFetch(`/stable/quote?symbol=${s.trim()}`, apiKey)
          .then((d: any) => { const q = Array.isArray(d) ? d[0] : d; if (!q?.symbol) return null; return { symbol: q.symbol, name: q.name || q.symbol, exchange: q.exchange || '', price: q.price ?? 0, previousClose: q.previousClose ?? 0, change: q.change ?? 0, changePercent: q.changePercentage ?? 0, volume: q.volume ?? 0, avgVolume: q.avgVolume ?? q.volume ?? 0 }; })
          .catch((e: Error) => { console.error(`FMP err ${s}:`, e.message); return null; })
      ))).filter(Boolean);

      const rd = { stocks };
      await setCache(ck, rd, CACHE_TTL_BATCH);
      return jsonRes(rd);
    }

    // ── Search ──
    const sq = searchParams.get('search');
    if (sq && sq.length >= 1) {
      const isCrypto = typeFilter === "crypto";
      const ck = `search:${isCrypto ? "crypto:" : ""}${sq.toLowerCase()}`;
      const c = await getCache(ck);
      if (c) return jsonRes(c);

      const [sr, nr] = await Promise.all([
        fmpFetch(`/stable/search-symbol?query=${encodeURIComponent(sq)}&limit=${isCrypto ? 30 : 10}`, apiKey).catch(() => []),
        fmpFetch(`/stable/search-name?query=${encodeURIComponent(sq)}&limit=${isCrypto ? 30 : 10}`, apiKey).catch(() => []),
      ]);
      const all = [...(Array.isArray(sr) ? sr : []), ...(Array.isArray(nr) ? nr : [])];
      const seen = new Set<string>();
      const items: any[] = [];
      for (const i of all) { if (i?.symbol && !seen.has(i.symbol)) { seen.add(i.symbol); items.push(i); } }

      let filtered: any[];
      if (isCrypto) {
        filtered = items.filter((i: any) => { const s = (i.symbol || "").toUpperCase(); const t = (i.type || "").toLowerCase(); const e = (i.exchangeShortName || i.exchange || "").toUpperCase(); return t === "crypto" || e.includes("CRYPTO") || e === "CCC" || s.endsWith("USD") || s.endsWith("USDT"); }).slice(0, 12);
      } else {
        filtered = items.filter((i: any) => i.type === "stock" || i.type === "crypto" || !i.type).slice(0, 8);
      }

      if (!filtered.length) return jsonRes({ stocks: [] });

      const stocks = (await Promise.all(filtered.map((i: any) =>
        fmpFetch(`/stable/quote?symbol=${i.symbol}`, apiKey)
          .then((d: any) => { const q = Array.isArray(d) ? d[0] : d; if (!q?.symbol) return null; return { symbol: q.symbol, name: q.name || i.name || q.symbol, exchange: q.exchange || i.exchangeShortName || '', price: q.price ?? 0, previousClose: q.previousClose ?? 0, change: q.change ?? 0, changePercent: q.changePercentage ?? 0, volume: q.volume ?? 0, avgVolume: q.volume ?? 0 }; })
          .catch(() => null)
      ))).filter(Boolean);

      const rd = { stocks };
      await setCache(ck, rd, CACHE_TTL_SEARCH);
      return jsonRes(rd);
    }

    return jsonRes({ error: 'Provide ?symbols=AAPL,MSFT or ?symbol=AAPL or ?search=query' }, 400);
  } catch (err: any) {
    console.error('Edge fn error:', err);
    return jsonRes({ error: err.message }, 500);
  }
});
