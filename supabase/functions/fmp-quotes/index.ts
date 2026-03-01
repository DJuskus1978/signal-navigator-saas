import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user via Supabase Auth REST
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: supabaseKey },
    });
    if (!userRes.ok) {
      await userRes.text();
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const user = await userRes.json();
    if (!user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fmpKey = Deno.env.get('FMP_API_KEY');
    const url = new URL(req.url);
    const symbols = url.searchParams.get('symbols');

    if (!symbols) {
      return new Response(JSON.stringify({ error: 'Provide ?symbols=' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const list = symbols.split(',').slice(0, 5);
    const stocks: unknown[] = [];

    for (const sym of list) {
      try {
        const r = await fetch(
          `https://financialmodelingprep.com/stable/quote?symbol=${sym.trim()}&apikey=${fmpKey}`
        );
        const d = await r.json();
        const q = Array.isArray(d) ? d[0] : d;
        if (q?.symbol) {
          stocks.push({
            symbol: q.symbol,
            name: q.name || q.symbol,
            price: q.price ?? 0,
            change: q.change ?? 0,
            changePercent: q.changesPercentage ?? 0,
            volume: q.volume ?? 0,
            avgVolume: q.avgVolume ?? 0,
          });
        }
      } catch {
        // skip failed symbol
      }
    }

    return new Response(JSON.stringify({ stocks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
