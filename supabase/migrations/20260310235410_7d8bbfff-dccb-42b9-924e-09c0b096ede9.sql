
-- Portfolio snapshots table for live AI performance tracking
CREATE TABLE public.portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  portfolio_value numeric NOT NULL,
  initial_value numeric NOT NULL DEFAULT 100000,
  holdings jsonb NOT NULL DEFAULT '[]'::jsonb,
  benchmark_sp500 numeric,
  benchmark_nasdaq numeric,
  benchmark_sp500_initial numeric,
  benchmark_nasdaq_initial numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(snapshot_date)
);

-- Public read access (no RLS needed - this is public performance data)
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read portfolio snapshots"
ON public.portfolio_snapshots
FOR SELECT
TO public
USING (true);

-- Only service role can insert/update (edge function)
CREATE POLICY "Service role can manage snapshots"
ON public.portfolio_snapshots
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
