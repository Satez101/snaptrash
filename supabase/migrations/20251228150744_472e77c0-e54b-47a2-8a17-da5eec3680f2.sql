-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles for leaderboard" ON public.profiles;

-- Create a more restrictive policy that only allows viewing specific fields for leaderboard
-- Users can only see their own full profile
CREATE POLICY "Users can view own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a view for the public leaderboard that only exposes non-sensitive data
CREATE OR REPLACE VIEW public.leaderboard_view AS
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