import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (_req) => {
  try {
    const key = Deno.env.get('FMP_API_KEY');
    // Test both endpoint styles
    const [stableRes, v3Res] = await Promise.all([
      fetch(`https://financialmodelingprep.com/stable/quote?symbol=AAPL&apikey=${key}`).then(r => r.json()).catch(e => ({ error: String(e) })),
      fetch(`https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=${key}`).then(r => r.json()).catch(e => ({ error: String(e) })),
    ]);
    return new Response(JSON.stringify({ stable: stableRes, v3: v3Res }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
