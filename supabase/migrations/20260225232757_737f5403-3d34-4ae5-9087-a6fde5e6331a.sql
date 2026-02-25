
-- Recreate get_admin_users with is_blocked
DROP FUNCTION IF EXISTS public.get_admin_users();

CREATE FUNCTION public.get_admin_users()
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, is_subscribed boolean, stripe_customer_id text, created_at timestamp with time zone, updated_at timestamp with time zone, email text, subscription_tier text, is_subscription_exempt boolean, is_blocked boolean)
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
    p.is_subscription_exempt,
    p.is_blocked
  FROM public.profiles p
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY p.created_at DESC
$function$;

-- Block/unblock user
CREATE OR REPLACE FUNCTION public.set_user_blocked(_target_user_id uuid, _blocked boolean)
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
  SET is_blocked = _blocked, updated_at = now()
  WHERE user_id = _target_user_id;
END;
$function$;

-- Delete user (admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_user(_target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  DELETE FROM public.profiles WHERE user_id = _target_user_id;
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  DELETE FROM public.api_usage WHERE user_id = _target_user_id;
  DELETE FROM auth.users WHERE id = _target_user_id;
END;
$function$;
