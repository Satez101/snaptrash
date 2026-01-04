import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Key, Eye, EyeOff, Save, ExternalLink, Trash2, Cpu, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUserGeminiKey, GEMINI_MODELS, GeminiModel } from "@/hooks/useUserGeminiKey";

const Settings = () => {
  const { toast } = useToast();
  const { geminiApiKey, geminiModel, saveApiKey, saveModel, clearApiKey } = useUserGeminiKey();
  const [inputKey, setInputKey] = useState("");
  const [selectedModel, setSelectedModel] = useState<GeminiModel>('gemini-2.0-flash');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (geminiApiKey) setInputKey(geminiApiKey);
    if (geminiModel) setSelectedModel(geminiModel);
  }, [geminiApiKey, geminiModel]);

  const handleSave = async () => {
    if (inputKey.trim()) {
      await saveApiKey(inputKey.trim());
    }
    saveModel(selectedModel);
    toast({
      title: "Settings saved",
      description: "Your settings have been saved.",
    });
  };

  const handleClear = async () => {
    await clearApiKey();
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
            Configure your Gemini API for AI features.
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
              Get a free API key from Google AI Studio.
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
          </div>

          {/* Model Selection */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-5 h-5 text-primary" />
              <h2 className="font-display font-semibold text-lg">Model Selection</h2>
            </div>

            <div className="space-y-2">
              <Label>Gemini Model</Label>
              <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as GeminiModel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GEMINI_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">({model.description})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Usage Link */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="font-display font-semibold text-lg">Usage & Quota</h2>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ExternalLink className="w-4 h-4" />
              <a 
                href="https://aistudio.google.com/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Get your free API key
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ExternalLink className="w-4 h-4" />
              <a 
                href="https://aistudio.google.com/app/plan_information" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Check your usage & tokens remaining
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
            <Button onClick={handleSave} className="flex-1 gap-2">
              <Save className="w-4 h-4" />
              Save Settings
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <div className="glass-card p-4 mt-6 opacity-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-sm text-muted-foreground text-center">
            Your API key is stored securely in your account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
