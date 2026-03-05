import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const AV = "https://www.alphavantage.co/query";

async function getPrice(symbol: string, key: string) {
  try {
    const isCrypto = symbol.endsWith("USD") && symbol.length <= 10;
    if (isCrypto) {
      const fromCurrency = symbol.replace("USD", "");
      const r = await fetch(`${AV}?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=USD&apikey=${key}`);
      const d = await r.json();
      const rate = d?.["Realtime Currency Exchange Rate"];
      if (!rate) return null;
      const price = parseFloat(rate["5. Exchange Rate"] || "0");
      return { symbol, price, previousClose: price, change: 0, changePercent: 0, volume: 0 };
    }
    const r = await fetch(`${AV}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${key}`);
    const d = await r.json();
    const gq = d?.["Global Quote"];
    if (!gq || !gq["05. price"]) return null;
    const price = parseFloat(gq["05. price"]);
    const previousClose = parseFloat(gq["08. previous close"] || "0");
    const volume = parseInt(gq["06. volume"] || "0", 10);
    const change = Math.round((price - previousClose) * 100) / 100;
    const changePercent = previousClose > 0 ? Math.round((change / previousClose) * 10000) / 100 : 0;
    return { symbol, price, previousClose, change, changePercent, volume };
  } catch { return null; }
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

    const key = Deno.env.get('ALPHA_VANTAGE_API_KEY')!;
    const sp = new URL(req.url).searchParams;
    const syms = sp.get('symbols');
    const sq = sp.get('search');

    if (syms) {
      const list = syms.split(',').slice(0, 30);
      const stocks = (await Promise.all(list.map(async (s) => {
        const priceData = await getPrice(s.trim().toUpperCase(), key);
        if (!priceData) return null;
        return { ...priceData, name: priceData.symbol, exchange: "", avgVolume: priceData.volume };
      }))).filter(Boolean);
      return new Response(JSON.stringify({ stocks }), { headers: { ...H, 'Content-Type': 'application/json' } });
    }

    if (sq && sq.length >= 1) {
      const sr = await fetch(`${AV}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(sq)}&apikey=${key}`);
      const data = await sr.json();
      const matches = (data?.bestMatches || []).slice(0, 8);
      const stocks = (await Promise.all(matches.map(async (m: Record<string, string>) => {
        const sym = m["1. symbol"];
        const priceData = await getPrice(sym, key);
        if (!priceData) return null;
        return { ...priceData, name: m["2. name"] || sym, exchange: m["4. region"] || "", avgVolume: priceData.volume };
      }))).filter(Boolean);
      return new Response(JSON.stringify({ stocks }), { headers: { ...H, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Provide ?symbols= or ?search=' }), { status: 400, headers: { ...H, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...H, 'Content-Type': 'application/json' } });
  }
});
