-- Drop the existing unsecured leaderboard_view
DROP VIEW IF EXISTS public.leaderboard_view;

-- Create a secure leaderboard view with only non-sensitive columns
-- Uses security_invoker to respect RLS of underlying tables
CREATE VIEW public.leaderboard_view
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.name,
  p.eco_creds,
  p.total_scans,
  p.total_reports,
  ROW_NUMBER() OVER (ORDER BY p.eco_creds DESC) as rank
FROM public.profiles p
WHERE p.eco_creds > 0
ORDER BY p.eco_creds DESC;

-- Enable RLS on the view
ALTER VIEW public.leaderboard_view SET (security_invoker = true);

-- Grant SELECT access only to authenticated users (not public/anon)
GRANT SELECT ON public.leaderboard_view TO authenticated;
REVOKE ALL ON public.leaderboard_view FROM anon;
REVOKE ALL ON public.leaderboard_view FROM public;