import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Wind,
  Droplets,
  Factory,
  MapPin,
  Loader2,
  RefreshCw,
  Search,
  Navigation,
  Sparkles,
  Waves,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Heart,
  TreePine,
  Recycle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Types
interface LocationData {
  city: string;
  state: string;
  country: string;
  displayName: string;
  areaType: string;
}

interface AirQualityData {
  aqi: number | null;
  category: string;
  pm25: number | null;
  pm10: number | null;
  source: string | null;
  healthImpact: string;
  available: boolean;
  message?: string;
}

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  available: boolean;
  message?: string;
}

interface WaterBodyData {
  list: Array<{ name: string; type: string }>;
  pollutionLevel: string;
  pollutionReasons: string[];
  description: string;
  available: boolean;
}

interface IndustrialData {
  list: Array<{ name: string; type: string }>;
  pollutionTypes: string[];
  impactLevel: string;
  description: string;
  available: boolean;
}

interface SolutionsData {
  citizenActions: string[];
  initiatives: string[];
  snaptrashActions: string[];
}

interface EnvironmentResponse {
  success: boolean;
  location: LocationData | null;
  airQuality: AirQualityData;
  weather: WeatherData;
  waterBodies: WaterBodyData;
  industrial: IndustrialData;
  solutions: SolutionsData;
  summary: string;
  fetchedAt: string;
  error?: string;
}

interface CitySearchResult {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
}

interface UserCoords {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
}

// Helper functions
const getAqiColor = (aqi: number | null) => {
  if (aqi === null) return "text-muted-foreground";
  if (aqi <= 50) return "text-[hsl(var(--aqi-good))]";
  if (aqi <= 100) return "text-[hsl(var(--aqi-moderate))]";
  if (aqi <= 150) return "text-[hsl(var(--aqi-unhealthy-sensitive))]";
  if (aqi <= 200) return "text-[hsl(var(--aqi-unhealthy))]";
  if (aqi <= 300) return "text-[hsl(var(--aqi-very-unhealthy))]";
  return "text-[hsl(var(--aqi-hazardous))]";
};

const getAqiBg = (aqi: number | null) => {
  if (aqi === null) return "bg-muted/30";
  if (aqi <= 50) return "bg-[hsl(var(--aqi-good)/0.15)]";
  if (aqi <= 100) return "bg-[hsl(var(--aqi-moderate)/0.15)]";
  if (aqi <= 150) return "bg-[hsl(var(--aqi-unhealthy-sensitive)/0.15)]";
  if (aqi <= 200) return "bg-[hsl(var(--aqi-unhealthy)/0.15)]";
  if (aqi <= 300) return "bg-[hsl(var(--aqi-very-unhealthy)/0.15)]";
  return "bg-[hsl(var(--aqi-hazardous)/0.15)]";
};

const getPollutionLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'low': return 'text-[hsl(var(--aqi-good))]';
    case 'medium': return 'text-[hsl(var(--aqi-moderate))]';
    case 'high': return 'text-[hsl(var(--aqi-unhealthy))]';
    default: return 'text-muted-foreground';
  }
};

const getPollutionLevelBg = (level: string) => {
  switch (level.toLowerCase()) {
    case 'low': return 'bg-[hsl(var(--aqi-good)/0.15)]';
    case 'medium': return 'bg-[hsl(var(--aqi-moderate)/0.15)]';
    case 'high': return 'bg-[hsl(var(--aqi-unhealthy)/0.15)]';
    default: return 'bg-muted/30';
  }
};

const Environment = () => {
  const { profile, refreshProfile } = useAuth();
  
  // Location state
  const [coords, setCoords] = useState<UserCoords | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<CitySearchResult[]>([]);
  const [searchingCity, setSearchingCity] = useState(false);
  
  // Data state
  const [envData, setEnvData] = useState<EnvironmentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null);

  // Load saved location from profile on mount
  useEffect(() => {
    if (profile?.latitude && profile?.longitude) {
      setCoords({
        latitude: profile.latitude,
        longitude: profile.longitude,
        city: profile.city || undefined,
        state: profile.state || undefined,
      });
      setLocationStatus('granted');
    }
  }, [profile]);

  // Save location to profile
  const saveLocationToProfile = useCallback(async (location: UserCoords) => {
    if (!profile?.user_id) return;

    try {
      await supabase
        .from('profiles')
        .update({
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city || null,
          state: location.state || null,
          location_updated_at: new Date().toISOString(),
        })
        .eq('user_id', profile.user_id);
      
      await refreshProfile();
    } catch (err) {
      console.error('Failed to save location:', err);
    }
  }, [profile?.user_id, refreshProfile]);

  // Request GPS location with high accuracy
  const requestGPSLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error("GPS not supported in this browser");
      setShowCitySearch(true);
      return;
    }

    setLocationStatus('requesting');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const newCoords: UserCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setCoords(newCoords);
      setLocationStatus('granted');
      setShowCitySearch(false);
      
      await saveLocationToProfile(newCoords);
      toast.success("Location enabled with high accuracy");
    } catch (err) {
      setLocationStatus('denied');
      setShowCitySearch(true);
      toast.error("Location denied. Search for your city instead.");
    }
  }, [saveLocationToProfile]);

  // Search cities
  const searchCity = useCallback(async () => {
    if (!cityQuery.trim()) return;

    setSearchingCity(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery)}&count=5&language=en&format=json`
      );
      const data = await response.json();
      setCityResults(data.results || []);
    } catch (err) {
      toast.error("City search failed");
    } finally {
      setSearchingCity(false);
    }
  }, [cityQuery]);

  // Select a city
  const selectCity = useCallback(async (city: CitySearchResult) => {
    const newCoords: UserCoords = {
      latitude: city.latitude,
      longitude: city.longitude,
      city: city.name,
      state: city.admin1 || undefined,
      country: city.country || undefined,
    };

    setCoords(newCoords);
    setLocationStatus('granted');
    setShowCitySearch(false);
    setCityResults([]);
    setCityQuery("");

    await saveLocationToProfile(newCoords);
    toast.success(`Location set to ${city.name}`);
  }, [saveLocationToProfile]);

  // Fetch environment data
  const fetchEnvironmentData = useCallback(async () => {
    if (!coords) {
      toast.error("Enable location first");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('environment-intel', {
        body: { latitude: coords.latitude, longitude: coords.longitude },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      setEnvData(data);
      setLastFetchTime(new Date().toLocaleTimeString());
      toast.success("Environmental data loaded!");
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error("Failed to fetch environmental data");
    } finally {
      setIsLoading(false);
    }
  }, [coords]);

  // Change location
  const changeLocation = () => {
    setCoords(null);
    setEnvData(null);
    setLocationStatus('idle');
    setShowCitySearch(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[hsl(var(--eco-water))] to-[hsl(var(--eco-earth))] mb-6 shadow-lg">
            <Wind className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text-eco">Environment Intelligence</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Real-time environmental insights for your location - swipe through the cards to explore
          </p>
        </div>

        {/* Location Setup */}
        {!coords && (
          <div className="glass-card p-8 mb-8 animate-fade-in">
            {!showCitySearch ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-foreground mb-2">Enable Location</h3>
                  <p className="text-muted-foreground">
                    We need your precise location to show environmental data for your area
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={requestGPSLocation} 
                    disabled={locationStatus === 'requesting'}
                    className="gap-2"
                  >
                    {locationStatus === 'requesting' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                    Use GPS Location
                  </Button>
                  <Button variant="outline" onClick={() => setShowCitySearch(true)} className="gap-2">
                    <Search className="w-4 h-4" />
                    Search City
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-lg text-foreground">Find Your City</h3>
                  <p className="text-sm text-muted-foreground">Search by city name</p>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter city name..."
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchCity()}
                    className="flex-1"
                  />
                  <Button onClick={searchCity} disabled={searchingCity}>
                    {searchingCity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>

                {cityResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {cityResults.map((city, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectCity(city)}
                        className="w-full text-left p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <p className="font-medium text-foreground">{city.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {[city.admin1, city.country].filter(Boolean).join(', ')}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                <Button 
                  variant="ghost" 
                  onClick={requestGPSLocation}
                  disabled={locationStatus === 'requesting'}
                  className="w-full gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  Try GPS Instead
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Location Card */}
        {coords && (
          <div className="glass-card p-6 mb-6 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {envData?.location?.displayName || coords.city || 'Your Location'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
                    {lastFetchTime && ` • Updated ${lastFetchTime}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={changeLocation}>
                  Change
                </Button>
                <Button 
                  onClick={fetchEnvironmentData} 
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {envData ? 'Refresh' : 'Fetch Data'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-6 animate-fade-in">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="w-3 h-3 rounded-full" />
              ))}
            </div>
          </div>
        )}

        {/* Flashcards Carousel */}
        {envData && !isLoading && (
          <div className="animate-fade-in">
            {/* AI Summary */}
            <div className="glass-card p-6 mb-6 border-l-4 border-primary">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">AI Environmental Summary</h3>
                  <p className="text-muted-foreground leading-relaxed">{envData.summary}</p>
                </div>
              </div>
            </div>

            {/* Swipeable Flashcards */}
            <Carousel className="w-full" opts={{ align: "start", loop: true }}>
              <CarouselContent className="-ml-4">
                {/* Flashcard 1: Air Quality */}
                <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/2">
                  <div className="glass-card p-6 h-[420px] flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", getAqiBg(envData.airQuality.aqi))}>
                        <Wind className={cn("w-7 h-7", getAqiColor(envData.airQuality.aqi))} />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold text-foreground">Air Quality</h3>
                        <p className="text-sm text-muted-foreground">Real-time AQI monitoring</p>
                      </div>
                    </div>

                    {envData.airQuality.available && envData.airQuality.aqi !== null ? (
                      <div className="flex-1 flex flex-col">
                        <div className={cn("text-center py-6 rounded-2xl mb-4", getAqiBg(envData.airQuality.aqi))}>
                          <p className={cn("font-display text-6xl font-bold", getAqiColor(envData.airQuality.aqi))}>
                            {envData.airQuality.aqi}
                          </p>
                          <p className={cn("text-lg font-semibold mt-1", getAqiColor(envData.airQuality.aqi))}>
                            {envData.airQuality.category}
                          </p>
                        </div>
                        
                        <div className="space-y-3 flex-1">
                          <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/20">
                            <Heart className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">{envData.airQuality.healthImpact}</p>
                          </div>
                          
                          {(envData.airQuality.pm25 || envData.airQuality.pm10) && (
                            <div className="grid grid-cols-2 gap-2">
                              {envData.airQuality.pm25 !== null && (
                                <div className="p-3 rounded-lg bg-muted/30 text-center">
                                  <p className="font-semibold text-foreground">{envData.airQuality.pm25}</p>
                                  <p className="text-xs text-muted-foreground">PM2.5 µg/m³</p>
                                </div>
                              )}
                              {envData.airQuality.pm10 !== null && (
                                <div className="p-3 rounded-lg bg-muted/30 text-center">
                                  <p className="font-semibold text-foreground">{envData.airQuality.pm10}</p>
                                  <p className="text-xs text-muted-foreground">PM10 µg/m³</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center py-8">
                          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                          <p className="text-muted-foreground">
                            {envData.airQuality.message || 'No monitoring stations nearby'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CarouselItem>

                {/* Flashcard 2: Industrial Pollution */}
                <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/2">
                  <div className="glass-card p-6 h-[420px] flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--eco-earth)/0.15)] flex items-center justify-center">
                        <Factory className="w-7 h-7 text-[hsl(var(--eco-earth))]" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold text-foreground">Industrial Pollution</h3>
                        <p className="text-sm text-muted-foreground">Nearby industrial zones</p>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                      {/* Impact Level Badge */}
                      <div className={cn("text-center py-4 rounded-2xl mb-4", getPollutionLevelBg(envData.industrial.impactLevel))}>
                        <p className={cn("font-display text-3xl font-bold", getPollutionLevelColor(envData.industrial.impactLevel))}>
                          {envData.industrial.impactLevel}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Environmental Impact</p>
                      </div>

                      {/* Pollution Types */}
                      {envData.industrial.pollutionTypes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {envData.industrial.pollutionTypes.map((type, idx) => (
                            <span key={idx} className="px-3 py-1.5 rounded-full bg-[hsl(var(--eco-earth)/0.1)] text-sm text-[hsl(var(--eco-earth))] font-medium">
                              {type}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Industrial Sites List */}
                      {envData.industrial.list.length > 0 ? (
                        <div className="space-y-2 flex-1 overflow-y-auto max-h-32">
                          {envData.industrial.list.slice(0, 3).map((site, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-muted/20 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center">
                                <Factory className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm truncate">{site.name}</p>
                                <p className="text-xs text-muted-foreground">{site.type}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No major industrial zones detected within 10km
                        </p>
                      )}

                      {/* Description */}
                      <div className="mt-auto pt-4">
                        <p className="text-sm text-muted-foreground">{envData.industrial.description}</p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>

                {/* Flashcard 3: Water Bodies */}
                <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/2">
                  <div className="glass-card p-6 h-[420px] flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--eco-water)/0.15)] flex items-center justify-center">
                        <Waves className="w-7 h-7 text-[hsl(var(--eco-water))]" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold text-foreground">Water Bodies</h3>
                        <p className="text-sm text-muted-foreground">Rivers & lakes nearby</p>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                      {/* Pollution Level Badge */}
                      <div className={cn("text-center py-4 rounded-2xl mb-4", getPollutionLevelBg(envData.waterBodies.pollutionLevel))}>
                        <p className={cn("font-display text-3xl font-bold", getPollutionLevelColor(envData.waterBodies.pollutionLevel))}>
                          {envData.waterBodies.pollutionLevel}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">Estimated Pollution Level</p>
                      </div>

                      {/* Pollution Reasons */}
                      {envData.waterBodies.pollutionReasons.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {envData.waterBodies.pollutionReasons.map((reason, idx) => (
                            <span key={idx} className="px-3 py-1.5 rounded-full bg-[hsl(var(--eco-water)/0.1)] text-sm text-[hsl(var(--eco-water))] font-medium">
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Water Bodies List */}
                      {envData.waterBodies.list.length > 0 ? (
                        <div className="space-y-2 flex-1 overflow-y-auto max-h-32">
                          {envData.waterBodies.list.slice(0, 3).map((water, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-muted/20 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center">
                                <Droplets className="w-4 h-4 text-[hsl(var(--eco-water))]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm truncate">{water.name}</p>
                                <p className="text-xs text-muted-foreground">{water.type}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No major water bodies detected within 10km
                        </p>
                      )}

                      {/* Description */}
                      <div className="mt-auto pt-4">
                        <p className="text-sm text-muted-foreground">{envData.waterBodies.description}</p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>

                {/* Flashcard 4: Environmental Solutions */}
                <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/2">
                  <div className="glass-card p-6 h-[420px] flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                        <Lightbulb className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold text-foreground">Take Action</h3>
                        <p className="text-sm text-muted-foreground">Solutions & initiatives</p>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto">
                      {/* Citizen Actions */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TreePine className="w-4 h-4 text-[hsl(var(--eco-leaf))]" />
                          <p className="text-sm font-semibold text-foreground">What You Can Do</p>
                        </div>
                        <div className="space-y-2">
                          {envData.solutions.citizenActions.map((action, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-[hsl(var(--eco-leaf)/0.1)] text-sm text-foreground flex items-start gap-2">
                              <span className="text-[hsl(var(--eco-leaf))]">•</span>
                              {action}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Local Initiatives */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-[hsl(var(--eco-water))]" />
                          <p className="text-sm font-semibold text-foreground">Local Initiatives</p>
                        </div>
                        <div className="space-y-2">
                          {envData.solutions.initiatives.map((initiative, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-[hsl(var(--eco-water)/0.1)] text-sm text-foreground flex items-start gap-2">
                              <span className="text-[hsl(var(--eco-water))]">•</span>
                              {initiative}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SnapTrash Actions */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Recycle className="w-4 h-4 text-primary" />
                          <p className="text-sm font-semibold text-foreground">Use SnapTrash</p>
                        </div>
                        <div className="space-y-2">
                          {envData.solutions.snaptrashActions.map((action, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-primary/10 text-sm text-foreground flex items-start gap-2">
                              <span className="text-primary">•</span>
                              {action}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              </CarouselContent>
              
              <div className="flex items-center justify-center gap-4 mt-6">
                <CarouselPrevious className="static translate-y-0 h-10 w-10" />
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="w-2 h-2 rounded-full bg-muted" />
                  <div className="w-2 h-2 rounded-full bg-muted" />
                  <div className="w-2 h-2 rounded-full bg-muted" />
                </div>
                <CarouselNext className="static translate-y-0 h-10 w-10" />
              </div>
            </Carousel>

            {/* Swipe Hint */}
            <p className="text-center text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              Swipe or use arrows to explore all cards
              <ChevronRight className="w-4 h-4" />
            </p>
          </div>
        )}

        {/* Empty State */}
        {coords && !envData && !isLoading && (
          <div className="glass-card p-12 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Wind className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-semibold text-xl text-foreground mb-2">Ready to Explore</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Click "Fetch Data" to get real-time environmental insights for your location. 
              Data is only fetched when you request it.
            </p>
            <Button onClick={fetchEnvironmentData} size="lg" className="gap-2">
              <RefreshCw className="w-5 h-5" />
              Fetch Environmental Data
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Environment;
