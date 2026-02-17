-- Migration: Fix get_user_role function to properly bypass RLS
-- Issue: Even with SECURITY DEFINER, the function still respects RLS policies
-- Solution: Recreate function with SQL language instead of plpgsql

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon;

-- Comment
COMMENT ON FUNCTION public.get_user_role(UUID) IS 'Returns user role, bypassing RLS';;
