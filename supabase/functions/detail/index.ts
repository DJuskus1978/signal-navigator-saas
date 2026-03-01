import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const CH = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const FMP = "https://financialmodelingprep.com";

function j(b: unknown, s = 200) { return new Response(JSON.stringify(b), { status: s, headers: { ...CH, 'Content-Type': 'application/json' } }); }

async function au(h: string) {
  const r = await fetch(`${Deno.env.get('SUPABASE_URL')!}/auth/v1/user`, { headers: { Authorization: h, apikey: Deno.env.get('SUPABASE_ANON_KEY')! } });
  if (!r.ok) { await r.text(); return null; }
  const u = await r.json(); return u?.id ? u : null;
}

async function cG(k: string) {
  try {
    const r = await fetch(`${Deno.env.get('SUPABASE_URL')!}/rest/v1/stock_cache?cache_key=eq.${encodeURIComponent(k)}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=data&limit=1`, { headers: { apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}` } });
    if (!r.ok) { await r.text(); return null; } const rows = await r.json(); return rows?.[0]?.data ?? null;
  } catch { return null; }
}

async function cS(k: string, v: unknown, m: number) {
  try {
    const n = new Date();
    const r = await fetch(`${Deno.env.get('SUPABASE_URL')!}/rest/v1/stock_cache`, { method: 'POST', headers: { apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ cache_key: k, data: v, fetched_at: n.toISOString(), expires_at: new Date(n.getTime()+m*60000).toISOString() }) });
    await r.text();
  } catch { /* ok */ }
}

async function fm(p: string, k: string) {
  const s = p.includes("?") ? "&" : "?";
  const r = await fetch(`${FMP}${p}${s}apikey=${k}`);
  if (!r.ok) { const b = await r.text(); console.error(`FMP ${r.status}: ${b.substring(0,200)}`); throw new Error(`FMP ${r.status}`); }
  return r.json();
}

// deno-lint-ignore no-explicit-any
const F = (v: any) => Array.isArray(v) ? v[0] ?? null : v;

function gs(g: string): number {
  const l = g.toLowerCase();
  if (l.includes("strong buy")||l.includes("top pick")) return 5;
  if (l.includes("outperform")||l.includes("overweight")||l.includes("buy")) return 4;
  if (l.includes("hold")||l.includes("neutral")||l.includes("equal")||l.includes("market perform")) return 3;
  if (l.includes("underperform")||l.includes("underweight")||l.includes("reduce")) return 2;
  if (l.includes("sell")) return 1;
  return 3;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CH });
  try {
    const ah = req.headers.get('Authorization');
    if (!ah?.startsWith('Bearer ')) return j({ error: 'Unauthorized' }, 401);
    if (!(await au(ah))) return j({ error: 'Unauthorized' }, 401);
    const key = Deno.env.get('FMP_API_KEY')!;
    if (!key) return j({ error: 'FMP key missing' }, 500);
    const S = (new URL(req.url).searchParams.get('symbol') || '').toUpperCase();
    if (!S) return j({ error: 'Provide ?symbol=AAPL' }, 400);

    const ck = `detail:${S}`;
    const cc = await cG(ck); if (cc) return j(cc);
    const ic = S.endsWith("USD") && S.length <= 10;

    const r = await Promise.all([
      fm(`/stable/quote?symbol=${S}`,key),
      fm(`/stable/technical-indicators/rsi?symbol=${S}&period=14`,key).catch(()=>[]),
      fm(`/stable/technical-indicators/sma?symbol=${S}&period=50`,key).catch(()=>[]),
      fm(`/stable/technical-indicators/sma?symbol=${S}&period=200`,key).catch(()=>[]),
      fm(`/stable/technical-indicators/ema?symbol=${S}&period=20`,key).catch(()=>[]),
      fm(`/stable/technical-indicators/ema?symbol=${S}&period=12`,key).catch(()=>[]),
      fm(`/stable/technical-indicators/ema?symbol=${S}&period=26`,key).catch(()=>[]),
      ic?Promise.resolve([]):fm(`/stable/key-metrics?symbol=${S}&limit=1`,key).catch(()=>[]),
      ic?Promise.resolve([]):fm(`/stable/income-statement-growth?symbol=${S}&limit=1`,key).catch(()=>[]),
      fm(`/stable/news/stock?symbols=${S}&limit=20`,key).catch(()=>[]),
      ic?Promise.resolve([]):fm(`/stable/grades?symbol=${S}&limit=10`,key).catch(()=>[]),
      ic?Promise.resolve([]):fm(`/stable/price-target-consensus?symbol=${S}`,key).catch(()=>[]),
      ic?Promise.resolve([]):fm(`/stable/upgrades-downgrades-consensus?symbol=${S}`,key).catch(()=>[]),
    ]);

    const q=F(r[0]); if(!q||q.error) return j({error:q?.error||'No data'},400);
    const e12=F(r[5]),e26=F(r[6]);
    const macd=(e12?.ema!=null&&e26?.ema!=null)?e12.ema-e26.ema:null;
    const km=F(r[7]),gr=F(r[8]);
    const news=Array.isArray(r[9])?r[9]:[];
    const grades=Array.isArray(r[10])?r[10]:[];
    const ptD=F(r[11]),csD=F(r[12]);
    const ad:Record<string,unknown>={};
    if(ptD?.targetConsensus){ad.priceTarget={targetHigh:ptD.targetHigh??null,targetLow:ptD.targetLow??null,targetConsensus:ptD.targetConsensus??null,targetMedian:ptD.targetMedian??null,totalAnalysts:ptD.totalAnalysts??0}}
    if(csD?.consensus){ad.consensus=csD.consensus;ad.ratingsDistribution={strongBuy:csD.strongBuy??0,buy:csD.buy??0,hold:csD.hold??0,sell:csD.sell??0,strongSell:csD.strongSell??0,totalAnalysts:(csD.strongBuy??0)+(csD.buy??0)+(csD.hold??0)+(csD.sell??0)+(csD.strongSell??0)}}
    const gl=grades.slice(0,10);
    const ar=gl.length?Math.round(gl.reduce((a:number,g:Record<string,unknown>)=>a+gs(String(g.newGrade||"")),0)/gl.length*10)/10:3;
    let ia=0;if(gl.length){for(const g of gl){if(g.action==="upgrade")ia++;else if(g.action==="downgrade")ia--}ia=Math.max(-1,Math.min(1,ia/gl.length))}
    const p=q.price??0;
    const res={
      symbol:S,name:q.name||S,exchange:q.exchange||'',price:p,previousClose:q.previousClose??0,
      change:q.change??0,changePercent:q.changesPercentage??q.changePercentage??0,
      volume:q.volume??0,avgVolume:q.avgVolume??q.volume??0,
      technical:{rsi:F(r[1])?.rsi??null,macd,macdSignal:macd!=null?macd*0.8:null,sma50:F(r[2])?.sma??null,sma200:F(r[3])?.sma??null,ema20:F(r[4])?.ema??null,bollingerUpper:null,bollingerLower:null,atr:null},
      fundamental:{peRatio:q.pe??km?.peRatio??null,forwardPE:km?.forwardPeRatio??null,earningsGrowth:gr?.growthNetIncome!=null?gr.growthNetIncome*100:null,debtToEquity:km?.debtToEquity??null,revenueGrowth:gr?.growthRevenue!=null?gr.growthRevenue*100:null,profitMargin:km?.netIncomePerRevenue!=null?km.netIncomePerRevenue*100:null,returnOnEquity:km?.roe!=null?km.roe*100:null,freeCashFlowYield:km?.freeCashFlowYield!=null?km.freeCashFlowYield*100:null},
      sentiment:{newsCount:news.length,analystRating:ar,insiderActivity:ia,headline:news[0]?.title||`${q.name||S} at $${p.toFixed(2)}`,recentNews:news.slice(0,5).map((n:Record<string,string>)=>({title:n.title,publisher:n.publisher||n.site,date:n.publishedDate})),grades:grades.slice(0,5).map((g:Record<string,string>)=>({company:g.gradingCompany,grade:g.newGrade,action:g.action,date:g.date}))},
      analystData:Object.keys(ad).length?ad:null,
    };
    await cS(ck,res,2);
    return j(res);
  } catch(e:unknown){const m=e instanceof Error?e.message:String(e);console.error('err:',m);return j({error:m},500)}
});
