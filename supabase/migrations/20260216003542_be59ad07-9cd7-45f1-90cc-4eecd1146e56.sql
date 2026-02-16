
-- Track API usage per user per day
CREATE TABLE public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  call_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, usage_date)
);

ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
ON public.api_usage FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can insert own usage"
ON public.api_usage FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage
CREATE POLICY "Users can update own usage"
ON public.api_usage FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all usage
CREATE POLICY "Admins can view all usage"
ON public.api_usage FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to check and increment usage (returns true if allowed)
CREATE OR REPLACE FUNCTION public.check_and_increment_usage(_user_id UUID, _daily_limit INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  is_paid BOOLEAN;
BEGIN
  -- Check if user is subscribed (paid users have unlimited access)
  SELECT is_subscribed INTO is_paid FROM public.profiles WHERE user_id = _user_id;
  IF is_paid THEN
    -- Still track usage but always allow
    INSERT INTO public.api_usage (user_id, usage_date, call_count)
    VALUES (_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET call_count = api_usage.call_count + 1, updated_at = now();
    RETURN TRUE;
  END IF;

  -- For free users, check limit
  SELECT call_count INTO current_count
  FROM public.api_usage
  WHERE user_id = _user_id AND usage_date = CURRENT_DATE;

  IF current_count IS NULL THEN
    INSERT INTO public.api_usage (user_id, usage_date, call_count)
    VALUES (_user_id, CURRENT_DATE, 1);
    RETURN TRUE;
  ELSIF current_count < _daily_limit THEN
    UPDATE public.api_usage
    SET call_count = call_count + 1, updated_at = now()
    WHERE user_id = _user_id AND usage_date = CURRENT_DATE;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_api_usage_updated_at
BEFORE UPDATE ON public.api_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
