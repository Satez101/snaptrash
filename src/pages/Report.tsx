import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  MapPin,
  AlertTriangle,
  Send,
  CheckCircle2,
  Camera,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const Report = () => {
  const { profile, refreshProfile } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Try to get location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Location denied, continue without it
        }
      );
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image) {
      toast.error("Please upload a photo of the issue");
      return;
    }

    if (!location.trim()) {
      toast.error("Please provide the location");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          user_id: profile?.user_id,
          location: location.trim(),
          description: description.trim() || null,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          eco_creds_earned: 20,
        });

      if (error) {
        console.error('Error submitting report:', error);
        toast.error('Failed to submit report. Please try again.');
        setIsSubmitting(false);
        return;
      }

      await refreshProfile();
      setIsSubmitted(true);
      toast.success('+20 EcoCreds earned!');
    } catch (err) {
      console.error('Error:', err);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setImage(null);
    setLocation("");
    setDescription("");
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full text-center animate-scale-in">
          <div className="glass-card p-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-accent/10 mb-6">
              <CheckCircle2 className="w-10 h-10 text-accent animate-pulse-glow" />
            </div>
            <h2 className="font-display text-3xl font-bold gradient-text-accent mb-4">
              Report Submitted!
            </h2>
            <p className="text-muted-foreground mb-6">
              Your alert has been sent to the local municipality. Thank you for keeping your city clean!
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold mb-8">
              +20 EcoCreds Earned
            </div>
            <p className="text-sm text-muted-foreground/70 italic mb-8">
              "People like you change cities."
            </p>
            <div className="space-y-3">
              <Button variant="gradient" size="lg" className="w-full" onClick={resetForm}>
                Report Another Issue
              </Button>
              <Link to="/">
                <Button variant="glass" size="lg" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 border border-warning/20 mb-6">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-warning">Civic Duty</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Report Public <span className="gradient-text-warm">Garbage</span>
          </h1>
          <p className="text-muted-foreground">
            Help keep your city clean by reporting garbage issues to your local municipality
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-primary" />
              Photo Evidence
            </h3>

            {image ? (
              <div className="relative">
                <img
                  src={image}
                  alt="Uploaded evidence"
                  className="w-full h-64 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <p className="font-medium mb-1">Click to upload a photo</p>
                <p className="text-sm text-muted-foreground">
                  Take or upload a photo of the garbage issue
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Location */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-warning" />
              Location / Landmark
            </h3>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Near Central Park, Main Street"
              className="bg-muted/50 border-border/50 focus:border-primary"
            />
          </div>

          {/* Description */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
              Issue Description <span className="text-muted-foreground font-normal">(Optional)</span>
            </h3>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
              className="bg-muted/50 border-border/50 focus:border-primary resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="gradient-warm"
            size="xl"
            className="w-full animate-fade-in"
            style={{ animationDelay: '0.4s' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting Report...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Report
              </>
            )}
          </Button>
        </form>

        {/* Motivational Footer */}
        <p className="text-center text-muted-foreground/70 text-sm mt-8 italic">
          "Action beats awareness. Thank you for taking action."
        </p>
      </div>
    </div>
  );
};

export default Report;
