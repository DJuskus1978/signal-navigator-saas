import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SB_URL = () => Deno.env.get('SUPABASE_URL')!;
const SB_KEY = () => Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function cacheGet(key: string): Promise<unknown | null> {
  try {
    const r = await fetch(
      `${SB_URL()}/rest/v1/stock_cache?cache_key=eq.${encodeURIComponent(key)}&select=data,expires_at&limit=1`,
      { headers: { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}` } }
    );
    const rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    if (new Date(rows[0].expires_at) < new Date()) return null;
    return rows[0].data;
  } catch { return null; }
}

async function cacheSet(key: string, data: unknown, ttlSeconds: number) {
  try {
    const expires_at = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    await fetch(`${SB_URL()}/rest/v1/stock_cache`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}`,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ cache_key: key, data, expires_at, fetched_at: new Date().toISOString() }),
    });
  } catch { /* silent */ }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: H });
  const j = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...H, 'Content-Type': 'application/json' } });

  try {
    // Auth check
    const ah = req.headers.get('Authorization');
    if (!ah?.startsWith('Bearer ')) return j({ error: 'Unauthorized' }, 401);
    const ur = await fetch(`${SB_URL()}/auth/v1/user`, { headers: { Authorization: ah, apikey: Deno.env.get('SUPABASE_ANON_KEY')! } });
    if (!ur.ok) return j({ error: 'Unauthorized' }, 401);

    const cacheKey = 'market-sentiment:spy-daily';
    const cached = await cacheGet(cacheKey);
    if (cached) return j(cached);

    const avKey = Deno.env.get('ALPHA_VANTAGE_API_KEY')!;

    // Fetch SPY daily data from Alpha Vantage (full history for 125-day MA)
    const r = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=SPY&outputsize=full&apikey=${avKey}`
    );
    const d = await r.json();
    const timeSeries = d?.["Time Series (Daily)"];

    if (!timeSeries || Object.keys(timeSeries).length === 0) {
      console.error('[SENTIMENT] Alpha Vantage returned no data:', JSON.stringify(d).slice(0, 300));
      return j({ error: 'No data from provider' }, 502);
    }

    // Convert to sorted array (oldest first)
    const entries = Object.entries(timeSeries)
      .map(([date, vals]: [string, any]) => ({
        date,
        close: parseFloat(vals["4. close"]),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // SPY trades at ~1/10th of S&P 500 — multiply to approximate index value
    const SPY_MULTIPLIER = 10;
    const MA_WINDOW = 125;
    const closes = entries.map(e => e.close);

    // Show ~150 trading days (~7 months)
    const displayDays = 150;
    const startIdx = Math.max(0, entries.length - displayDays);
    const chartData = [];
    for (let i = startIdx; i < entries.length; i++) {
      const start = Math.max(0, i - MA_WINDOW + 1);
      const slice = closes.slice(start, i + 1);
      const ma = slice.reduce((a, b) => a + b, 0) / slice.length;
      chartData.push({
        date: entries[i].date,
        close: Math.round(entries[i].close * SPY_MULTIPLIER * 100) / 100,
        ma: Math.round(ma * SPY_MULTIPLIER * 100) / 100,
      });
    }

    const latest = entries[entries.length - 1];
    const latestSP500 = latest.close * SPY_MULTIPLIER;
    const maValue = chartData[chartData.length - 1]?.ma ?? latestSP500;

    // Sentiment logic — aligned with industry convention:
    // Price near or above MA = bullish (the trend is intact)
    // Only clearly below MA = bearish
    const diff = (latestSP500 - maValue) / maValue;
    let sentiment: string;
    let gaugeValue: number;
    if (diff > 0.03) { sentiment = "Bullish"; gaugeValue = 90; }
    else if (diff > 0.01) { sentiment = "Bullish"; gaugeValue = 75; }
    else if (diff > -0.01) { sentiment = "Bullish"; gaugeValue = 60; }
    else if (diff > -0.03) { sentiment = "Neutral"; gaugeValue = 45; }
    else if (diff > -0.06) { sentiment = "Bearish"; gaugeValue = 30; }
    else { sentiment = "Bearish"; gaugeValue = 15; }

    const result = {
      sentiment,
      gaugeValue,
      currentPrice: Math.round(latestSP500 * 100) / 100,
      ma: Math.round(maValue * 100) / 100,
      chartData,
    };

    cacheSet(cacheKey, result, 3600);
    console.log('[SENTIMENT] Success (Alpha Vantage SPY):', { sentiment, price: result.currentPrice, ma: result.ma });
    return j(result);
  } catch (e) {
    console.error('[SENTIMENT] Error:', String(e));
    return j({ error: String(e) }, 500);
  }
});
