-- Enable RLS on leaderboard_view (it's a view, so we need to handle it differently)
-- Views inherit RLS from underlying tables, but we can add security via the function

-- Drop and recreate the get_leaderboard function with proper security
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE(id uuid, name text, eco_creds integer, total_scans integer, total_reports integer, rank bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id, 
    p.name, 
    p.eco_creds, 
    p.total_scans, 
    p.total_reports,
    ROW_NUMBER() OVER (ORDER BY p.eco_creds DESC) as rank
  FROM public.profiles p
  WHERE p.eco_creds > 0
  ORDER BY p.eco_creds DESC
  LIMIT 100;
$$;

-- Revoke direct access to the view from anon users
REVOKE ALL ON public.leaderboard_view FROM anon;

-- Grant access only to authenticated users
GRANT SELECT ON public.leaderboard_view TO authenticated;