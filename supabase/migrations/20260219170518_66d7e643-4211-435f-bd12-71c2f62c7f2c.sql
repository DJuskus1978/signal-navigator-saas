
-- Create subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('novice', 'day_trader', 'pro_day_trader', 'bull_trader');

-- Add subscription_tier column to profiles (default to novice for all users)
ALTER TABLE public.profiles
ADD COLUMN subscription_tier public.subscription_tier NOT NULL DEFAULT 'novice';

-- Add trial_started_at to track the 7-day free trial for novice users
ALTER TABLE public.profiles
ADD COLUMN trial_started_at timestamp with time zone DEFAULT now();

-- Update the check_and_increment_usage function to be tier-aware
CREATE OR REPLACE FUNCTION public.check_and_increment_usage(_user_id uuid, _daily_limit integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_count INTEGER;
  user_tier public.subscription_tier;
  tier_limit INTEGER;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier FROM public.profiles WHERE user_id = _user_id;

  -- Determine daily limit based on tier
  CASE user_tier
    WHEN 'bull_trader' THEN
      -- Unlimited: always allow, still track
      INSERT INTO public.api_usage (user_id, usage_date, call_count)
      VALUES (_user_id, CURRENT_DATE, 1)
      ON CONFLICT (user_id, usage_date)
      DO UPDATE SET call_count = api_usage.call_count + 1, updated_at = now();
      RETURN TRUE;
    WHEN 'pro_day_trader' THEN tier_limit := 50;
    WHEN 'day_trader' THEN tier_limit := 25;
    ELSE tier_limit := 2; -- novice
  END CASE;

  -- Check limit
  SELECT call_count INTO current_count
  FROM public.api_usage
  WHERE user_id = _user_id AND usage_date = CURRENT_DATE;

  IF current_count IS NULL THEN
    INSERT INTO public.api_usage (user_id, usage_date, call_count)
    VALUES (_user_id, CURRENT_DATE, 1);
    RETURN TRUE;
  ELSIF current_count < tier_limit THEN
    UPDATE public.api_usage
    SET call_count = call_count + 1, updated_at = now()
    WHERE user_id = _user_id AND usage_date = CURRENT_DATE;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;
