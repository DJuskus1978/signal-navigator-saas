import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (_req) => {
  try {
    const avKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');

    // Test Alpha Vantage connectivity
    const tests = {
      global_quote: `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${avKey}`,
      rsi: `https://www.alphavantage.co/query?function=RSI&symbol=AAPL&interval=daily&time_period=14&series_type=close&apikey=${avKey}`,
      overview: `https://www.alphavantage.co/query?function=OVERVIEW&symbol=AAPL&apikey=${avKey}`,
    };

    const results: Record<string, unknown> = {};

    await Promise.all(
      Object.entries(tests).map(async ([name, url]) => {
        try {
          const r = await fetch(url);
          const text = await r.text();
          let parsed;
          try { parsed = JSON.parse(text); } catch { parsed = text.slice(0, 200); }
          if (r.status === 200 && !parsed?.Note && !parsed?.Information) {
            results[name] = { status: "✅ OK", sample: typeof parsed === 'object' ? Object.keys(parsed).slice(0, 3) : parsed };
          } else {
            const msg = parsed?.Note || parsed?.Information || parsed?.["Error Message"] || 'unknown';
            results[name] = { status: `⚠️ ${r.status}`, reason: typeof msg === 'string' ? msg.slice(0, 120) : 'blocked' };
          }
        } catch (e) {
          results[name] = { status: "💥 ERROR", error: String(e).slice(0, 100) };
        }
      })
    );

    return new Response(JSON.stringify({ provider: "Alpha Vantage", ...results }, null, 2), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
