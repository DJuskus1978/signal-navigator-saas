import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FMP_BASE = "https://financialmodelingprep.com";

async function fmpFetch(path: string, apiKey: string) {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${FMP_BASE}${path}${sep}apikey=${apiKey}`;
  console.log(`FMP: ${url.replace(apiKey, '***').substring(0, 120)}`);
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    console.error(`FMP ${res.status}: ${body.substring(0, 300)}`);
    throw new Error(`FMP ${res.status}`);
  }
  return res.json();
}

function quotePath(symbol: string) {
  return `/stable/quote?symbol=${encodeURIComponent(symbol)}`;
}
function searchSymbolPath(query: string, limit: number) {
  return `/stable/search-symbol?query=${encodeURIComponent(query)}&limit=${limit}`;
}
function technicalPath(indicator: string, symbol: string, period: number) {
  return `/stable/technical-indicators/${indicator}?symbol=${encodeURIComponent(symbol)}&period=${period}`;
}
function keyMetricsPath(symbol: string) {
  return `/stable/key-metrics?symbol=${encodeURIComponent(symbol)}&limit=1`;
}
function incomeGrowthPath(symbol: string) {
  return `/stable/income-statement-growth?symbol=${encodeURIComponent(symbol)}&limit=1`;
}
function newsPath(symbol: string) {
  return `/stable/news/stock?symbols=${encodeURIComponent(symbol)}&limit=20`;
}
function gradesPath(symbol: string) {
  return `/stable/grades?symbol=${encodeURIComponent(symbol)}&limit=10`;
}
function priceTargetPath(symbol: string) {
  return `/stable/price-target-consensus?symbol=${encodeURIComponent(symbol)}`;
}
function upgradeDowngradePath(symbol: string) {
  return `/stable/upgrades-downgrades-consensus?symbol=${encodeURIComponent(symbol)}`;
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
  } catch { /* ignore */ }
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
  const sum = r.reduce((a: number, g: Record<string, unknown>) => a + gradeScore(String(g.newGrade || "")), 0);
  return Math.round(sum / r.length * 10) / 10;
}

function calcGradeAction(grades: Record<string, unknown>[]): number {
  if (!grades?.length) return 0;
  const r = grades.slice(0, 10);
  let s = 0;
  for (const g of r) { if (g.action === "upgrade") s++; else if (g.action === "downgrade") s--; }
  return Math.max(-1, Math.min(1, s / r.length));
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
    const sq = searchParams.get('search');
    const typeFilter = searchParams.get('type');

    // Cleanup expired cache ~10% of requests
    if (Math.random() < 0.1) {
      svc().from('stock_cache').delete().lt('expires_at', new Date().toISOString()).then(() => {});
    }

    // ── Detail ──
    if (singleSymbol) {
      const sym = singleSymbol.toUpperCase();
      const ck = `detail:${sym}`;
      const cached = await getCache(ck);
      if (cached) return jsonRes(cached);

      const isCrypto = sym.endsWith("USD") && sym.length <= 10;
      const results = await Promise.all([
        fmpFetch(quotePath(sym), apiKey),
        fmpFetch(technicalPath("rsi", sym, 14), apiKey).catch(() => []),
        fmpFetch(technicalPath("sma", sym, 50), apiKey).catch(() => []),
        fmpFetch(technicalPath("sma", sym, 200), apiKey).catch(() => []),
        fmpFetch(technicalPath("ema", sym, 20), apiKey).catch(() => []),
        fmpFetch(technicalPath("ema", sym, 12), apiKey).catch(() => []),
        fmpFetch(technicalPath("ema", sym, 26), apiKey).catch(() => []),
        isCrypto ? Promise.resolve([]) : fmpFetch(keyMetricsPath(sym), apiKey).catch(() => []),
        isCrypto ? Promise.resolve([]) : fmpFetch(incomeGrowthPath(sym), apiKey).catch(() => []),
        fmpFetch(newsPath(sym), apiKey).catch(() => []),
        isCrypto ? Promise.resolve([]) : fmpFetch(gradesPath(sym), apiKey).catch(() => []),
        isCrypto ? Promise.resolve([]) : fmpFetch(priceTargetPath(sym), apiKey).catch(() => []),
        isCrypto ? Promise.resolve([]) : fmpFetch(upgradeDowngradePath(sym), apiKey).catch(() => []),
      ]);

      const first = (v: unknown) => Array.isArray(v) ? v[0] ?? null : v;
      const q: Record<string, unknown> = first(results[0]) as Record<string, unknown>;
      if (!q || q.error) return jsonRes({ error: q?.error || 'No quote data' }, 400);

      const r0 = first(results[1]) as Record<string, unknown> | null;
      const s50 = first(results[2]) as Record<string, unknown> | null;
      const s200 = first(results[3]) as Record<string, unknown> | null;
      const e20 = first(results[4]) as Record<string, unknown> | null;
      const e12 = first(results[5]) as Record<string, unknown> | null;
      const e26 = first(results[6]) as Record<string, unknown> | null;
      const km = first(results[7]) as Record<string, unknown> | null;
      const gr = first(results[8]) as Record<string, unknown> | null;
      const news = Array.isArray(results[9]) ? results[9] : [];
      const grades = Array.isArray(results[10]) ? results[10] : [];
      const ptD = first(results[11]) as Record<string, unknown> | null;
      const csD = first(results[12]) as Record<string, unknown> | null;

      const ema12Val = e12?.ema as number | undefined;
      const ema26Val = e26?.ema as number | undefined;
      const macd = (ema12Val != null && ema26Val != null) ? ema12Val - ema26Val : null;

      const ad: Record<string, unknown> = {};
      if (ptD?.targetConsensus) {
        ad.priceTarget = { targetHigh: ptD.targetHigh ?? null, targetLow: ptD.targetLow ?? null, targetConsensus: ptD.targetConsensus ?? null, targetMedian: ptD.targetMedian ?? null, totalAnalysts: ptD.totalAnalysts ?? 0 };
      }
      if (csD?.consensus) {
        ad.consensus = csD.consensus;
        const sb2 = csD.strongBuy as number ?? 0;
        const b = csD.buy as number ?? 0;
        const h = csD.hold as number ?? 0;
        const se = csD.sell as number ?? 0;
        const ss = csD.strongSell as number ?? 0;
        ad.ratingsDistribution = { strongBuy: sb2, buy: b, hold: h, sell: se, strongSell: ss, totalAnalysts: sb2 + b + h + se + ss };
      }

      const price = q.price as number ?? 0;
      const result = {
        symbol: sym, name: q.name || sym, exchange: q.exchange || '',
        price, previousClose: q.previousClose ?? 0,
        change: q.change ?? 0, changePercent: q.changesPercentage ?? q.changePercentage ?? 0,
        volume: q.volume ?? 0, avgVolume: q.avgVolume ?? q.volume ?? 0,
        technical: {
          rsi: r0?.rsi ?? null, macd, macdSignal: macd != null ? macd * 0.8 : null,
          sma50: s50?.sma ?? null, sma200: s200?.sma ?? null, ema20: e20?.ema ?? null,
          bollingerUpper: null, bollingerLower: null, atr: null
        },
        fundamental: {
          peRatio: q.pe ?? km?.peRatio ?? null, forwardPE: km?.forwardPeRatio ?? null,
          earningsGrowth: gr?.growthNetIncome != null ? (gr.growthNetIncome as number) * 100 : null,
          debtToEquity: km?.debtToEquity ?? null,
          revenueGrowth: gr?.growthRevenue != null ? (gr.growthRevenue as number) * 100 : null,
          profitMargin: km?.netIncomePerRevenue != null ? (km.netIncomePerRevenue as number) * 100 : null,
          returnOnEquity: km?.roe != null ? (km.roe as number) * 100 : null,
          freeCashFlowYield: km?.freeCashFlowYield != null ? (km.freeCashFlowYield as number) * 100 : null
        },
        sentiment: {
          newsCount: news.length, analystRating: calcAnalystRating(grades), insiderActivity: calcGradeAction(grades),
          headline: news[0]?.title || `${q.name || sym} at $${price.toFixed(2)}`,
          recentNews: news.slice(0, 5).map((n: Record<string, string>) => ({ title: n.title, publisher: n.publisher || n.site, date: n.publishedDate })),
          grades: grades.slice(0, 5).map((g: Record<string, string>) => ({ company: g.gradingCompany, grade: g.newGrade, action: g.action, date: g.date })),
        },
        analystData: Object.keys(ad).length ? ad : null,
      };
      await setCache(ck, result, 2);
      return jsonRes(result);
    }

    // ── Batch ──
    if (symbolsParam) {
      const syms = symbolsParam.split(',').slice(0, 30);
      const ck = `batch:${syms.sort().join(',')}`;
      const cached = await getCache(ck);
      if (cached) return jsonRes(cached);

      const stocks = (await Promise.all(syms.map(s =>
        fmpFetch(quotePath(s.trim()), apiKey)
          .then((d: unknown) => {
            const q = Array.isArray(d) ? d[0] : d as Record<string, unknown>;
            if (!q?.symbol) return null;
            return { symbol: q.symbol, name: q.name || q.symbol, exchange: q.exchange || '', price: q.price ?? 0, previousClose: q.previousClose ?? 0, change: q.change ?? 0, changePercent: q.changesPercentage ?? q.changePercentage ?? 0, volume: q.volume ?? 0, avgVolume: q.avgVolume ?? q.volume ?? 0 };
          })
          .catch(() => null)
      ))).filter(Boolean);

      const rd = { stocks };
      await setCache(ck, rd, 5);
      return jsonRes(rd);
    }

    // ── Search ──
    if (sq && sq.length >= 1) {
      const isCrypto = typeFilter === "crypto";
      const ck = `search:${isCrypto ? "crypto:" : ""}${sq.toLowerCase()}`;
      const cached = await getCache(ck);
      if (cached) return jsonRes(cached);

      const sr = await fmpFetch(searchSymbolPath(sq, isCrypto ? 30 : 10), apiKey).catch(() => []);
      const all = Array.isArray(sr) ? sr : [];
      const seen = new Set<string>();
      const items: Record<string, unknown>[] = [];
      for (const i of all) { if (i?.symbol && !seen.has(i.symbol)) { seen.add(i.symbol); items.push(i); } }

      let filtered: Record<string, unknown>[];
      if (isCrypto) {
        filtered = items.filter(i => {
          const s = String(i.symbol || "").toUpperCase();
          const t = String(i.type || "").toLowerCase();
          const e = String(i.exchangeShortName || i.exchange || "").toUpperCase();
          return t === "crypto" || e.includes("CRYPTO") || e === "CCC" || s.endsWith("USD") || s.endsWith("USDT");
        }).slice(0, 12);
      } else {
        filtered = items.filter(i => i.type === "stock" || i.type === "crypto" || !i.type).slice(0, 8);
      }

      if (!filtered.length) return jsonRes({ stocks: [] });

      const stocks = (await Promise.all(filtered.map(i =>
        fmpFetch(quotePath(String(i.symbol)), apiKey)
          .then((d: unknown) => {
            const q = Array.isArray(d) ? d[0] : d as Record<string, unknown>;
            if (!q?.symbol) return null;
            return { symbol: q.symbol, name: q.name || i.name || q.symbol, exchange: q.exchange || i.exchangeShortName || '', price: q.price ?? 0, previousClose: q.previousClose ?? 0, change: q.change ?? 0, changePercent: q.changesPercentage ?? q.changePercentage ?? 0, volume: q.volume ?? 0, avgVolume: q.volume ?? 0 };
          })
          .catch(() => null)
      ))).filter(Boolean);

      const rd = { stocks };
      await setCache(ck, rd, 3);
      return jsonRes(rd);
    }

    return jsonRes({ error: 'Provide ?symbols=AAPL,MSFT or ?symbol=AAPL or ?search=query' }, 400);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Edge fn error:', msg);
    return jsonRes({ error: msg }, 500);
  }
});
