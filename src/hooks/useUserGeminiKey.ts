import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserGeminiKey() {
  const { user } = useAuth();
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchApiKey();
    } else {
      setGeminiApiKey(null);
      setIsLoading(false);
    }
  }, [user]);

  const fetchApiKey = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('gemini_api_key')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setGeminiApiKey(data?.gemini_api_key || null);
    } catch (error) {
      console.error('Error fetching API key:', error);
      setGeminiApiKey(null);
    } finally {
      setIsLoading(false);
    }
  };

  return { geminiApiKey, isLoading, refetch: fetchApiKey };
}
