import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const FMP = "https://financialmodelingprep.com";

async function getPrice(symbol: string, key: string) {
  try {
    const r = await fetch(`${FMP}/stable/technical-indicators/rsi?symbol=${symbol.trim()}&periodLength=14&timeframe=1day&apikey=${key}`);
    const d = await r.json();
    if (!Array.isArray(d) || d.length === 0) return null;
    const latest = d[0];
    const prev = d[1];
    const price = latest.close ?? 0;
    const previousClose = prev?.close ?? price;
    const change = Math.round((price - previousClose) * 100) / 100;
    const changePercent = previousClose > 0 ? Math.round((change / previousClose) * 10000) / 100 : 0;
    return { symbol: symbol.trim().toUpperCase(), price, previousClose, change, changePercent, volume: latest.volume ?? 0 };
  } catch { return null; }
}

async function getMeta(symbol: string, key: string) {
  try {
    const r = await fetch(`${FMP}/stable/search-symbol?query=${symbol.trim()}&limit=5&apikey=${key}`);
    const d = await r.json();
    if (!Array.isArray(d)) return { name: symbol, exchange: '' };
    const match = d.find((x: Record<string, string>) => x.symbol === symbol.trim().toUpperCase());
    return { name: match?.name || d[0]?.name || symbol, exchange: match?.exchangeShortName || d[0]?.exchangeShortName || '' };
  } catch { return { name: symbol, exchange: '' }; }
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
    const sp = new URL(req.url).searchParams;
    const syms = sp.get('symbols');
    const sq = sp.get('search');

    if (syms) {
      const list = syms.split(',').slice(0, 30);
      const stocks = (await Promise.all(list.map(async (s) => {
        const [priceData, meta] = await Promise.all([getPrice(s, key), getMeta(s, key)]);
        if (!priceData) return null;
        return { ...priceData, name: meta.name, exchange: meta.exchange, avgVolume: priceData.volume };
      }))).filter(Boolean);
      return new Response(JSON.stringify({ stocks }), { headers: { ...H, 'Content-Type': 'application/json' } });
    }

    if (sq && sq.length >= 1) {
      const sr = await fetch(`${FMP}/stable/search-symbol?query=${encodeURIComponent(sq)}&limit=10&apikey=${key}`);
      const all = await sr.json();
      const items = (Array.isArray(all) ? all : []).slice(0, 8);
      const stocks = (await Promise.all(items.map(async (i: Record<string, string>) => {
        const priceData = await getPrice(i.symbol, key);
        if (!priceData) return null;
        return { ...priceData, name: i.name || priceData.symbol, exchange: i.exchangeShortName || '', avgVolume: priceData.volume };
      }))).filter(Boolean);
      return new Response(JSON.stringify({ stocks }), { headers: { ...H, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Provide ?symbols= or ?search=' }), { status: 400, headers: { ...H, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...H, 'Content-Type': 'application/json' } });
  }
});
