
-- Drop the security definer view, we use get_admin_users() RPC instead
DROP VIEW IF EXISTS public.admin_users_view;

-- Drop the standalone get_user_email function (not needed separately)
DROP FUNCTION IF EXISTS public.get_user_email(UUID);
