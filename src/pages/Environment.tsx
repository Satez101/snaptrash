import { useState, useEffect, useCallback, useRef } from "react";
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
  Navigation,
  ChevronLeft,
  ChevronRight,
  Search,
  MapPinned,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import AQIStoryCard from "@/components/environment/AQIStoryCard";
import IndustryStoryCard from "@/components/environment/IndustryStoryCard";
import WaterBodyStoryCard from "@/components/environment/WaterBodyStoryCard";
import SolutionsStoryCard from "@/components/environment/SolutionsStoryCard";
import LocationLoader from "@/components/environment/LocationLoader";
import { useUserGeminiKey } from "@/hooks/useUserGeminiKey";

interface SearchResult {
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
}

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

const getAqiLevel = (aqi: number) => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
};

const getAqiDescription = (aqi: number, city: string) => {
  if (aqi <= 50) return `Air quality in ${city} is excellent. Perfect for outdoor activities!`;
  if (aqi <= 100) return `Air quality in ${city} is acceptable. Sensitive individuals should limit prolonged outdoor exertion.`;
  if (aqi <= 150) return `Air quality in ${city} may affect sensitive groups. Consider reducing outdoor activities.`;
  if (aqi <= 200) return `Air quality in ${city} is unhealthy. Everyone should reduce prolonged outdoor exertion.`;
  return `Air quality in ${city} is hazardous. Avoid outdoor activities.`;
};

const getHealthAdvice = (aqi: number) => {
  if (aqi <= 50) return "Enjoy outdoor activities! Air quality is satisfactory.";
  if (aqi <= 100) return "Sensitive individuals should limit prolonged outdoor exertion.";
  if (aqi <= 150) return "People with respiratory issues should limit outdoor activities.";
  if (aqi <= 200) return "Everyone should reduce outdoor physical activities.";
  return "Stay indoors. Wear N95 masks if going outside is necessary.";
};

const Environment = () => {
  const { geminiApiKey } = useUserGeminiKey();
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState<"requesting" | "detecting" | "refining">("requesting");
  const [currentAccuracy, setCurrentAccuracy] = useState<number | undefined>(undefined);
  const [data, setData] = useState<EnvironmentData | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const bestAccuracyRef = useRef<number>(Infinity);

  const searchLocation = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      );
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
    setSearching(false);
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value);
    }, 300);
  };

  const selectLocation = async (result: SearchResult) => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    setLoading(true);
    setCoords({ lat: result.latitude, lng: result.longitude });
    toast.success(`Location set to ${result.name}`);
    await fetchEnvironmentData(result.latitude, result.longitude);
    setLoading(false);
  };

  const cardGradients = [
    "from-blue-600 via-blue-700 to-indigo-800",
    "from-orange-500 via-amber-600 to-red-700",
    "from-cyan-500 via-blue-600 to-blue-800",
    "from-emerald-500 via-green-600 to-teal-700",
  ];

  const cardIcons = [
    <Wind className="w-6 h-6 text-white" key="wind" />,
    <Factory className="w-6 h-6 text-white" key="factory" />,
    <Droplets className="w-6 h-6 text-white" key="water" />,
    <Lightbulb className="w-6 h-6 text-white" key="bulb" />,
  ];

  const cardTitles = ["Air Quality", "Industrial Impact", "Water Bodies", "Solutions"];

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    setLoading(true);
    setLocationError(null);
    setLocationStatus("requesting");
    bestAccuracyRef.current = Infinity;

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    stopWatching();

    const handlePosition = async (position: GeolocationPosition, isInitial: boolean) => {
      const { latitude, longitude, accuracy } = position.coords;
      setCurrentAccuracy(accuracy);

      // Only update if accuracy improved significantly (by at least 30%)
      const shouldUpdate = accuracy < bestAccuracyRef.current * 0.7 || isInitial;
      
      if (shouldUpdate) {
        bestAccuracyRef.current = accuracy;
        setCoords({ lat: latitude, lng: longitude });
        
        if (!isInitial) {
          setLocationStatus("refining");
        }
        
        await fetchEnvironmentData(latitude, longitude);
      }

      // Stop watching once we have good accuracy or after enough time
      if (accuracy <= 50) {
        stopWatching();
        setLoading(false);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      stopWatching();
      let message = "Unable to get your location";
      if (error.code === 1) {
        message = "Location permission denied. Please enable location access in your browser settings.";
      } else if (error.code === 2) {
        message = "Location unavailable. Please check your GPS/network settings.";
      } else if (error.code === 3) {
        message = "Location request timed out. Please try again.";
      }
      setLocationError(message);
      toast.error(message);
      setLoading(false);
    };

    try {
      setLocationStatus("detecting");
      
      // Get initial position quickly
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await handlePosition(position, true);
          
          const initialAccuracy = position.coords.accuracy;
          
          // If accuracy is poor, start watching for improvements
          if (initialAccuracy > 100) {
            setLocationStatus("refining");
            
            watchIdRef.current = navigator.geolocation.watchPosition(
              async (pos) => {
                await handlePosition(pos, false);
              },
              (err) => {
                console.log("Watch error:", err);
                // Don't treat watch errors as fatal if we already have a position
                if (coords) {
                  stopWatching();
                  setLoading(false);
                }
              },
              {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 20000,
              }
            );

            // Stop watching after 15 seconds regardless
            setTimeout(() => {
              if (watchIdRef.current !== null) {
                stopWatching();
                setLoading(false);
                if (bestAccuracyRef.current > 500) {
                  toast.info("GPS accuracy is limited. Use city search for better results.", { duration: 4000 });
                }
              }
            }, 15000);
          } else {
            setLoading(false);
          }
        },
        handleError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (error) {
      console.error("Location error:", error);
      setLocationError("An unexpected error occurred while getting your location.");
      setLoading(false);
    }
  }, [stopWatching, coords]);

  const fetchEnvironmentData = async (lat: number, lng: number) => {
    try {
      const { data: envData, error } = await supabase.functions.invoke("environment-data", {
        body: { latitude: lat, longitude: lng, userGeminiApiKey: geminiApiKey },
      });

      if (error) throw error;
      
      // Ensure AQI data has proper fallbacks with accurate descriptions
      const aqi = envData.airQuality?.aqi || 50;
      const city = envData.location?.city || "your area";
      
      const enhancedData = {
        ...envData,
        airQuality: {
          ...envData.airQuality,
          aqi,
          level: envData.airQuality?.level || getAqiLevel(aqi),
          description: envData.airQuality?.description || getAqiDescription(aqi, city),
          healthAdvice: envData.airQuality?.healthAdvice || getHealthAdvice(aqi),
          mainPollutants: envData.airQuality?.mainPollutants || ["PM2.5", "PM10", "NO₂"],
        }
      };
      
      setData(enhancedData);
    } catch (error) {
      console.error("Environment data error:", error);
      toast.error("Failed to fetch environment data");
    }
  };

  const refresh = async () => {
    if (!coords) return;
    toast.loading("Refreshing data...");
    await fetchEnvironmentData(coords.lat, coords.lng);
    toast.dismiss();
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
    return () => {
      stopWatching();
    };
  }, [requestLocationPermission, stopWatching]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") handleNextCard();
      else if (e.key === "ArrowLeft") handlePrevCard();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentCardIndex]);

  if (loading) {
    return <LocationLoader status={locationStatus} accuracy={currentAccuracy} />;
  }

  if (locationError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Location Required</h2>
          <p className="text-muted-foreground text-sm mb-4">{locationError || "Unable to load data"}</p>
          
          {/* Search box for manual location */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for a city..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 bg-card border border-border rounded-lg overflow-hidden shadow-lg">
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    onClick={() => selectLocation(result)}
                    className="w-full px-4 py-3 text-left hover:bg-accent/50 border-b border-border last:border-0 flex items-center gap-3"
                  >
                    <MapPinned className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">{result.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {result.admin1 ? `${result.admin1}, ` : ""}{result.country}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searching && (
              <div className="mt-2 flex items-center justify-center py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          
          <Button onClick={requestLocationPermission} className="w-full mb-2">
            <Navigation className="w-4 h-4 mr-2" /> Use GPS Location
          </Button>
          <Link to="/dashboard">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Search overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
          >
            <div className="p-4 max-w-md mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => setShowSearch(false)}>
                  <X className="w-5 h-5" />
                </Button>
                <h2 className="text-lg font-semibold">Search Location</h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search for a city..."
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-3 bg-card border border-border rounded-lg overflow-hidden shadow-lg">
                  {searchResults.map((result, i) => (
                    <button
                      key={i}
                      onClick={() => selectLocation(result)}
                      className="w-full px-4 py-3 text-left hover:bg-accent/50 border-b border-border last:border-0 flex items-center gap-3"
                    >
                      <MapPinned className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <p className="text-foreground font-medium">{result.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {result.admin1 ? `${result.admin1}, ` : ""}{result.country}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searching && (
                <div className="mt-4 flex items-center justify-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => {
                  setShowSearch(false);
                  requestLocationPermission();
                }}
              >
                <Navigation className="w-4 h-4 mr-2" /> Use GPS Instead
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        </Link>
        <button 
          onClick={() => setShowSearch(true)}
          className="text-center flex-1 px-4 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center justify-center gap-1 text-white/80 text-sm">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[200px]">
              {data.location.city || data.location.displayName}
            </span>
            <Search className="w-3 h-3 ml-1" />
          </div>
        </button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={refresh}
          className="rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="fixed top-16 left-4 right-4 flex gap-1 z-20">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: i < currentCardIndex ? "100%" : "0%" }}
              animate={{ width: i <= currentCardIndex ? "100%" : "0%" }}
              transition={{ duration: 0.3 }}
            />
          </div>
        ))}
      </div>

      {/* Story content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCardIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className={`min-h-screen pt-24 pb-24 px-4 bg-gradient-to-br ${cardGradients[currentCardIndex]}`}
        >
          {/* Card header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {cardIcons[currentCardIndex]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white font-display">{cardTitles[currentCardIndex]}</h2>
              <p className="text-white/70 text-sm">
                {currentCardIndex === 0 && `AQI: ${data.airQuality.aqi} • ${data.airQuality.level}`}
                {currentCardIndex === 1 && `${data.industries.length} industrial zones nearby`}
                {currentCardIndex === 2 && `${data.waterBodies.length} water sources analyzed`}
                {currentCardIndex === 3 && `${data.solutions.length} actions you can take`}
              </p>
            </div>
          </div>

          {/* Card content */}
          <div className="overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-thin pb-4">
            {currentCardIndex === 0 && <AQIStoryCard data={data.airQuality} />}
            {currentCardIndex === 1 && <IndustryStoryCard industries={data.industries} />}
            {currentCardIndex === 2 && <WaterBodyStoryCard waterBodies={data.waterBodies} />}
            {currentCardIndex === 3 && <SolutionsStoryCard solutions={data.solutions} />}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={handlePrevCard}
            disabled={currentCardIndex === 0}
            className="flex items-center gap-1 text-white/70 hover:text-white transition-colors disabled:opacity-30 px-4 py-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Previous</span>
          </button>
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                onClick={() => setCurrentCardIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === currentCardIndex ? 'bg-white w-6' : 'bg-white/40'}`}
              />
            ))}
          </div>
          <button
            onClick={handleNextCard}
            disabled={currentCardIndex === 3}
            className="flex items-center gap-1 text-white/70 hover:text-white transition-colors disabled:opacity-30 px-4 py-2"
          >
            <span className="text-sm">Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Touch areas for swipe navigation */}
      <div className="fixed inset-y-0 left-0 w-1/4 z-10 cursor-pointer" onClick={handlePrevCard} />
      <div className="fixed inset-y-0 right-0 w-1/4 z-10 cursor-pointer" onClick={handleNextCard} />
    </div>
  );
};

export default Environment;