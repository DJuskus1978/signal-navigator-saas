import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TWELVE_DATA_BASE = "https://api.twelvedata.com";

interface QuoteData {
  symbol: string;
  name: string;
  exchange: string;
  close: string;
  previous_close: string;
  change: string;
  percent_change: string;
  volume: string;
  average_volume: string;
  fifty_two_week: {
    low: string;
    high: string;
  };
}

interface TechnicalData {
  rsi?: number;
  macd?: number;
  macd_signal?: number;
  sma50?: number;
  sma200?: number;
  ema20?: number;
  bbands_upper?: number;
  bbands_lower?: number;
  atr?: number;
}

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchTechnicalIndicator(symbol: string, indicator: string, apiKey: string, params = ""): Promise<any> {
  const url = `${TWELVE_DATA_BASE}/${indicator}?symbol=${symbol}&interval=1day&outputsize=1${params}&apikey=${apiKey}`;
  const data = await fetchJSON(url);
  if (data.status === "error") {
    console.error(`Error fetching ${indicator} for ${symbol}:`, data.message);
    return null;
  }
  return data;
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

    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols');
    const singleSymbol = searchParams.get('symbol');

    // Single stock detail mode
    if (singleSymbol) {
      const symbol = singleSymbol.toUpperCase();
      
      // Fetch quote + technicals in parallel
      const [quoteData, rsiData, macdData, sma50Data, sma200Data, ema20Data, bbandsData, atrData] = await Promise.all([
        fetchJSON(`${TWELVE_DATA_BASE}/quote?symbol=${symbol}&apikey=${apiKey}`),
        fetchTechnicalIndicator(symbol, 'rsi', apiKey),
        fetchTechnicalIndicator(symbol, 'macd', apiKey),
        fetchTechnicalIndicator(symbol, 'sma', apiKey, '&time_period=50'),
        fetchTechnicalIndicator(symbol, 'sma', apiKey, '&time_period=200'),
        fetchTechnicalIndicator(symbol, 'ema', apiKey, '&time_period=20'),
        fetchTechnicalIndicator(symbol, 'bbands', apiKey),
        fetchTechnicalIndicator(symbol, 'atr', apiKey),
      ]);

      if (quoteData.status === 'error') {
        return new Response(JSON.stringify({ error: quoteData.message || 'Failed to fetch quote' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const result = {
        symbol,
        name: quoteData.name,
        exchange: quoteData.exchange,
        price: parseFloat(quoteData.close),
        previousClose: parseFloat(quoteData.previous_close),
        change: parseFloat(quoteData.change),
        changePercent: parseFloat(quoteData.percent_change),
        volume: parseInt(quoteData.volume) || 0,
        avgVolume: parseInt(quoteData.average_volume) || 0,
        technical: {
          rsi: rsiData?.values?.[0]?.rsi ? parseFloat(rsiData.values[0].rsi) : null,
          macd: macdData?.values?.[0]?.macd ? parseFloat(macdData.values[0].macd) : null,
          macdSignal: macdData?.values?.[0]?.macd_signal ? parseFloat(macdData.values[0].macd_signal) : null,
          sma50: sma50Data?.values?.[0]?.sma ? parseFloat(sma50Data.values[0].sma) : null,
          sma200: sma200Data?.values?.[0]?.sma ? parseFloat(sma200Data.values[0].sma) : null,
          ema20: ema20Data?.values?.[0]?.ema ? parseFloat(ema20Data.values[0].ema) : null,
          bollingerUpper: bbandsData?.values?.[0]?.upper_band ? parseFloat(bbandsData.values[0].upper_band) : null,
          bollingerLower: bbandsData?.values?.[0]?.lower_band ? parseFloat(bbandsData.values[0].lower_band) : null,
          atr: atrData?.values?.[0]?.atr ? parseFloat(atrData.values[0].atr) : null,
        },
      };

      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Batch quote mode for dashboard
    if (symbolsParam) {
      const symbols = symbolsParam.split(',').slice(0, 12); // limit to 12 per call
      const batchSymbols = symbols.join(',');
      
      const quoteUrl = `${TWELVE_DATA_BASE}/quote?symbol=${batchSymbols}&apikey=${apiKey}`;
      const quoteData = await fetchJSON(quoteUrl);

      const results: any[] = [];

      // Handle both single and batch responses
      const quotes = symbols.length === 1 ? { [symbols[0]]: quoteData } : quoteData;

      for (const sym of symbols) {
        const q = quotes[sym];
        if (!q || q.status === 'error') {
          console.error(`Quote error for ${sym}:`, q?.message);
          continue;
        }
        results.push({
          symbol: sym,
          name: q.name || sym,
          exchange: q.exchange || '',
          price: parseFloat(q.close) || 0,
          previousClose: parseFloat(q.previous_close) || 0,
          change: parseFloat(q.change) || 0,
          changePercent: parseFloat(q.percent_change) || 0,
          volume: parseInt(q.volume) || 0,
          avgVolume: parseInt(q.average_volume) || 0,
        });
      }

      return new Response(JSON.stringify({ stocks: results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Provide ?symbols=AAPL,MSFT or ?symbol=AAPL' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
