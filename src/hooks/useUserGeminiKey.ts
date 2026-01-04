import { useState, useEffect } from 'react';

const STORAGE_KEY = 'user_gemini_api_key';

export function useUserGeminiKey() {
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    setGeminiApiKey(stored);
    setIsLoading(false);
  }, []);

  const saveApiKey = (key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    setGeminiApiKey(key);
  };

  const clearApiKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGeminiApiKey(null);
  };

  return { geminiApiKey, isLoading, saveApiKey, clearApiKey };
}
