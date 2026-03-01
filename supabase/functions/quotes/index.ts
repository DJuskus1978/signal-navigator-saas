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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CH });
  try {
    const ah = req.headers.get('Authorization');
    if (!ah?.startsWith('Bearer ')) return j({ error: 'Unauthorized' }, 401);
    if (!(await au(ah))) return j({ error: 'Unauthorized' }, 401);
    const key = Deno.env.get('FMP_API_KEY')!;
    if (!key) return j({ error: 'FMP key missing' }, 500);
    const sp = new URL(req.url).searchParams;
    const syms = sp.get('symbols');
    const sq = sp.get('search');
    const tf = sp.get('type');

    if (syms) {
      const sl = syms.split(',').slice(0,30);
      const ck = `batch:${sl.sort().join(',')}`;
      const cc = await cG(ck); if (cc) return j(cc);
      const stocks = (await Promise.all(sl.map(s => fm(`/stable/quote?symbol=${s.trim()}`,key).then(d=>{const q=F(d);if(!q?.symbol)return null;return{symbol:q.symbol,name:q.name||q.symbol,exchange:q.exchange||'',price:q.price??0,previousClose:q.previousClose??0,change:q.change??0,changePercent:q.changesPercentage??q.changePercentage??0,volume:q.volume??0,avgVolume:q.avgVolume??q.volume??0}}).catch(()=>null)))).filter(Boolean);
      const rd={stocks}; await cS(ck,rd,5); return j(rd);
    }

    if (sq && sq.length>=1) {
      const ic=tf==="crypto";
      const ck=`search:${ic?"crypto:":""}${sq.toLowerCase()}`;
      const cc=await cG(ck); if(cc) return j(cc);
      const sr=await fm(`/stable/search-symbol?query=${encodeURIComponent(sq)}&limit=${ic?30:10}`,key).catch(()=>[]);
      const all=Array.isArray(sr)?sr:[];
      const seen=new Set<string>(); const items:Record<string,unknown>[]=[];
      for(const i of all){if(i?.symbol&&!seen.has(i.symbol)){seen.add(i.symbol);items.push(i)}}
      let fi:Record<string,unknown>[];
      if(ic){fi=items.filter(i=>{const s=String(i.symbol||"").toUpperCase();const t=String(i.type||"").toLowerCase();const e=String(i.exchangeShortName||i.exchange||"").toUpperCase();return t==="crypto"||e.includes("CRYPTO")||e==="CCC"||s.endsWith("USD")||s.endsWith("USDT")}).slice(0,12)}
      else{fi=items.filter(i=>i.type==="stock"||i.type==="crypto"||!i.type).slice(0,8)}
      if(!fi.length) return j({stocks:[]});
      const stocks=(await Promise.all(fi.map(i=>fm(`/stable/quote?symbol=${String(i.symbol)}`,key).then(d=>{const q=F(d);if(!q?.symbol)return null;return{symbol:q.symbol,name:q.name||i.name||q.symbol,exchange:q.exchange||i.exchangeShortName||'',price:q.price??0,previousClose:q.previousClose??0,change:q.change??0,changePercent:q.changesPercentage??q.changePercentage??0,volume:q.volume??0,avgVolume:q.volume??0}}).catch(()=>null)))).filter(Boolean);
      const rd={stocks}; await cS(ck,rd,3); return j(rd);
    }
    return j({error:'Provide ?symbols= or ?search='},400);
  } catch(e:unknown){const m=e instanceof Error?e.message:String(e);console.error('err:',m);return j({error:m},500)}
});
