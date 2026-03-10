import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// This function is deprecated - all data now comes from Alpha Vantage via get-quotes
const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: H });
  return new Response(JSON.stringify({ error: 'This endpoint is deprecated. All data is now sourced from Alpha Vantage via get-quotes.' }), {
    status: 410, headers: { ...H, 'Content-Type': 'application/json' },
  });
});
