import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (_req) => {
  try {
    const key = Deno.env.get('FMP_API_KEY');
    
    // Try different timeframe values for technical indicators
    const tests = {
      rsi_1day: `https://financialmodelingprep.com/stable/technical-indicators/rsi?symbol=AAPL&periodLength=14&timeframe=1day&apikey=${key}`,
      rsi_1D: `https://financialmodelingprep.com/stable/technical-indicators/rsi?symbol=AAPL&periodLength=14&timeframe=1D&apikey=${key}`,
      rsi_d: `https://financialmodelingprep.com/stable/technical-indicators/rsi?symbol=AAPL&periodLength=14&timeframe=d&apikey=${key}`,
      rsi_1hour: `https://financialmodelingprep.com/stable/technical-indicators/rsi?symbol=AAPL&periodLength=14&timeframe=1hour&apikey=${key}`,
      rsi_4hour: `https://financialmodelingprep.com/stable/technical-indicators/rsi?symbol=AAPL&periodLength=14&timeframe=4hour&apikey=${key}`,
      rsi_1min: `https://financialmodelingprep.com/stable/technical-indicators/rsi?symbol=AAPL&periodLength=14&timeframe=1min&apikey=${key}`,
      rsi_5min: `https://financialmodelingprep.com/stable/technical-indicators/rsi?symbol=AAPL&periodLength=14&timeframe=5min&apikey=${key}`,
      rsi_15min: `https://financialmodelingprep.com/stable/technical-indicators/rsi?symbol=AAPL&periodLength=14&timeframe=15min&apikey=${key}`,
    };

    const results: Record<string, unknown> = {};
    
    await Promise.all(
      Object.entries(tests).map(async ([name, url]) => {
        try {
          const r = await fetch(url);
          const text = await r.text();
          let parsed;
          try { parsed = JSON.parse(text); } catch { parsed = text.slice(0, 200); }
          if (r.status === 200) {
            const arr = Array.isArray(parsed) ? parsed : null;
            results[name] = { 
              status: "✅ OK", 
              count: arr?.length,
              sample: arr?.[0],
            };
          } else {
            const msg = parsed?.["Error Message"] || parsed?.error || parsed;
            results[name] = { status: `❌ ${r.status}`, reason: typeof msg === 'string' ? msg.slice(0, 80) : 'blocked' };
          }
        } catch (e) {
          results[name] = { status: "💥 ERROR", error: String(e).slice(0, 100) };
        }
      })
    );

    return new Response(JSON.stringify(results, null, 2), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
