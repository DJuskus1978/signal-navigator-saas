import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FMP_BASE = "https://financialmodelingprep.com/api/v3";

async function fmpFetch(path: string, apiKey: string) {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${FMP_BASE}${path}${sep}apikey=${apiKey}`;
  console.log(`FMP: ${url.replace(apiKey, "***").substring(0, 120)}`);
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    console.error(`FMP ${res.status}: ${body.substring(0, 200)}`);
    throw new Error(`FMP ${res.status}`);
  }
  return res.json();
}

function svc() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}

async function getCache(key: string) {
  try {
    const { data } = await svc().from('stock_cache').select('data').eq('cache_key', key).gt('expires_at', new Date().toISOString()).single();
    return data?.data ?? null;
  } catch (_e) { return null; }
}

async function setCache(key: string, val: unknown, mins: number) {
  try {
    const now = new Date();
    await svc().from('stock_cache').upsert({ cache_key: key, data: val, fetched_at: now.toISOString(), expires_at: new Date(now.getTime() + mins * 60000).toISOString() }, { onConflict: 'cache_key' });
  } catch (_e) { /* ignore */ }
}

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function gradeScore(g: string): number {
  const l = g.toLowerCase();
  if (l.includes("strong buy") || l.includes("top pick")) return 5;
  if (l.includes("outperform") || l.includes("overweight") || l.includes("buy")) return 4;
  if (l.includes("hold") || l.includes("neutral") || l.includes("equal") || l.includes("market perform")) return 3;
  if (l.includes("underperform") || l.includes("underweight") || l.includes("reduce")) return 2;
  if (l.includes("sell")) return 1;
  return 3;
}

function calcAnalystRating(grades: Record<string, unknown>[]): number {
  if (!grades?.length) return 3;
  const r = grades.slice(0, 10);
  const sum = r.reduce((a, g) => a + gradeScore(String(g.newGrade || "")), 0);
  return Math.round(sum / r.length * 10) / 10;
}

function calcGradeAction(grades: Record<string, unknown>[]): number {
  if (!grades?.length) return 0;
  const r = grades.slice(0, 10);
  let s = 0;
  for (const g of r) { if (g.action === "upgrade") s++; else if (g.action === "downgrade") s--; }
  return Math.max(-1, Math.min(1, s / r.length));
}

// v3 endpoints use PATH-based parameters: /api/v3/quote/AAPL
async function handleDetail(sym: string, apiKey: string) {
  const ck = `detail:${sym}`;
  const cached = await getCache(ck);
  if (cached) return jsonRes(cached);

  const isCrypto = sym.endsWith("USD") && sym.length <= 10;

  const fetches = [
    fmpFetch(`/quote/${sym}`, apiKey),
    fmpFetch(`/technical_indicator/daily/${sym}?type=rsi&period=14`, apiKey).catch(() => []),
    fmpFetch(`/technical_indicator/daily/${sym}?type=sma&period=50`, apiKey).catch(() => []),
    fmpFetch(`/technical_indicator/daily/${sym}?type=sma&period=200`, apiKey).catch(() => []),
    fmpFetch(`/technical_indicator/daily/${sym}?type=ema&period=20`, apiKey).catch(() => []),
    fmpFetch(`/technical_indicator/daily/${sym}?type=ema&period=12`, apiKey).catch(() => []),
    fmpFetch(`/technical_indicator/daily/${sym}?type=ema&period=26`, apiKey).catch(() => []),
    isCrypto ? Promise.resolve([]) : fmpFetch(`/key-metrics/${sym}?limit=1`, apiKey).catch(() => []),
    isCrypto ? Promise.resolve([]) : fmpFetch(`/income-statement-growth/${sym}?limit=1`, apiKey).catch(() => []),
    fmpFetch(`/stock_news?tickers=${sym}&limit=20`, apiKey).catch(() => []),
    isCrypto ? Promise.resolve([]) : fmpFetch(`/grade/${sym}?limit=10`, apiKey).catch(() => []),
    isCrypto ? Promise.resolve([]) : fmpFetch(`/price-target-consensus/${sym}`, apiKey).catch(() => []),
    isCrypto ? Promise.resolve([]) : fmpFetch(`/upgrades-downgrades-consensus/${sym}`, apiKey).catch(() => []),
  ];
  const results = await Promise.all(fetches);

  const first = (v: unknown) => Array.isArray(v) ? v[0] ?? null : v;
  const q = first(results[0]);
  if (!q || q.error) return jsonRes({ error: q?.error || 'No quote data' }, 400);

  const r0 = first(results[1]);
  const s50 = first(results[2]);
  const s200 = first(results[3]);
  const e20 = first(results[4]);
  const e12 = first(results[5]);
  const e26 = first(results[6]);
  const km = first(results[7]);
  const gr = first(results[8]);
  const news = Array.isArray(results[9]) ? results[9] : [];
  const grades = Array.isArray(results[10]) ? results[10] : [];
  const ptD = first(results[11]);
  const csD = first(results[12]);

  const macd = (e12?.ema != null && e26?.ema != null) ? e12.ema - e26.ema : null;

  const ad: Record<string, unknown> = {};
  if (ptD?.targetConsensus) {
    ad.priceTarget = { targetHigh: ptD.targetHigh ?? null, targetLow: ptD.targetLow ?? null, targetConsensus: ptD.targetConsensus ?? null, targetMedian: ptD.targetMedian ?? null, totalAnalysts: ptD.totalAnalysts ?? 0 };
  }
  if (csD?.consensus) {
    ad.consensus = csD.consensus;
    ad.ratingsDistribution = { strongBuy: csD.strongBuy ?? 0, buy: csD.buy ?? 0, hold: csD.hold ?? 0, sell: csD.sell ?? 0, strongSell: csD.strongSell ?? 0, totalAnalysts: (csD.strongBuy ?? 0) + (csD.buy ?? 0) + (csD.hold ?? 0) + (csD.sell ?? 0) + (csD.strongSell ?? 0) };
  }

  const result = {
    symbol: sym, name: q.name || sym, exchange: q.exchange || '',
    price: q.price ?? 0, previousClose: q.previousClose ?? 0,
    change: q.change ?? 0, changePercent: q.changesPercentage ?? q.changePercentage ?? 0,
    volume: q.volume ?? 0, avgVolume: q.avgVolume ?? q.volume ?? 0,
    technical: { rsi: r0?.rsi ?? null, macd, macdSignal: macd != null ? macd * 0.8 : null, sma50: s50?.sma ?? null, sma200: s200?.sma ?? null, ema20: e20?.ema ?? null, bollingerUpper: null, bollingerLower: null, atr: null },
    fundamental: { peRatio: q.pe ?? km?.peRatio ?? null, forwardPE: km?.forwardPeRatio ?? null, earningsGrowth: gr?.growthNetIncome != null ? gr.growthNetIncome * 100 : null, debtToEquity: km?.debtToEquity ?? null, revenueGrowth: gr?.growthRevenue != null ? gr.growthRevenue * 100 : null, profitMargin: km?.netIncomePerRevenue != null ? km.netIncomePerRevenue * 100 : null, returnOnEquity: km?.roe != null ? km.roe * 100 : null, freeCashFlowYield: km?.freeCashFlowYield != null ? km.freeCashFlowYield * 100 : null },
    sentiment: {
      newsCount: news.length, analystRating: calcAnalystRating(grades), insiderActivity: calcGradeAction(grades),
      headline: news[0]?.title || `${q.name || sym} at $${q.price?.toFixed(2)}`,
      recentNews: news.slice(0, 5).map((n: Record<string, string>) => ({ title: n.title, publisher: n.publisher || n.site, date: n.publishedDate })),
      grades: grades.slice(0, 5).map((g: Record<string, string>) => ({ company: g.gradingCompany, grade: g.newGrade, action: g.action, date: g.date })),
    },
    analystData: Object.keys(ad).length ? ad : null,
  };
  await setCache(ck, result, 2);
  return jsonRes(result);
}

// v3 batch: /api/v3/quote/AAPL,MSFT (comma-separated in path)
async function handleBatch(symbolsParam: string, apiKey: string) {
  const syms = symbolsParam.split(',').slice(0, 30);
  const ck = `batch:${syms.sort().join(',')}`;
  const cached = await getCache(ck);
  if (cached) return jsonRes(cached);

  // v3 supports comma-separated symbols in one call
  const joined = syms.map(s => s.trim()).join(',');
  const data = await fmpFetch(`/quote/${joined}`, apiKey).catch(() => []);
  const arr = Array.isArray(data) ? data : [data];

  const stocks = arr.filter(q => q?.symbol).map(q => ({
    symbol: q.symbol, name: q.name || q.symbol, exchange: q.exchange || '',
    price: q.price ?? 0, previousClose: q.previousClose ?? 0,
    change: q.change ?? 0, changePercent: q.changesPercentage ?? q.changePercentage ?? 0,
    volume: q.volume ?? 0, avgVolume: q.avgVolume ?? q.volume ?? 0,
  }));

  const rd = { stocks };
  await setCache(ck, rd, 5);
  return jsonRes(rd);
}

async function handleSearch(sq: string, isCrypto: boolean, apiKey: string) {
  const ck = `search:${isCrypto ? "crypto:" : ""}${sq.toLowerCase()}`;
  const cached = await getCache(ck);
  if (cached) return jsonRes(cached);

  const sr = await fmpFetch(`/search?query=${encodeURIComponent(sq)}&limit=${isCrypto ? 30 : 10}`, apiKey).catch(() => []);
  const all = Array.isArray(sr) ? sr : [];
  const seen = new Set<string>();
  const items: Record<string, unknown>[] = [];
  for (const i of all) { if (i?.symbol && !seen.has(i.symbol)) { seen.add(i.symbol); items.push(i); } }

  let filtered: Record<string, unknown>[];
  if (isCrypto) {
    filtered = items.filter(i => { const s = String(i.symbol || "").toUpperCase(); const t = String(i.type || "").toLowerCase(); const e = String(i.exchangeShortName || i.exchange || "").toUpperCase(); return t === "crypto" || e.includes("CRYPTO") || e === "CCC" || s.endsWith("USD") || s.endsWith("USDT"); }).slice(0, 12);
  } else {
    filtered = items.filter(i => i.type === "stock" || i.type === "crypto" || !i.type).slice(0, 8);
  }

  if (!filtered.length) return jsonRes({ stocks: [] });

  // Batch quote for all filtered symbols
  const syms = filtered.map(i => i.symbol).join(',');
  const quotes = await fmpFetch(`/quote/${syms}`, apiKey).catch(() => []);
  const qArr = Array.isArray(quotes) ? quotes : [];
  const qMap = new Map(qArr.map(q => [q.symbol, q]));

  const stocks = filtered.map(i => {
    const q = qMap.get(i.symbol as string);
    if (!q) return null;
    return { symbol: q.symbol, name: q.name || i.name || q.symbol, exchange: q.exchange || i.exchangeShortName || '', price: q.price ?? 0, previousClose: q.previousClose ?? 0, change: q.change ?? 0, changePercent: q.changesPercentage ?? q.changePercentage ?? 0, volume: q.volume ?? 0, avgVolume: q.volume ?? 0 };
  }).filter(Boolean);

  const rd = { stocks };
  await setCache(ck, rd, 3);
  return jsonRes(rd);
}

Deno.serve(async (req: Request) => {
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
    const sq = searchParams.get('search');
    const typeFilter = searchParams.get('type');

    if (Math.random() < 0.1) svc().from('stock_cache').delete().lt('expires_at', new Date().toISOString()).then(() => {});

    if (singleSymbol) return handleDetail(singleSymbol.toUpperCase(), apiKey);
    if (symbolsParam) return handleBatch(symbolsParam, apiKey);
    if (sq && sq.length >= 1) return handleSearch(sq, typeFilter === "crypto", apiKey);

    return jsonRes({ error: 'Provide ?symbols=AAPL,MSFT or ?symbol=AAPL or ?search=query' }, 400);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Edge fn error:', msg);
    return jsonRes({ error: msg }, 500);
  }
});
