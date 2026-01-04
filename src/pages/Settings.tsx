import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Key, Eye, EyeOff, Save, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUserGeminiKey } from "@/hooks/useUserGeminiKey";

const Settings = () => {
  const { toast } = useToast();
  const { geminiApiKey, saveApiKey, clearApiKey } = useUserGeminiKey();
  const [inputKey, setInputKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (geminiApiKey) {
      setInputKey(geminiApiKey);
    }
  }, [geminiApiKey]);

  const handleSave = () => {
    if (inputKey.trim()) {
      saveApiKey(inputKey.trim());
      toast({
        title: "Settings saved",
        description: "Your API key has been saved locally.",
      });
    }
  };

  const handleClear = () => {
    clearApiKey();
    setInputKey("");
    toast({
      title: "API key removed",
      description: "Your API key has been cleared.",
    });
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
            Add your Gemini API key to use AI features when default quota is exceeded.
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
              Get a free API key from Google AI Studio. Your key is stored locally in your browser only.
            </p>

            <div className="space-y-2">
              <Label htmlFor="gemini-key">API Key</Label>
              <div className="relative">
                <Input
                  id="gemini-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="Enter your Gemini API key..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="pr-10"
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
                Get your free API key from Google AI Studio
              </a>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            {geminiApiKey && (
              <Button variant="outline" onClick={handleClear} className="gap-2">
                <Trash2 className="w-4 h-4" />
                Remove
              </Button>
            )}
            <Button onClick={handleSave} disabled={!inputKey.trim()} className="flex-1 gap-2">
              <Save className="w-4 h-4" />
              Save Key
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <div className="glass-card p-4 mt-6 opacity-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-sm text-muted-foreground text-center">
            Your API key is stored only in your browser's local storage - never sent to our servers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
