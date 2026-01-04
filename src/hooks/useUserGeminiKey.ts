import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const MODEL_KEY = 'user_gemini_model';

export const GEMINI_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast & free' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Fastest, basic tasks' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Capable' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', description: 'Latest & most powerful' },
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number]['id'];

export function useUserGeminiKey() {
  const { user } = useAuth();
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [geminiModel, setGeminiModel] = useState<GeminiModel>('gemini-2.0-flash');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_settings')
        .select('gemini_api_key')
        .eq('user_id', user.id)
        .single();

      if (data?.gemini_api_key) {
        setGeminiApiKey(data.gemini_api_key);
      }

      const storedModel = localStorage.getItem(MODEL_KEY) as GeminiModel | null;
      if (storedModel) setGeminiModel(storedModel);
      
      setIsLoading(false);
    };

    fetchSettings();
  }, [user]);

  const saveApiKey = async (key: string) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      await supabase
        .from('user_settings')
        .update({ gemini_api_key: key, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('user_settings')
        .insert({ user_id: user.id, gemini_api_key: key });
    }

    setGeminiApiKey(key);
  };

  const saveModel = (model: GeminiModel) => {
    localStorage.setItem(MODEL_KEY, model);
    setGeminiModel(model);
  };

  const clearApiKey = async () => {
    if (!user) return;

    await supabase
      .from('user_settings')
      .update({ gemini_api_key: null, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    setGeminiApiKey(null);
  };

  return { geminiApiKey, geminiModel, isLoading, saveApiKey, saveModel, clearApiKey };
}
