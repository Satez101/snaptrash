import { useState } from "react";
import { Key, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserGeminiKey } from "@/hooks/useUserGeminiKey";

interface ApiKeyPromptProps {
  onClose: () => void;
  onSaved: () => void;
}

export function ApiKeyPrompt({ onClose, onSaved }: ApiKeyPromptProps) {
  const { saveApiKey } = useUserGeminiKey();
  const [key, setKey] = useState("");

  const handleSave = () => {
    if (key.trim()) {
      saveApiKey(key.trim());
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass-card p-6 max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold text-lg">Add Gemini API Key</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          AI quota exceeded. Add your free Gemini API key to continue using AI features.
        </p>

        <Input
          type="password"
          placeholder="Paste your Gemini API key..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="mb-4"
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <ExternalLink className="w-4 h-4" />
          <a 
            href="https://aistudio.google.com/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Get free API key from Google AI Studio
          </a>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!key.trim()} className="flex-1">
            Save Key
          </Button>
        </div>
      </div>
    </div>
  );
}
