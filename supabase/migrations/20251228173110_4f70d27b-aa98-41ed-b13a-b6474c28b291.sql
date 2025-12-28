-- Drop existing function to change return type
DROP FUNCTION IF EXISTS public.get_leaderboard();

-- Recreate get_leaderboard function with rank included
CREATE FUNCTION public.get_leaderboard()
RETURNS TABLE(id uuid, name text, eco_creds integer, total_scans integer, total_reports integer, rank bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
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

-- Enable realtime on profiles table for live leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;