-- Add location columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS location_updated_at timestamp with time zone;

-- Add environment cache columns for cost-safety (cache per user)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS environment_cache jsonb,
ADD COLUMN IF NOT EXISTS environment_cache_updated_at timestamp with time zone;