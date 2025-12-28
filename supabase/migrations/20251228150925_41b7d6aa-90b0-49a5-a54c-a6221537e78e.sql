-- Fix the security definer view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.leaderboard_view;

CREATE VIEW public.leaderboard_view 
WITH (security_invoker = true) AS
SELECT 
  id,
  name,
  eco_creds,
  total_scans,
  total_reports
FROM public.profiles
ORDER BY eco_creds DESC;

-- Grant access to the view
GRANT SELECT ON public.leaderboard_view TO anon, authenticated;

-- Create a policy that allows anyone to read the limited leaderboard data via a function
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  id uuid,
  name text,
  eco_creds integer,
  total_scans integer,
  total_reports integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, eco_creds, total_scans, total_reports
  FROM public.profiles
  ORDER BY eco_creds DESC
  LIMIT 100;
$$;