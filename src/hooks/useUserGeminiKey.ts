import { useState, useEffect } from 'react';

const STORAGE_KEY = 'user_gemini_api_key';
const MODEL_KEY = 'user_gemini_model';

export const GEMINI_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast & free' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Fastest, basic tasks' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Capable' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', description: 'Latest & most powerful' },
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number]['id'];

export function useUserGeminiKey() {
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [geminiModel, setGeminiModel] = useState<GeminiModel>('gemini-2.0-flash');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedKey = localStorage.getItem(STORAGE_KEY);
    const storedModel = localStorage.getItem(MODEL_KEY) as GeminiModel | null;
    setGeminiApiKey(storedKey);
    if (storedModel) setGeminiModel(storedModel);
    setIsLoading(false);
  }, []);

  const saveApiKey = (key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    setGeminiApiKey(key);
  };

  const saveModel = (model: GeminiModel) => {
    localStorage.setItem(MODEL_KEY, model);
    setGeminiModel(model);
  };

  const clearApiKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGeminiApiKey(null);
  };

  return { geminiApiKey, geminiModel, isLoading, saveApiKey, saveModel, clearApiKey };
}
