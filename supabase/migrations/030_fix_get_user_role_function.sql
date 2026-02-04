-- Migration: Fix get_user_role function to properly bypass RLS
-- Issue: Even with SECURITY DEFINER, the function still respects RLS policies
-- Solution: Recreate function with proper settings to bypass RLS

-- Drop and recreate the function
DROP FUNCTION IF EXISTS public.get_user_role(UUID);

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon;

-- Comment for documentation
COMMENT ON FUNCTION public.get_user_role(UUID) IS 'Returns user role, bypassing RLS. Used in RLS policies to prevent infinite recursion. SECURITY DEFINER allows it to read from users table without triggering RLS policies.';
