
-- Cache table for FMP API responses (shared across all users)
CREATE TABLE public.stock_cache (
  cache_key TEXT NOT NULL PRIMARY KEY,
  data JSONB NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Index for TTL cleanup
CREATE INDEX idx_stock_cache_expires ON public.stock_cache (expires_at);

-- No RLS needed — this is server-side only (edge functions use service role)
-- But enable RLS and deny all client access for safety
ALTER TABLE public.stock_cache ENABLE ROW LEVEL SECURITY;

-- No policies = no client access. Only service role can read/write.
