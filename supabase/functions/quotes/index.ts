import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
        try {
          const r = await fetch(`https://financialmodelingprep.com/stable/quote?symbol=${s.trim()}&apikey=${key}`);
          const d = await r.json();
          const q = Array.isArray(d) ? d[0] : d;
          if (!q?.symbol) return null;
          return { symbol: q.symbol, name: q.name || q.symbol, exchange: q.exchange || '', price: q.price ?? 0, previousClose: q.previousClose ?? 0, change: q.change ?? 0, changePercent: q.changesPercentage ?? 0, volume: q.volume ?? 0, avgVolume: q.avgVolume ?? 0 };
        } catch { return null; }
      }))).filter(Boolean);
      return new Response(JSON.stringify({ stocks }), { headers: { ...H, 'Content-Type': 'application/json' } });
    }

    if (sq && sq.length >= 1) {
      const sr = await fetch(`https://financialmodelingprep.com/stable/search-symbol?query=${encodeURIComponent(sq)}&limit=10&apikey=${key}`);
      const all = await sr.json();
      const items = (Array.isArray(all) ? all : []).slice(0, 8);
      const stocks = (await Promise.all(items.map(async (i: Record<string, string>) => {
        try {
          const r = await fetch(`https://financialmodelingprep.com/stable/quote?symbol=${i.symbol}&apikey=${key}`);
          const d = await r.json();
          const q = Array.isArray(d) ? d[0] : d;
          if (!q?.symbol) return null;
          return { symbol: q.symbol, name: q.name || i.name || q.symbol, exchange: q.exchange || '', price: q.price ?? 0, previousClose: q.previousClose ?? 0, change: q.change ?? 0, changePercent: q.changesPercentage ?? 0, volume: q.volume ?? 0, avgVolume: q.volume ?? 0 };
        } catch { return null; }
      }))).filter(Boolean);
      return new Response(JSON.stringify({ stocks }), { headers: { ...H, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Provide ?symbols= or ?search=' }), { status: 400, headers: { ...H, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...H, 'Content-Type': 'application/json' } });
  }
});
