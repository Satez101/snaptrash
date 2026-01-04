import { useState, useEffect } from "react";
import {
  Wind,
  Thermometer,
  Droplets,
  Factory,
  MapPin,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AirQuality {
  aqi: number;
  category: string;
  healthTip: string;
  pm25?: number;
  pm10?: number;
}

interface Weather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
}

interface Location {
  industry: string;
  waterRisk: string;
  locationName?: string;
}

interface EnvironmentData {
  airQuality: AirQuality | null;
  weather: Weather | null;
  location: Location | null;
}

interface EnvironmentResponse {
  success: boolean;
  data: EnvironmentData;
  summary?: string | null;
  error?: string;
}

const Environment = () => {
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [environmentData, setEnvironmentData] = useState<EnvironmentData | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  // Check location permission status on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          setLocationPermission('granted');
        } else if (result.state === 'denied') {
          setLocationPermission('denied');
        }
      }).catch(() => {
        // Fallback if permissions API is not supported
      });
    }
  }, []);

  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setHasRequestedPermission(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Location request timed out'));
        }, 10000); // 10 second timeout

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeout);
            resolve(pos);
          },
          (err) => {
            clearTimeout(timeout);
            reject(err);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
          }
        );
      });

      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setLocationPermission('granted');
    } catch (err) {
      const error = err as GeolocationPositionError;
      if (error.code === error.PERMISSION_DENIED) {
        setLocationPermission('denied');
        setError('Location permission was denied. Please enable location access in your browser settings.');
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        setError('Location information is unavailable. Please try again later.');
      } else if (error.code === error.TIMEOUT) {
        setError('Location request timed out. Please try again.');
      } else {
        setError('Failed to get your location. Please try again.');
      }
    }
  };

  const fetchEnvironmentData = async () => {
    if (!coords) {
      toast.error('Location is required to fetch environmental data');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Add timeout to the fetch call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const { data, error: supabaseError } = await supabase.functions.invoke('environment-insights', {
        body: { latitude: coords.latitude, longitude: coords.longitude },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (supabaseError) {
        throw new Error(supabaseError.message || 'Failed to fetch environment data');
      }

      const response = data as EnvironmentResponse;

      if (!response.success || response.error) {
        throw new Error(response.error || 'Failed to fetch environment data');
      }

      setEnvironmentData(response.data);
      setSummary(response.summary || null);
      toast.success('Environmental data fetched successfully!');
    } catch (err) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(error.message || 'Failed to fetch environmental data. Please try again.');
      }
      toast.error('Failed to fetch environmental data');
    } finally {
      setIsLoading(false);
    }
  };

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return 'text-green-600';
    if (aqi <= 100) return 'text-yellow-600';
    if (aqi <= 150) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAqiBgColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-green-100 dark:bg-green-900/20';
    if (aqi <= 100) return 'bg-yellow-100 dark:bg-yellow-900/20';
    if (aqi <= 150) return 'bg-orange-100 dark:bg-orange-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const getWaterRiskColor = (risk: string) => {
    if (risk === 'Low') return 'text-green-600';
    if (risk === 'Medium') return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text-eco">Environment Insights</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Get location-based environmental data and insights for your area
          </p>
        </div>

        {/* Location Permission Section */}
        {locationPermission === 'prompt' && !hasRequestedPermission && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location Permission Required
              </CardTitle>
              <CardDescription>
                We need your location to provide accurate environmental insights for your area.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={requestLocationPermission} className="w-full sm:w-auto">
                <MapPin className="w-4 h-4 mr-2" />
                Grant Location Permission
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Location Denied Message */}
        {locationPermission === 'denied' && (
          <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Location permission was denied. To use this feature, please enable location access in your browser settings and refresh the page.
            </AlertDescription>
          </Alert>
        )}

        {/* Fetch Data Button */}
        {locationPermission === 'granted' && coords && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
            </div>
            <Button
              onClick={fetchEnvironmentData}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fetching Data...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Fetch Environmental Data
                </>
              )}
            </Button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Environment Data Cards */}
        {!isLoading && environmentData && (
          <div className="space-y-6">
            {/* AI Summary */}
            {summary && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Environmental Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line">{summary}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Air Quality Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wind className="w-5 h-5" />
                    Air Quality
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {environmentData.airQuality ? (
                    <div className="space-y-4">
                      <div className={cn("p-4 rounded-lg", getAqiBgColor(environmentData.airQuality.aqi))}>
                        <div className="text-3xl font-bold mb-1">
                          <span className={getAqiColor(environmentData.airQuality.aqi)}>
                            {environmentData.airQuality.aqi}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">AQI</span>
                        </div>
                        <div className={cn("font-semibold", getAqiColor(environmentData.airQuality.aqi))}>
                          {environmentData.airQuality.category}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {environmentData.airQuality.healthTip}
                      </p>
                      {(environmentData.airQuality.pm25 || environmentData.airQuality.pm10) && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          {environmentData.airQuality.pm25 && (
                            <div>PM2.5: {environmentData.airQuality.pm25.toFixed(1)} µg/m³</div>
                          )}
                          {environmentData.airQuality.pm10 && (
                            <div>PM10: {environmentData.airQuality.pm10.toFixed(1)} µg/m³</div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Air quality data unavailable for this location.</p>
                  )}
                </CardContent>
              </Card>

              {/* Weather Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Thermometer className="w-5 h-5" />
                    Weather & Climate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {environmentData.weather ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold">{environmentData.weather.temperature}°C</div>
                          <div className="text-xs text-muted-foreground">Temperature</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{environmentData.weather.humidity}%</div>
                          <div className="text-xs text-muted-foreground">Humidity</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Feels like: {environmentData.weather.feelsLike}°C</div>
                        <div className="text-sm text-muted-foreground capitalize mt-1">
                          {environmentData.weather.description}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Weather data unavailable. OpenWeatherMap API key may not be configured.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Industry Insight Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Factory className="w-5 h-5" />
                    Local Industry Insight
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {environmentData.location ? (
                    <div className="space-y-2">
                      <div>
                        <div className="text-lg font-semibold capitalize">{environmentData.location.industry}</div>
                        <div className="text-sm text-muted-foreground">
                          {environmentData.location.locationName || 'Location classification'}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This is a high-level classification based on the area's characteristics.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Industry data unavailable for this location.</p>
                  )}
                </CardContent>
              </Card>

              {/* Water & Environment Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="w-5 h-5" />
                    Water & Environment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {environmentData.location ? (
                    <div className="space-y-4">
                      <div>
                        <div className={cn("text-lg font-semibold", getWaterRiskColor(environmentData.location.waterRisk))}>
                          Water Quality Risk: {environmentData.location.waterRisk}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {environmentData.location.waterRisk === 'Low' && 
                          'Water quality risk is low. Continue practicing water conservation.'}
                        {environmentData.location.waterRisk === 'Medium' && 
                          'Water quality risk is moderate. Be mindful of water usage and local water sources.'}
                        {environmentData.location.waterRisk === 'High' && 
                          'Water quality risk is high. Exercise caution with water sources and follow local advisories.'}
                      </p>
                      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        <strong>Conservation Tip:</strong> Reduce water waste by fixing leaks, using water-efficient fixtures, and collecting rainwater when possible.
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Water quality data unavailable for this location.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !environmentData && locationPermission === 'granted' && coords && (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Click "Fetch Environmental Data" to get insights for your location.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Environment;

