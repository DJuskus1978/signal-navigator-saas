import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const sp = new URL(req.url).searchParams;
    const syms = sp.get('symbols');
    const sq = sp.get('search');
    const assetType = sp.get('type'); // "crypto" or default stock

    // Batch quotes
    if (syms) {
      const list = syms.split(',').slice(0, 30);
      const stocks = (await Promise.all(list.map(async (s) => {
        try {
          const sym = s.trim().toUpperCase();
          const isCrypto = sym.endsWith("USD") && sym.length <= 10;

          let price = 0, previousClose = 0, volume = 0, name = sym;

          if (isCrypto) {
            // Use CURRENCY_EXCHANGE_RATE for crypto
            const fromCurrency = sym.replace("USD", "");
            const r = await fetch(`${AV}?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=USD&apikey=${key}`);
            const d = await r.json();
            const rate = d?.["Realtime Currency Exchange Rate"];
            if (!rate) return null;
            price = parseFloat(rate["5. Exchange Rate"] || "0");
            name = rate["2. From_Currency Name"] || sym;
            previousClose = price; // AV doesn't give previous close for crypto in this endpoint
          } else {
            // Use GLOBAL_QUOTE for stocks
            const r = await fetch(`${AV}?function=GLOBAL_QUOTE&symbol=${sym}&apikey=${key}`);
            const d = await r.json();
            const gq = d?.["Global Quote"];
            if (!gq || !gq["05. price"]) return null;
            price = parseFloat(gq["05. price"]);
            previousClose = parseFloat(gq["08. previous close"] || "0");
            volume = parseInt(gq["06. volume"] || "0", 10);
          }

          const change = Math.round((price - previousClose) * 100) / 100;
          const changePercent = previousClose > 0 ? Math.round((change / previousClose) * 10000) / 100 : 0;

          return { symbol: sym, name, price, previousClose, change, changePercent, volume, avgVolume: volume, exchange: "" };
        } catch { return null; }
      }))).filter(Boolean);
      return j({ stocks });
    }

    // Search
    if (sq && sq.length >= 1) {
      const isCryptoSearch = assetType === "crypto";

      if (isCryptoSearch) {
        // For crypto search, use a predefined list since AV search doesn't cover crypto well
        const cryptoMap: Record<string, string> = {
          BTCUSD: "Bitcoin", ETHUSD: "Ethereum", BNBUSD: "BNB", SOLUSD: "Solana",
          XRPUSD: "XRP", ADAUSD: "Cardano", DOGEUSD: "Dogecoin", AVAXUSD: "Avalanche",
          DOTUSD: "Polkadot", MATICUSD: "Polygon",
        };
        const q = sq.toUpperCase();
        const matched = Object.entries(cryptoMap)
          .filter(([k, v]) => k.includes(q) || v.toUpperCase().includes(q))
          .slice(0, 8);

        const stocks = (await Promise.all(matched.map(async ([sym, name]) => {
          try {
            const fromCurrency = sym.replace("USD", "");
            const r = await fetch(`${AV}?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=USD&apikey=${key}`);
            const d = await r.json();
            const rate = d?.["Realtime Currency Exchange Rate"];
            if (!rate) return null;
            const price = parseFloat(rate["5. Exchange Rate"] || "0");
            return { symbol: sym, name, price, previousClose: price, change: 0, changePercent: 0, volume: 0, avgVolume: 0, exchange: "CRYPTO" };
          } catch { return null; }
        }))).filter(Boolean);
        return j({ stocks });
      }

      // Stock search via SYMBOL_SEARCH
      const sr = await fetch(`${AV}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(sq)}&apikey=${key}`);
      const data = await sr.json();
      const matches = (data?.bestMatches || []).slice(0, 8);

      const stocks = (await Promise.all(matches.map(async (m: Record<string, string>) => {
        try {
          const sym = m["1. symbol"];
          const name = m["2. name"] || sym;
          const exchange = m["4. region"] || "";
          const r = await fetch(`${AV}?function=GLOBAL_QUOTE&symbol=${sym}&apikey=${key}`);
          const d = await r.json();
          const gq = d?.["Global Quote"];
          if (!gq || !gq["05. price"]) return null;
          const price = parseFloat(gq["05. price"]);
          const previousClose = parseFloat(gq["08. previous close"] || "0");
          const volume = parseInt(gq["06. volume"] || "0", 10);
          const change = Math.round((price - previousClose) * 100) / 100;
          const changePercent = previousClose > 0 ? Math.round((change / previousClose) * 10000) / 100 : 0;
          return { symbol: sym, name, price, previousClose, change, changePercent, volume, avgVolume: volume, exchange };
        } catch { return null; }
      }))).filter(Boolean);
      return j({ stocks });
    }

    return j({ error: 'Provide ?symbols= or ?search=' }, 400);
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
});
