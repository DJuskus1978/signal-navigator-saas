
-- Stores the current adaptive scoring parameters (weights, thresholds, sub-score multipliers)
CREATE TABLE public.scoring_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  param_key text UNIQUE NOT NULL,
  param_value numeric NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  optimization_round integer NOT NULL DEFAULT 0
);

-- Seed with default parameters matching the current hardcoded values
INSERT INTO public.scoring_parameters (param_key, param_value, description) VALUES
  -- Phase weights
  ('weight_fundamental', 0.40, 'Weight for fundamentals phase (0-1)'),
  ('weight_sentiment',   0.25, 'Weight for sentiment phase (0-1)'),
  ('weight_technical',   0.35, 'Weight for technicals phase (0-1)'),
  -- Recommendation thresholds
  ('threshold_strong_buy', 60, 'Score >= this → strong-buy'),
  ('threshold_buy',        30, 'Score >= this → buy'),
  ('threshold_hold',        5, 'Score >= this → hold'),
  ('threshold_dont_buy',  -15, 'Score >= this → dont-buy, else sell'),
  -- P/E sub-score thresholds
  ('pe_excellent',  12, 'P/E below this → max fundamental bonus'),
  ('pe_good',       18, 'P/E below this → good bonus'),
  ('pe_fair',       25, 'P/E below this → small bonus'),
  ('pe_high',       35, 'P/E below this → small penalty, else large penalty'),
  -- Fundamental sub-score values
  ('fund_pe_excellent_score', 25, 'Score for excellent P/E'),
  ('fund_pe_good_score',      15, 'Score for good P/E'),
  ('fund_pe_fair_score',       5, 'Score for fair P/E'),
  ('fund_pe_high_score',      -5, 'Score for high P/E'),
  ('fund_pe_very_high_score',-15, 'Score for very high P/E'),
  ('fund_pe_multiplier',       2, 'Multiplier since only P/E available'),
  -- Sentiment volume-price thresholds
  ('sent_vol_surge',     2.0, 'Volume ratio for strong bullish signal'),
  ('sent_vol_high',      1.5, 'Volume ratio for moderate bullish signal'),
  ('sent_vol_above_avg', 1.2, 'Volume ratio for slight bullish'),
  ('sent_vol_normal',    0.8, 'Volume ratio below this → bearish'),
  -- Technical momentum thresholds
  ('tech_strong_bull',  3.0, 'Change% for strong bullish momentum'),
  ('tech_bull',         1.5, 'Change% for bullish momentum'),
  ('tech_slight_bull',  0.3, 'Change% for slight bullish'),
  ('tech_slight_bear', -0.3, 'Change% for slight bearish'),
  ('tech_bear',        -1.5, 'Change% for bearish'),
  ('tech_strong_bear', -3.0, 'Change% for strong bearish');

-- Track individual trade outcomes for learning
CREATE TABLE public.trade_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  exchange text NOT NULL,
  entry_date date NOT NULL,
  entry_price numeric NOT NULL,
  exit_date date,
  exit_price numeric,
  shares numeric NOT NULL,
  entry_score integer NOT NULL,
  entry_recommendation text NOT NULL,
  exit_score integer,
  exit_recommendation text,
  realized_pnl numeric,
  realized_pnl_pct numeric,
  holding_days integer,
  is_open boolean NOT NULL DEFAULT true,
  params_version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for analysis queries
CREATE INDEX idx_trade_history_closed ON public.trade_history (is_open, exit_date);
CREATE INDEX idx_trade_history_ticker ON public.trade_history (ticker);
CREATE INDEX idx_trade_history_params ON public.trade_history (params_version);

-- Optimization log to track each learning iteration
CREATE TABLE public.optimization_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number integer NOT NULL,
  trades_analyzed integer NOT NULL,
  win_rate numeric,
  avg_return_pct numeric,
  avg_winner_pct numeric,
  avg_loser_pct numeric,
  parameter_changes jsonb NOT NULL DEFAULT '[]',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: public read, service_role write (same pattern as portfolio_snapshots)
ALTER TABLE public.scoring_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scoring parameters" ON public.scoring_parameters FOR SELECT TO public USING (true);
CREATE POLICY "Service role can manage scoring parameters" ON public.scoring_parameters FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read trade history" ON public.trade_history FOR SELECT TO public USING (true);
CREATE POLICY "Service role can manage trade history" ON public.trade_history FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read optimization log" ON public.optimization_log FOR SELECT TO public USING (true);
CREATE POLICY "Service role can manage optimization log" ON public.optimization_log FOR ALL TO service_role USING (true) WITH CHECK (true);
