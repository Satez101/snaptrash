import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Key, Eye, EyeOff, Save, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('gemini_api_key')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.gemini_api_key) {
        setGeminiApiKey(data.gemini_api_key);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_settings')
          .update({ gemini_api_key: geminiApiKey || null })
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_settings')
          .insert({ user_id: user.id, gemini_api_key: geminiApiKey || null });
        
        if (error) throw error;
      }

      toast({
        title: "Settings saved",
        description: "Your API key has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 opacity-0 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <SettingsIcon className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Settings</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text-eco">App Settings</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Configure your AI settings and API keys for enhanced features.
          </p>
        </div>

        {/* Settings Card */}
        <div className="glass-card p-6 space-y-6 opacity-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* Gemini API Key Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-5 h-5 text-primary" />
              <h2 className="font-display font-semibold text-lg">Gemini API Key</h2>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Add your own Gemini API key from Google AI Studio to use AI features. 
              This is optional - the app uses default AI when no key is provided.
            </p>

            <div className="space-y-2">
              <Label htmlFor="gemini-key">API Key</Label>
              <div className="relative">
                <Input
                  id="gemini-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="Enter your Gemini API key..."
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ExternalLink className="w-4 h-4" />
              <a 
                href="https://aistudio.google.com/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Get your API key from Google AI Studio
              </a>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-border">
            <Button
              onClick={saveSettings}
              disabled={isSaving || isLoading}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <div className="glass-card p-4 mt-6 opacity-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-sm text-muted-foreground text-center">
            Your API key is stored securely and only used for AI features in this app.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
