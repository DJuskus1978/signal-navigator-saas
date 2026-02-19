
DROP FUNCTION public.get_admin_users();

CREATE FUNCTION public.get_admin_users()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  is_subscribed boolean,
  stripe_customer_id text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  email text,
  subscription_tier text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.is_subscribed,
    p.stripe_customer_id,
    p.created_at,
    p.updated_at,
    (SELECT au.email FROM auth.users au WHERE au.id = p.user_id) AS email,
    p.subscription_tier::text AS subscription_tier
  FROM public.profiles p
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY p.created_at DESC
$$;
