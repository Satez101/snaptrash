-- Drop existing view and function
DROP VIEW IF EXISTS public.leaderboard_view;
DROP FUNCTION IF EXISTS public.get_leaderboard();

-- Create a secure leaderboard view with security_invoker = true
-- This ensures RLS policies are respected when the view is queried
CREATE VIEW public.leaderboard_view
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  eco_creds,
  total_scans,
  total_reports
FROM public.profiles
WHERE eco_creds > 0
ORDER BY eco_creds DESC
LIMIT 100;

-- Enable RLS on the view (views inherit RLS from underlying tables when security_invoker = true)
-- But we also need to grant access to authenticated users only

-- Create the secure RPC function for fetching leaderboard
-- This function uses SECURITY DEFINER but only exposes non-sensitive data
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  id uuid,
  name text,
  eco_creds integer,
  total_scans integer,
  total_reports integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, eco_creds, total_scans, total_reports
  FROM public.profiles
  WHERE eco_creds > 0
  ORDER BY eco_creds DESC
  LIMIT 100;
$$;

-- Revoke all access from public/anon on the view
REVOKE ALL ON public.leaderboard_view FROM anon;
REVOKE ALL ON public.leaderboard_view FROM public;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.leaderboard_view TO authenticated;

-- Grant execute on the function to authenticated users only
REVOKE ALL ON FUNCTION public.get_leaderboard() FROM anon;
REVOKE ALL ON FUNCTION public.get_leaderboard() FROM public;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;