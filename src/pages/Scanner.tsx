import { useState, useRef, useEffect } from "react";
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
  Navigation,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Wind,
  Sun,
  Factory,
  ThermometerSun,
  Droplets,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScanResult {
  category: string;
  item: string;
  disposal: string;
  tips: string;
  impact: string;
  recyclable: boolean;
  confidence?: number;
}

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface EnvironmentData {
  aqi: number;
  aqiLevel: string;
  temperature: number;
  humidity: number;
  solarPotential: number;
  solarRating: string;
  location: string;
}

interface NearbyMachine {
  id: string;
  name: string;
  location: string;
  distance: number;
  available: boolean;
  coordinates: { lat: number; lng: number };
}

const getConfidenceInfo = (confidence: number) => {
  if (confidence >= 0.85) return { label: "High", class: "confidence-high", icon: CheckCircle2 };
  if (confidence >= 0.6) return { label: "Medium", class: "confidence-medium", icon: AlertTriangle };
  return { label: "Low", class: "confidence-low", icon: HelpCircle };
};

const getAqiInfo = (aqi: number) => {
  if (aqi <= 50) return { label: "Good", class: "text-[hsl(var(--aqi-good))]" };
  if (aqi <= 100) return { label: "Moderate", class: "text-[hsl(var(--aqi-moderate))]" };
  if (aqi <= 150) return { label: "Unhealthy for Sensitive", class: "text-[hsl(var(--aqi-unhealthy-sensitive))]" };
  return { label: "Unhealthy", class: "text-[hsl(var(--aqi-unhealthy))]" };
};

const Scanner = () => {
  const { profile, refreshProfile } = useAuth();
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [envExpanded, setEnvExpanded] = useState(false);
  const [envData, setEnvData] = useState<EnvironmentData | null>(null);
  const [nearbyMachines, setNearbyMachines] = useState<NearbyMachine[]>([]);
  const [loadingEnv, setLoadingEnv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const points = profile?.eco_creds || 0;
  const scannedCount = profile?.total_scans || 0;

  useEffect(() => {
    navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        requestLocation();
      }
    });
  }, []);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLocationGranted(true);
          setLocationError(false);
          const newCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCoords(newCoords);
          
          // Fetch environmental data and nearby machines
          await Promise.all([
            fetchEnvironmentData(newCoords.latitude, newCoords.longitude),
            fetchNearbyMachines(newCoords.latitude, newCoords.longitude)
          ]);
        },
        () => {
          setLocationError(true);
        }
      );
    }
  };

  const fetchEnvironmentData = async (lat: number, lng: number) => {
    setLoadingEnv(true);
    try {
      const { data, error } = await supabase.functions.invoke("environment-data", {
        body: { latitude: lat, longitude: lng },
      });
      if (!error && data) {
        // Normalize location to a string
        let loc: string = '';
        if (typeof data.location === 'object' && data.location) {
          loc = data.location.city || data.location.displayName || '';
        } else if (typeof data.location === 'string') {
          loc = data.location;
        }
        setEnvData({
          aqi: data.airQuality?.aqi ?? 0,
          aqiLevel: data.airQuality?.level ?? '',
          temperature: data.weather?.temperature ?? 0,
          humidity: data.weather?.humidity ?? 0,
          solarPotential: data.weather?.uvIndex ? Math.min(data.weather.uvIndex * 10, 100) : 0,
          solarRating: data.weather?.uvIndex >= 6 ? 'High' : data.weather?.uvIndex >= 3 ? 'Moderate' : 'Low',
          location: loc,
        });
      }
    } catch (err) {
      console.error("Error fetching environment data:", err);
    } finally {
      setLoadingEnv(false);
    }
  };

  const fetchNearbyMachines = async (lat: number, lng: number) => {
    try {
      const { data, error } = await supabase.functions.invoke("disposal-machines", {
        body: { latitude: lat, longitude: lng },
      });
      if (!error && data?.machines) {
        setNearbyMachines(data.machines.slice(0, 3)); // Get top 3 nearest
      }
    } catch (err) {
      console.error("Error fetching nearby machines:", err);
    }
  };

  const handleImageCapture = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageBase64 = e.target?.result as string;
      setCapturedImage(imageBase64);
      setIsScanning(true);
      setFeedbackGiven(false);
      
      try {
        // Include location data for localized disposal guidance
        const { data, error } = await supabase.functions.invoke('analyze-trash', {
          body: { 
            imageBase64,
            latitude: coords?.latitude,
            longitude: coords?.longitude,
          }
        });

        if (error) {
          console.error('Error analyzing image:', error);
          toast.error('Failed to analyze image. Please try again.');
          setIsScanning(false);
          return;
        }

        if (data.error) {
          toast.error(data.error);
          setIsScanning(false);
          return;
        }

        if (!data.success) {
          toast.error(data.error || 'Could not identify the item. Please try again with a clearer photo.');
          setIsScanning(false);
          setCapturedImage(null);
          return;
        }

        const { error: insertError } = await supabase
          .from('scans')
          .insert({
            user_id: profile?.user_id,
            waste_category: data.category,
            item_name: data.item,
            disposal_instructions: data.disposal,
            eco_tips: data.tips,
            environmental_impact: data.impact,
            confidence_score: data.confidence,
            latitude: coords?.latitude,
            longitude: coords?.longitude,
            eco_creds_earned: 10,
          });

        if (insertError) {
          console.error('Error saving scan:', insertError);
          toast.error('Failed to save scan results');
        } else {
          toast.success('+10 SnapCreds earned!');
          await refreshProfile();
        }

        setScanResult({
          category: data.category,
          item: data.item,
          disposal: data.disposal,
          tips: data.tips,
          impact: data.impact,
          recyclable: data.recyclable,
          confidence: data.confidence,
        });
      } catch (err) {
        console.error('Error:', err);
        toast.error('An error occurred while analyzing the image');
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageCapture(file);
    }
  };

  const handleFeedback = (isCorrect: boolean) => {
    setFeedbackGiven(true);
    if (isCorrect) {
      toast.success("Thanks for confirming! This helps improve our AI.");
    } else {
      toast.info("Thanks for the feedback! We'll work on improving.");
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setCapturedImage(null);
    setFeedbackGiven(false);
  };

  const openMachineDirections = (machine: NearbyMachine) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${machine.coordinates.lat},${machine.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const openMapsNavigation = () => {
    if (coords) {
      const query = encodeURIComponent('recycling center');
      const url = `https://www.google.com/maps/search/${query}/@${coords.latitude},${coords.longitude},14z`;
      window.open(url, '_blank');
    }
  };

  const confidence = scanResult?.confidence || 0;
  const confidenceInfo = getConfidenceInfo(confidence);
  const ConfidenceIcon = confidenceInfo.icon;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-primary mb-6 animate-float">
            <Camera className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">AI Waste Scanner</span>
          </h1>
          <p className="text-muted-foreground">
            Scan any waste item for instant AI-powered identification and disposal guidance
          </p>
        </div>

        {/* Location Status + Directions */}
        <div className="glass-card p-4 mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {locationGranted ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-accent">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm">Location enabled</span>
                </div>
                <Button variant="outline" size="sm" onClick={openMapsNavigation} className="gap-2">
                  <Navigation className="w-4 h-4" />
                  Find Centers
                </Button>
              </div>
              
              {/* Nearby SnapTrash Machines - Integrated Directions */}
              {nearbyMachines.length > 0 && (
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">Nearest SnapTrash Machines</p>
                  <div className="space-y-2">
                    {nearbyMachines.slice(0, 2).map((machine) => (
                      <div 
                        key={machine.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => openMachineDirections(machine)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${machine.available ? 'bg-accent/10' : 'bg-muted'}`}>
                            <Recycle className={`w-4 h-4 ${machine.available ? 'text-accent' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{machine.name}</p>
                            <p className="text-xs text-muted-foreground">{machine.distance} km away</p>
                          </div>
                        </div>
                        <Navigation className="w-4 h-4 text-primary" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">Enable location for nearby disposal options</span>
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

        {/* Environmental Data Panel - Expandable */}
        {locationGranted && envData && (
          <div className="glass-card mb-6 overflow-hidden animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <button
              onClick={() => setEnvExpanded(!envExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Wind className="w-5 h-5 text-secondary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Live Environment Data</p>
                  <p className="text-xs text-muted-foreground">{envData.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={cn("text-lg font-bold", getAqiInfo(envData.aqi).class)}>
                    AQI {envData.aqi}
                  </p>
                  <p className="text-xs text-muted-foreground">{getAqiInfo(envData.aqi).label}</p>
                </div>
                {envExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </div>
            </button>
            
            {envExpanded && (
              <div className="px-4 pb-4 pt-2 border-t border-border/50 animate-fade-in">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <ThermometerSun className="w-5 h-5 text-warning mx-auto mb-1" />
                    <p className="font-bold text-foreground">{envData.temperature}°C</p>
                    <p className="text-xs text-muted-foreground">Temp</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <Droplets className="w-5 h-5 text-[hsl(var(--eco-water))] mx-auto mb-1" />
                    <p className="font-bold text-foreground">{envData.humidity}%</p>
                    <p className="text-xs text-muted-foreground">Humidity</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <Sun className="w-5 h-5 text-[hsl(var(--eco-solar))] mx-auto mb-1" />
                    <p className="font-bold text-foreground">{envData.solarPotential}%</p>
                    <p className="text-xs text-muted-foreground">Solar</p>
                  </div>
                </div>
                <Link to="/environment">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Factory className="w-4 h-4" />
                    View Full Environmental Report
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">SnapCreds</p>
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
          <div className="animate-scale-in space-y-6">
            {/* Captured Image */}
            {capturedImage && (
              <div className="glass-card p-2 overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Scanned item"
                  className="w-full h-48 object-cover rounded-xl"
                />
              </div>
            )}

            {/* Result Card */}
            <div className="glass-card p-6">
              {/* Header with confidence */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center",
                      scanResult.recyclable ? "bg-accent/10" : "bg-destructive/10"
                    )}
                  >
                    {scanResult.recyclable ? (
                      <Recycle className="w-7 h-7 text-accent" />
                    ) : (
                      <Trash2 className="w-7 h-7 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {scanResult.category}
                    </p>
                    <p className="font-display text-2xl font-bold">{scanResult.item}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold">
                    +10 SnapCreds
                  </div>
                  {/* Confidence Badge */}
                  <div className={cn("px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5", confidenceInfo.class)}>
                    <ConfidenceIcon className="w-3 h-3" />
                    {confidenceInfo.label} ({Math.round(confidence * 100)}%)
                  </div>
                </div>
              </div>

              {/* Disposal Instructions - Enhanced */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-primary" />
                    How to Dispose
                  </h4>
                  <p className="text-foreground text-sm leading-relaxed">{scanResult.disposal}</p>
                  
                  {/* Quick disposal steps */}
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</span>
                      Clean the item if possible
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</span>
                      {scanResult.recyclable ? "Place in recycling bin" : "Place in general waste"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</span>
                      Check local guidelines for specifics
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                  <h4 className="text-sm font-semibold text-accent mb-2 flex items-center gap-2">
                    <Leaf className="w-4 h-4" />
                    Eco-Friendly Tip
                  </h4>
                  <p className="text-muted-foreground text-sm">{scanResult.tips}</p>
                </div>

                <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20">
                  <h4 className="text-sm font-semibold text-secondary mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Environmental Impact
                  </h4>
                  <p className="text-muted-foreground text-sm">{scanResult.impact}</p>
                </div>

                {/* User Feedback Section */}
                {!feedbackGiven ? (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-3 text-center">
                      Was this identification correct?
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFeedback(true)}
                        className="gap-2"
                      >
                        <ThumbsUp className="w-4 h-4 text-accent" />
                        Yes, correct
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFeedback(false)}
                        className="gap-2"
                      >
                        <ThumbsDown className="w-4 h-4 text-destructive" />
                        Not quite
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-accent/10 text-center">
                    <p className="text-sm text-accent flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Thanks for your feedback!
                    </p>
                  </div>
                )}

                {/* Integrated Directions to Nearest Machine */}
                {nearbyMachines.length > 0 && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Nearest SnapTrash Machine
                    </h4>
                    <div 
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50 cursor-pointer hover:bg-background/80 transition-colors"
                      onClick={() => openMachineDirections(nearbyMachines[0])}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                          <Recycle className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{nearbyMachines[0].name}</p>
                          <p className="text-xs text-muted-foreground">{nearbyMachines[0].distance} km • {nearbyMachines[0].location}</p>
                        </div>
                      </div>
                      <Button size="sm" className="btn-gradient rounded-xl gap-2">
                        <Navigation className="w-4 h-4" />
                        Go
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button className="w-full btn-gradient rounded-xl" size="lg" onClick={resetScan}>
              <Camera className="w-5 h-5 mr-2" />
              Scan Another Item
            </Button>
          </div>
        ) : (
          /* Scanner Interface */
          <div className="glass-card p-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-eco mb-6 icon-pulse">
                <Camera className="w-12 h-12 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">Ready to Scan</h2>
              <p className="text-muted-foreground mb-8">
                Point your camera at any waste item for instant AI identification
              </p>

              {isScanning ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  </div>
                  <p className="text-foreground font-medium">Analyzing with AI...</p>
                  <p className="text-muted-foreground text-sm">Identifying material, category, and disposal method</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    className="w-full btn-gradient rounded-xl"
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Open Camera
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-xl"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-5 h-5 mr-2" />
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

        {/* Link to Machines */}
        <div className="mt-8 text-center">
          <Link to="/machines">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <MapPin className="w-4 h-4" />
              View All SnapTrash Machines
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Scanner;