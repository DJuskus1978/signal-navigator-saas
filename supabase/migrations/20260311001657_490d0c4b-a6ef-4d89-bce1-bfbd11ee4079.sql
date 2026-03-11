ALTER TABLE public.portfolio_snapshots 
ADD COLUMN IF NOT EXISTS benchmark_dow numeric,
ADD COLUMN IF NOT EXISTS benchmark_dow_initial numeric;