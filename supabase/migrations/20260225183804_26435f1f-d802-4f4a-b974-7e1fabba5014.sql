
-- Step 1: Add column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_subscription_exempt boolean NOT NULL DEFAULT false;

-- Step 2: Drop old function
DROP FUNCTION IF EXISTS public.get_admin_users();

-- Step 3: Recreate with new return type
CREATE FUNCTION public.get_admin_users()
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, is_subscribed boolean, stripe_customer_id text, created_at timestamp with time zone, updated_at timestamp with time zone, email text, subscription_tier text, is_subscription_exempt boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.is_subscribed,
    p.stripe_customer_id,
    p.created_at,
    p.updated_at,
    (SELECT au.email FROM auth.users au WHERE au.id = p.user_id) AS email,
    p.subscription_tier::text AS subscription_tier,
    p.is_subscription_exempt
  FROM public.profiles p
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY p.created_at DESC
$function$;

-- Step 4: Create exemption toggle function
CREATE OR REPLACE FUNCTION public.set_subscription_exempt(_target_user_id uuid, _exempt boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.profiles
  SET is_subscription_exempt = _exempt,
      is_subscribed = CASE WHEN _exempt THEN true ELSE is_subscribed END,
      subscription_tier = CASE WHEN _exempt THEN 'bull_trader' ELSE subscription_tier END,
      updated_at = now()
  WHERE user_id = _target_user_id;
END;
$function$;
