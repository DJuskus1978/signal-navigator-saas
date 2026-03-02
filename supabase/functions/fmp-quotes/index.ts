import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const FMP = "https://financialmodelingprep.com";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: H });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...H, 'Content-Type': 'application/json' },
      });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: supabaseKey },
    });
    if (!userRes.ok) {
      await userRes.text();
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...H, 'Content-Type': 'application/json' },
      });
    }
    const user = await userRes.json();
    if (!user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...H, 'Content-Type': 'application/json' },
      });
    }

    const fmpKey = Deno.env.get('FMP_API_KEY');
    const url = new URL(req.url);
    const symbols = url.searchParams.get('symbols');

    if (!symbols) {
      return new Response(JSON.stringify({ error: 'Provide ?symbols=' }), {
        status: 400, headers: { ...H, 'Content-Type': 'application/json' },
      });
    }

    const list = symbols.split(',').slice(0, 5);
    const stocks: unknown[] = [];

    for (const sym of list) {
      try {
        const r = await fetch(
          `${FMP}/stable/technical-indicators/rsi?symbol=${sym.trim()}&periodLength=14&timeframe=1day&apikey=${fmpKey}`
        );
        const d = await r.json();
        const arr = Array.isArray(d) ? d : [];
        const latest = arr[0];
        const prev = arr[1];
        if (latest?.close) {
          const price = latest.close;
          const previousClose = prev?.close ?? price;
          const change = Math.round((price - previousClose) * 100) / 100;
          const changePercent = previousClose > 0 ? Math.round((change / previousClose) * 10000) / 100 : 0;
          stocks.push({
            symbol: sym.trim().toUpperCase(),
            name: sym.trim().toUpperCase(),
            price,
            change,
            changePercent,
            volume: latest.volume ?? 0,
            avgVolume: latest.volume ?? 0,
          });
        }
      } catch {
        // skip failed symbol
      }
    }

    return new Response(JSON.stringify({ stocks }), {
      headers: { ...H, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...H, 'Content-Type': 'application/json' },
    });
  }
});
