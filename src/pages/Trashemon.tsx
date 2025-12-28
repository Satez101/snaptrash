import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  Upload,
  MapPin,
  Trophy,
  TrendingUp,
  Leaf,
  AlertCircle,
  Loader2,
  Recycle,
  Trash2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Trashemon = () => {
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Demo data
  const points = 0;
  const scannedCount = 0;

  interface ScanResult {
    category: string;
    item: string;
    disposal: string;
    tips: string;
    impact: string;
    recyclable: boolean;
  }

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationGranted(true);
          setLocationError(false);
        },
        () => {
          setLocationError(true);
        }
      );
    }
  };

  const handleImageCapture = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Simulate scanning
    setIsScanning(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Demo result
    setScanResult({
      category: "Plastic",
      item: "PET Bottle",
      disposal: "Rinse and place in recycling bin. Remove cap and label if possible.",
      tips: "Consider switching to reusable bottles to reduce plastic waste.",
      impact: "Recycling one plastic bottle saves enough energy to power a laptop for 25 minutes.",
      recyclable: true,
    });
    setIsScanning(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageCapture(file);
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setCapturedImage(null);
  };

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
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-primary mb-6 animate-float">
            <Leaf className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text mb-4">
            Trashemon
          </h1>
          <p className="text-muted-foreground italic">
            "Every piece of trash has a story. Be the hero who ends it."
          </p>
        </div>

        {/* Location Status */}
        <div className="glass-card p-4 mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {locationGranted ? (
            <div className="flex items-center gap-3 text-accent">
              <MapPin className="w-5 h-5" />
              <span className="text-sm">Location enabled - finding nearby disposal centers</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">Please enable location for nearby disposal options</span>
              </div>
              <Button variant="outline" size="sm" onClick={requestLocation}>
                Enable Location
              </Button>
            </div>
          )}
          {locationError && (
            <p className="text-destructive text-sm mt-2">
              Location access denied. Please enable in browser settings.
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">EcoCreds</p>
              <p className="font-display text-2xl font-bold text-warning">{points}</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Scanned</p>
              <p className="font-display text-2xl font-bold text-primary">{scannedCount}</p>
            </div>
          </div>
        </div>

        {/* Scan Result */}
        {scanResult ? (
          <div className="animate-scale-in">
            {/* Captured Image */}
            {capturedImage && (
              <div className="glass-card p-2 mb-6 overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Scanned item"
                  className="w-full h-48 object-cover rounded-xl"
                />
              </div>
            )}

            {/* Result Card */}
            <div className="glass-card p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      scanResult.recyclable ? "bg-accent/10" : "bg-destructive/10"
                    )}
                  >
                    {scanResult.recyclable ? (
                      <Recycle className="w-6 h-6 text-accent" />
                    ) : (
                      <Trash2 className="w-6 h-6 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {scanResult.category}
                    </p>
                    <p className="font-display text-xl font-bold">{scanResult.item}</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold">
                  +10 EcoCreds
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-primary" />
                    Disposal Instructions
                  </h4>
                  <p className="text-muted-foreground text-sm">{scanResult.disposal}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-accent" />
                    Eco-Friendly Tip
                  </h4>
                  <p className="text-muted-foreground text-sm">{scanResult.tips}</p>
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Environmental Impact
                  </h4>
                  <p className="text-muted-foreground text-sm">{scanResult.impact}</p>
                </div>
              </div>
            </div>

            <Button variant="gradient" size="lg" className="w-full" onClick={resetScan}>
              Scan Another Item
            </Button>
          </div>
        ) : (
          /* Scanner Interface */
          <div className="glass-card p-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-accent mb-6 animate-pulse-glow">
                <Camera className="w-10 h-10 text-accent-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">Begin Your Hunt</h2>
              <p className="text-muted-foreground mb-8">
                Capture a trash monster and discover how to dispose it
              </p>

              {isScanning ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <p className="text-muted-foreground">Analyzing trash monster...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-5 h-5" />
                    Open Camera
                  </Button>
                  <Button
                    variant="glass"
                    size="lg"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-5 h-5" />
                    Upload Image
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Motivational Footer */}
        <p className="text-center text-muted-foreground/70 text-sm mt-8 italic">
          "This scan made Earth cleaner. Thank you."
        </p>
      </div>
    </div>
  );
};

export default Trashemon;
