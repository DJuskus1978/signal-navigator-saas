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

    const fmpKey = Deno.env.get('FMP_API_KEY')!;
    // Fetch actual S&P 500 index (^GSPC) historical data from FMP for accurate values
    const r = await fetch(`https://financialmodelingprep.com/api/v3/historical-price-full/%5EGSPC?apikey=${fmpKey}`);
    const d = await r.json();
    const historical = d?.historical;
    if (!Array.isArray(historical) || historical.length === 0) return j({ error: 'No data from provider' }, 502);

    // FMP returns newest first — sort oldest first
    const entries = historical
      .map((item: any) => ({ date: item.date, close: item.close }))
      .sort((a: any, b: any) => a.date.localeCompare(b.date));

    const MA_WINDOW = 125;
    const closes = entries.map((e: any) => e.close);
    
    // Show ~150 trading days (~7 months)
    const displayDays = 150;
    const chartData = entries.slice(-displayDays).map((entry: any) => {
      const fullIdx = entries.indexOf(entry);
      const start = Math.max(0, fullIdx - MA_WINDOW + 1);
      const slice = closes.slice(start, fullIdx + 1);
      const ma = slice.reduce((a: number, b: number) => a + b, 0) / slice.length;
      return {
        date: entry.date,
        close: Math.round(entry.close * 100) / 100,
        ma: Math.round(ma * 100) / 100,
      };
    });

    const latest = entries[entries.length - 1];
    const latestSP500 = latest.close;
    const maValue = chartData[chartData.length - 1]?.ma ?? latestSP500;
    
    // Sentiment: matching Revolut-style logic with narrow Neutral zone (±0.5%)
    const diff = (latestSP500 - maValue) / maValue;
    let sentiment: string;
    let gaugeValue: number; // 0-100, 50 = neutral
    if (diff > 0.03) { sentiment = "Bullish"; gaugeValue = 85; }
    else if (diff > 0.005) { sentiment = "Bullish"; gaugeValue = 65; }
    else if (diff > -0.005) { sentiment = "Neutral"; gaugeValue = 50; }
    else if (diff > -0.03) { sentiment = "Bearish"; gaugeValue = 35; }
    else { sentiment = "Bearish"; gaugeValue = 15; }

    const result = {
      sentiment,
      gaugeValue,
      currentPrice: Math.round(latestSP500 * 100) / 100,
      ma: Math.round(maValue * 100) / 100,
      chartData,
    };

    cacheSet(cacheKey, result, 3600); // 1-hour cache
    return j(result);
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
});
