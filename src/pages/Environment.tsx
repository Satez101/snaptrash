import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Wind,
  Thermometer,
  Droplets,
  Factory,
  MapPin,
  Loader2,
  RefreshCw,
  Search,
  Navigation,
  Sparkles,
  CloudSun,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface EnvironmentResponse {
  success: boolean;
  location: LocationData | null;
  airQuality: AirQualityData;
  weather: WeatherData;
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
  if (aqi <= 50) return "text-[hsl(142,76%,36%)]";
  if (aqi <= 100) return "text-[hsl(48,96%,53%)]";
  if (aqi <= 150) return "text-[hsl(25,95%,53%)]";
  return "text-[hsl(0,84%,60%)]";
};

const getAqiBg = (aqi: number | null) => {
  if (aqi === null) return "bg-muted/30";
  if (aqi <= 50) return "bg-[hsl(142,76%,36%,0.1)]";
  if (aqi <= 100) return "bg-[hsl(48,96%,53%,0.1)]";
  if (aqi <= 150) return "bg-[hsl(25,95%,53%,0.1)]";
  return "bg-[hsl(0,84%,60%,0.1)]";
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

  // Request GPS location
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
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
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
      toast.success("Location enabled");
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
      toast.success("Environment data loaded!");
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
            Real-time air quality, weather, and environmental insights for your location
          </p>
        </div>

        {/* Location Setup - Only show if no coords */}
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
                    We need your location to show environmental data for your area
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

        {/* Location Card - Show when we have coords */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Environment Data Cards */}
        {envData && !isLoading && (
          <div className="space-y-6 animate-fade-in">
            {/* AI Summary Card */}
            <div className="glass-card p-6 border-l-4 border-primary">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">AI Summary</h3>
                  <p className="text-muted-foreground leading-relaxed">{envData.summary}</p>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    AI-generated based on real data from your location
                  </p>
                </div>
              </div>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Air Quality Card */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", getAqiBg(envData.airQuality.aqi))}>
                    <Wind className={cn("w-6 h-6", getAqiColor(envData.airQuality.aqi))} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Air Quality</h3>
                    <p className="text-sm text-muted-foreground">
                      {envData.airQuality.available ? envData.airQuality.category : 'No Data'}
                    </p>
                  </div>
                </div>

                {envData.airQuality.available && envData.airQuality.aqi !== null ? (
                  <div className="space-y-4">
                    <div className={cn("text-center py-4 rounded-xl", getAqiBg(envData.airQuality.aqi))}>
                      <p className={cn("font-display text-5xl font-bold", getAqiColor(envData.airQuality.aqi))}>
                        {envData.airQuality.aqi}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">AQI Index</p>
                    </div>
                    
                    {(envData.airQuality.pm25 || envData.airQuality.pm10) && (
                      <div className="grid grid-cols-2 gap-2 text-center">
                        {envData.airQuality.pm25 !== null && (
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="font-semibold text-foreground">{envData.airQuality.pm25}</p>
                            <p className="text-xs text-muted-foreground">PM2.5 µg/m³</p>
                          </div>
                        )}
                        {envData.airQuality.pm10 !== null && (
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="font-semibold text-foreground">{envData.airQuality.pm10}</p>
                            <p className="text-xs text-muted-foreground">PM10 µg/m³</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {envData.airQuality.source && (
                      <p className="text-xs text-muted-foreground text-center">
                        Source: {envData.airQuality.source}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-muted/20 rounded-xl">
                    <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      {envData.airQuality.message || 'No monitoring stations nearby'}
                    </p>
                  </div>
                )}
              </div>

              {/* Weather Card */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[hsl(var(--eco-solar)/0.1)] flex items-center justify-center">
                    <CloudSun className="w-6 h-6 text-[hsl(var(--eco-solar))]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Weather</h3>
                    <p className="text-sm text-muted-foreground">
                      {envData.weather.available ? envData.weather.description : 'No Data'}
                    </p>
                  </div>
                </div>

                {envData.weather.available ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-4 rounded-xl bg-muted/30">
                        <Thermometer className="w-5 h-5 text-[hsl(var(--eco-solar))] mx-auto mb-1" />
                        <p className="font-display text-2xl font-bold text-foreground">
                          {envData.weather.temperature}°C
                        </p>
                        <p className="text-xs text-muted-foreground">Temperature</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-muted/30">
                        <Droplets className="w-5 h-5 text-[hsl(var(--eco-water))] mx-auto mb-1" />
                        <p className="font-display text-2xl font-bold text-foreground">
                          {envData.weather.humidity}%
                        </p>
                        <p className="text-xs text-muted-foreground">Humidity</p>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-primary/5 text-center">
                      <p className="text-sm text-muted-foreground">
                        Feels like <span className="font-semibold text-foreground">{envData.weather.feelsLike}°C</span>
                        {' • '}Wind <span className="font-semibold text-foreground">{envData.weather.windSpeed} km/h</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-muted/20 rounded-xl">
                    <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      {envData.weather.message || 'Weather data unavailable'}
                    </p>
                  </div>
                )}
              </div>

              {/* Area Type Card */}
              {envData.location && (
                <div className="glass-card p-6 md:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[hsl(var(--eco-earth)/0.1)] flex items-center justify-center">
                      <Factory className="w-6 h-6 text-[hsl(var(--eco-earth))]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Local Environment Context</h3>
                      <p className="text-sm text-muted-foreground">AI-assisted classification</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                    <div className="w-16 h-16 rounded-xl bg-[hsl(var(--eco-earth)/0.1)] flex items-center justify-center">
                      <span className="font-display text-xl font-bold text-[hsl(var(--eco-earth))]">
                        {envData.location.areaType.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-foreground">{envData.location.areaType} Zone</p>
                      <p className="text-sm text-muted-foreground">
                        Based on OpenStreetMap land use classification
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State - When location set but no data fetched */}
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