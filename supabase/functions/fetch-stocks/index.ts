import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FMP_BASE = "https://financialmodelingprep.com";

async function fmpFetch(path: string, apiKey: string) {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${FMP_BASE}${path}${separator}apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FMP ${res.status}: ${path}`);
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('FMP_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'FMP API key not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols');
    const singleSymbol = searchParams.get('symbol');

    // ─── Single stock detail: quote + technicals + fundamentals ───
    if (singleSymbol) {
      const symbol = singleSymbol.toUpperCase();

      const [quoteArr, rsiArr, macdArr, sma50Arr, sma200Arr, ema20Arr, keyMetricsArr, growthArr] = await Promise.all([
        fmpFetch(`/stable/quote?symbol=${symbol}`, apiKey),
        fmpFetch(`/stable/technical-indicators/rsi?symbol=${symbol}&periodLength=14&timeframe=1day`, apiKey).catch(() => []),
        fmpFetch(`/stable/technical-indicators/macd?symbol=${symbol}&timeframe=1day`, apiKey).catch(() => []),
        fmpFetch(`/stable/technical-indicators/sma?symbol=${symbol}&periodLength=50&timeframe=1day`, apiKey).catch(() => []),
        fmpFetch(`/stable/technical-indicators/sma?symbol=${symbol}&periodLength=200&timeframe=1day`, apiKey).catch(() => []),
        fmpFetch(`/stable/technical-indicators/ema?symbol=${symbol}&periodLength=20&timeframe=1day`, apiKey).catch(() => []),
        fmpFetch(`/stable/key-metrics?symbol=${symbol}&limit=1`, apiKey).catch(() => []),
        fmpFetch(`/stable/income-statement-growth?symbol=${symbol}&limit=1`, apiKey).catch(() => []),
      ]);

      const q = Array.isArray(quoteArr) ? quoteArr[0] : quoteArr;
      if (!q || q.error) {
        return new Response(JSON.stringify({ error: q?.error || 'No quote data' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const rsi0 = rsiArr?.[0];
      const macd0 = macdArr?.[0];
      const sma50_0 = sma50Arr?.[0];
      const sma200_0 = sma200Arr?.[0];
      const ema20_0 = ema20Arr?.[0];
      const km = keyMetricsArr?.[0];
      const gr = growthArr?.[0];

      const result = {
        symbol,
        name: q.name || symbol,
        exchange: q.exchange || '',
        price: q.price ?? 0,
        previousClose: q.previousClose ?? 0,
        change: q.change ?? 0,
        changePercent: q.changesPercentage ?? 0,
        volume: q.volume ?? 0,
        avgVolume: q.avgVolume ?? 0,
        technical: {
          rsi: rsi0?.rsi ?? null,
          macd: macd0?.macd ?? null,
          macdSignal: macd0?.signal ?? null,
          sma50: sma50_0?.sma ?? null,
          sma200: sma200_0?.sma ?? null,
          ema20: ema20_0?.ema ?? null,
          bollingerUpper: null, // will compute client-side or add later
          bollingerLower: null,
          atr: null,
        },
        fundamental: {
          peRatio: q.pe ?? km?.peRatio ?? null,
          forwardPE: km?.forwardPeRatio ?? null,
          earningsGrowth: gr?.growthNetIncome != null ? (gr.growthNetIncome * 100) : null,
          debtToEquity: km?.debtToEquity ?? null,
          revenueGrowth: gr?.growthRevenue != null ? (gr.growthRevenue * 100) : null,
          profitMargin: km?.netIncomePerRevenue != null ? (km.netIncomePerRevenue * 100) : null,
          returnOnEquity: km?.roe != null ? (km.roe * 100) : null,
          freeCashFlowYield: km?.freeCashFlowYield != null ? (km.freeCashFlowYield * 100) : null,
        },
      };

      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── Batch quote mode for dashboard ───
    if (symbolsParam) {
      const allSymbols = symbolsParam.split(',').slice(0, 24);
      // FMP /stable/quote supports comma-separated batch
      const batchSymbols = allSymbols.join(',');

      let quoteData;
      try {
        quoteData = await fmpFetch(`/stable/quote?symbol=${batchSymbols}`, apiKey);
      } catch (err) {
        console.error('FMP batch quote error:', err.message);
        return new Response(JSON.stringify({ error: err.message, stocks: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const quotes = Array.isArray(quoteData) ? quoteData : [quoteData];
      const stocks = quotes
        .filter((q: any) => q && !q.error && q.symbol)
        .map((q: any) => ({
          symbol: q.symbol,
          name: q.name || q.symbol,
          exchange: q.exchange || '',
          price: q.price ?? 0,
          previousClose: q.previousClose ?? 0,
          change: q.change ?? 0,
          changePercent: q.changesPercentage ?? 0,
          volume: q.volume ?? 0,
          avgVolume: q.avgVolume ?? 0,
        }));

      return new Response(JSON.stringify({ stocks }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Provide ?symbols=AAPL,MSFT or ?symbol=AAPL' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
