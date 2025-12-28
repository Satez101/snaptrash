import { useState, useEffect, useCallback } from "react";
import { 
  Wind, 
  MapPin,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Factory,
  Droplets,
  Lightbulb,
  X,
  Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import EnvironmentStoryCard from "@/components/environment/EnvironmentStoryCard";
import AQIStoryCard from "@/components/environment/AQIStoryCard";
import IndustryStoryCard from "@/components/environment/IndustryStoryCard";
import WaterBodyStoryCard from "@/components/environment/WaterBodyStoryCard";
import SolutionsStoryCard from "@/components/environment/SolutionsStoryCard";

interface EnvironmentData {
  location: {
    city: string;
    state: string;
    country: string;
    displayName: string;
    coordinates: { lat: number; lng: number };
  };
  airQuality: {
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    so2: number;
    co: number;
    o3: number;
    level: string;
    description: string;
    healthAdvice: string;
    mainPollutants: string[];
  };
  weather: {
    temperature: number;
    humidity: number;
    uvIndex: number;
  };
  industries: Array<{
    name: string;
    type: string;
    distance: string;
    wasteTypes: string[];
    environmentalImpact: string;
    riskLevel: string;
  }>;
  waterBodies: Array<{
    name: string;
    type: string;
    distance: string;
    pollutionLevel: string;
    pollutionSources: string[];
    impact: string;
  }>;
  solutions: Array<{
    title: string;
    description: string;
    impact: string;
    difficulty: string;
  }>;
  lastUpdated: string;
}

const Environment = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<EnvironmentData | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [storyMode, setStoryMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<string>("prompt");

  const requestLocationPermission = useCallback(async () => {
    setLoading(true);
    setLocationError(null);

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    // Check permission status if available
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" });
        setPermissionStatus(result.state);
        
        result.onchange = () => {
          setPermissionStatus(result.state);
          if (result.state === "granted") {
            getHighAccuracyLocation();
          }
        };
      } catch (e) {
        console.log("Permission API not fully supported");
      }
    }

    getHighAccuracyLocation();
  }, []);

  const getHighAccuracyLocation = () => {
    // First, try to get a quick position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Quick location obtained:", position.coords);
        processLocation(position.coords);
      },
      (error) => {
        console.error("Quick location error:", error);
        // Try with high accuracy as fallback
        tryHighAccuracy();
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000,
      }
    );
  };

  const tryHighAccuracy = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("High accuracy location obtained:", position.coords);
        processLocation(position.coords);
      },
      (error) => {
        console.error("High accuracy location error:", error);
        handleLocationError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const processLocation = async (coords: GeolocationCoordinates) => {
    const { latitude, longitude, accuracy } = coords;
    console.log(`Location: ${latitude}, ${longitude}, Accuracy: ${accuracy}m`);
    
    setCoords({ lat: latitude, lng: longitude });
    
    if (accuracy > 1000) {
      toast.warning(`Location accuracy: ~${Math.round(accuracy)}m. For better results, enable GPS.`);
    }
    
    await fetchEnvironmentData(latitude, longitude);
    setLoading(false);
  };

  const handleLocationError = (error: GeolocationPositionError) => {
    let message = "Unable to get your location";
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = "Location permission denied. Please enable location access in your browser settings.";
        break;
      case error.POSITION_UNAVAILABLE:
        message = "Location information is unavailable. Please try again.";
        break;
      case error.TIMEOUT:
        message = "Location request timed out. Please try again.";
        break;
    }
    
    setLocationError(message);
    toast.error(message);
    setLoading(false);
  };

  const fetchEnvironmentData = async (lat: number, lng: number) => {
    try {
      const { data: envData, error } = await supabase.functions.invoke("environment-data", {
        body: { latitude: lat, longitude: lng },
      });

      if (error) throw error;
      setData(envData);
    } catch (error) {
      console.error("Environment data error:", error);
      toast.error("Failed to fetch environment data");
    }
  };

  const refresh = async () => {
    if (!coords) return;
    setRefreshing(true);
    await fetchEnvironmentData(coords.lat, coords.lng);
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleNextCard = () => {
    if (currentCardIndex < 3) {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, [requestLocationPermission]);

  // Keyboard navigation for story mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!storyMode) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        handleNextCard();
      } else if (e.key === "ArrowLeft") {
        handlePrevCard();
      } else if (e.key === "Escape") {
        setStoryMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [storyMode, currentCardIndex]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Navigation className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <Loader2 className="w-24 h-24 animate-spin text-primary/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Getting Your Location</h2>
          <p className="text-muted-foreground text-sm">
            Please allow location access for accurate environmental data
          </p>
        </div>
      </div>
    );
  }

  if (locationError || !data) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Location Required</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {locationError || "Unable to load environmental data"}
          </p>
          <Button onClick={requestLocationPermission} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Link to="/dashboard">
            <Button variant="ghost" className="w-full mt-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Story mode view
  if (storyMode) {
    const cardGradients = [
      "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800",
      "bg-gradient-to-br from-orange-500 via-amber-600 to-red-700",
      "bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-800",
      "bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700",
    ];

    const cardIcons = [
      <Wind className="w-6 h-6 text-white" />,
      <Factory className="w-6 h-6 text-white" />,
      <Droplets className="w-6 h-6 text-white" />,
      <Lightbulb className="w-6 h-6 text-white" />,
    ];

    const cardTitles = [
      "Air Quality",
      "Industrial Impact",
      "Water Bodies",
      "Solutions",
    ];

    const cardSubtitles = [
      data.location.city || "Your Location",
      "Nearby factories & emissions",
      "Rivers, lakes & pollution",
      "Actions you can take",
    ];

    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
        {/* Close button */}
        <button
          onClick={() => setStoryMode(false)}
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Story cards */}
        <div className="w-full max-w-md h-full max-h-[85vh]">
          {[0, 1, 2, 3].map((index) => (
            <EnvironmentStoryCard
              key={index}
              title={cardTitles[index]}
              subtitle={cardSubtitles[index]}
              icon={cardIcons[index]}
              gradient={cardGradients[index]}
              currentIndex={currentCardIndex}
              totalCards={4}
              onNext={handleNextCard}
              onPrev={handlePrevCard}
              isActive={currentCardIndex === index}
            >
              {index === 0 && <AQIStoryCard data={data.airQuality} />}
              {index === 1 && <IndustryStoryCard industries={data.industries} />}
              {index === 2 && <WaterBodyStoryCard waterBodies={data.waterBodies} />}
              {index === 3 && <SolutionsStoryCard solutions={data.solutions} />}
            </EnvironmentStoryCard>
          ))}
        </div>
      </div>
    );
  }

  // Card selection view
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-2xl md:text-3xl font-bold gradient-text">
              Environment Analysis
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm truncate">
                {data.location.city ? `${data.location.city}, ${data.location.state}` : data.location.displayName}
              </span>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={refresh} 
            disabled={refreshing}
            className="rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass-card p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{data.airQuality.aqi}</div>
            <div className="text-xs text-muted-foreground">AQI</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{data.weather.temperature}°</div>
            <div className="text-xs text-muted-foreground">Temp</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{data.weather.humidity}%</div>
            <div className="text-xs text-muted-foreground">Humidity</div>
          </div>
        </div>

        {/* Interactive story cards */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Tap to explore your environment
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* AQI Card */}
            <button
              onClick={() => { setCurrentCardIndex(0); setStoryMode(true); }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 p-5 text-left text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] aspect-square"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Wind className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">{data.airQuality.aqi}</div>
                  <div className="text-sm opacity-80">Air Quality</div>
                  <div className="text-xs opacity-60 mt-1">{data.airQuality.level}</div>
                </div>
              </div>
            </button>

            {/* Industry Card */}
            <button
              onClick={() => { setCurrentCardIndex(1); setStoryMode(true); }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-red-700 p-5 text-left text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] aspect-square"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Factory className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">{data.industries.length}</div>
                  <div className="text-sm opacity-80">Industries</div>
                  <div className="text-xs opacity-60 mt-1">Nearby zones</div>
                </div>
              </div>
            </button>

            {/* Water Card */}
            <button
              onClick={() => { setCurrentCardIndex(2); setStoryMode(true); }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-800 p-5 text-left text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] aspect-square"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">{data.waterBodies.length}</div>
                  <div className="text-sm opacity-80">Water Bodies</div>
                  <div className="text-xs opacity-60 mt-1">Impact analysis</div>
                </div>
              </div>
            </button>

            {/* Solutions Card */}
            <button
              onClick={() => { setCurrentCardIndex(3); setStoryMode(true); }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-5 text-left text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] aspect-square"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">{data.solutions.length}</div>
                  <div className="text-sm opacity-80">Solutions</div>
                  <div className="text-xs opacity-60 mt-1">Take action</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* View all button */}
        <Button
          onClick={() => { setCurrentCardIndex(0); setStoryMode(true); }}
          className="w-full"
          size="lg"
        >
          <span className="mr-2">▶</span>
          View Full Story
        </Button>

        {/* Last updated */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default Environment;