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

    const key = Deno.env.get('FMP_API_KEY');
    const sp = new URL(req.url).searchParams;
    const syms = sp.get('symbols');
    if (!syms) return j({ error: 'Provide ?symbols=' }, 400);

    const list = syms.split(',').slice(0, 5);
    const stocks = [];
    for (const s of list) {
      try {
        const r = await fetch(`https://financialmodelingprep.com/stable/quote?symbol=${s.trim()}&apikey=${key}`);
        const d = await r.json();
        const q = Array.isArray(d) ? d[0] : d;
        if (q?.symbol) stocks.push({ symbol: q.symbol, name: q.name || q.symbol, price: q.price ?? 0, change: q.change ?? 0, changePercent: q.changesPercentage ?? 0 });
      } catch { /* skip */ }
    }
    return j({ stocks });
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
});
