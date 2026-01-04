import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
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
    Sparkles,
    Shield,
    Leaf,
    Navigation,
    ArrowLeft,
    Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

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
    pollutionRisk?: string;
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

interface CityResult {
    name: string;
    latitude: number;
    longitude: number;
    admin1?: string;
    country?: string;
}

const Environment = () => {
    const { profile, refreshProfile } = useAuth();
    const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
    const [coords, setCoords] = useState<{ latitude: number; longitude: number; city?: string; state?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [environmentData, setEnvironmentData] = useState<EnvironmentData | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [showCitySearch, setShowCitySearch] = useState(false);
    const [cityQuery, setCityQuery] = useState("");
    const [cityResults, setCityResults] = useState<CityResult[]>([]);
    const [searchingCity, setSearchingCity] = useState(false);

    // Check for saved location in profile and permission status on mount
    useEffect(() => {
        // Check if profile has saved location
        if (profile?.latitude && profile?.longitude) {
            setCoords({
                latitude: profile.latitude,
                longitude: profile.longitude,
                city: profile.city || undefined,
                state: profile.state || undefined,
            });
            setLocationPermission('granted');
            setHasRequestedPermission(true);
        }

        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                if (result.state === 'granted' && !coords) {
                    setLocationPermission('granted');
                } else if (result.state === 'denied') {
                    setLocationPermission('denied');
                    setShowCitySearch(true);
                }
            }).catch(() => {
                // Fallback if permissions API is not supported
            });
        }
    }, [profile]);

    // Save location to profile
    const saveLocationToProfile = useCallback(async (location: { latitude: number; longitude: number; city?: string; state?: string }) => {
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
            console.error('Error saving location:', err);
        }
    }, [profile?.user_id, refreshProfile]);

    const requestLocationPermission = useCallback(async () => {
        if (!navigator.geolocation) {
            setLocationPermission('denied');
            setError('Geolocation is not supported by your browser.');
            setShowCitySearch(true);
            toast.error('Geolocation not supported');
            return;
        }

        setHasRequestedPermission(true);
        setError(null);

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Location request timed out'));
                }, 10000);

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
                        maximumAge: 300000,
                    }
                );
            });

            const newCoords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            };
            setCoords(newCoords);
            setLocationPermission('granted');
            setShowCitySearch(false);
            
            // Save to profile
            await saveLocationToProfile(newCoords);
            
            toast.success('Location enabled successfully');
        } catch (err) {
            const error = err as GeolocationPositionError;
            if (error.code === error.PERMISSION_DENIED) {
                setLocationPermission('denied');
                setShowCitySearch(true);
                setError('Location permission was denied. You can search for your city instead.');
                toast.error('Location permission denied');
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                setShowCitySearch(true);
                setError('Location information is unavailable. You can search for your city instead.');
                toast.error('Location unavailable');
            } else if (error.code === error.TIMEOUT) {
                setShowCitySearch(true);
                setError('Location request timed out. You can search for your city instead.');
                toast.error('Location request timed out');
            } else {
                setShowCitySearch(true);
                setError('Failed to get your location. You can search for your city instead.');
                toast.error('Failed to get location');
            }
        }
    }, [saveLocationToProfile]);

    // City search functionality
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
            console.error("City search error:", err);
            toast.error("Failed to search cities");
        } finally {
            setSearchingCity(false);
        }
    }, [cityQuery]);

    const selectCity = useCallback(async (city: CityResult) => {
        const newCoords = {
            latitude: city.latitude,
            longitude: city.longitude,
            city: city.name,
            state: city.admin1 || city.country,
        };
        setCoords(newCoords);
        setLocationPermission('granted');
        setHasRequestedPermission(true);
        setShowCitySearch(false);
        setCityResults([]);
        setCityQuery("");

        // Save to profile
        await saveLocationToProfile(newCoords);

        toast.success(`Location set to ${city.name}`);
    }, [saveLocationToProfile]);

    const fetchEnvironmentData = useCallback(async () => {
        if (!coords) {
            toast.error('Location is required to fetch environmental data');
            return;
        }

        if (isFetching) {
            return; // Prevent multiple simultaneous requests
        }

        setIsFetching(true);
        setIsLoading(true);
        setError(null);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

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
                toast.error('Request timed out');
            } else {
                setError(error.message || 'Failed to fetch environmental data. Please try again.');
                toast.error('Failed to fetch data');
            }
        } finally {
            setIsLoading(false);
            setIsFetching(false);
        }
    }, [coords, isFetching]);

    const getAqiColor = (aqi: number) => {
        if (aqi <= 50) return 'text-green-500';
        if (aqi <= 100) return 'text-yellow-500';
        if (aqi <= 150) return 'text-orange-500';
        return 'text-red-500';
    };

    const getAqiBgColor = (aqi: number) => {
        if (aqi <= 50) return 'bg-green-500/10 border-green-500/20';
        if (aqi <= 100) return 'bg-yellow-500/10 border-yellow-500/20';
        if (aqi <= 150) return 'bg-orange-500/10 border-orange-500/20';
        return 'bg-red-500/10 border-red-500/20';
    };

    const getAqiBadgeColor = (aqi: number) => {
        if (aqi <= 50) return 'bg-green-500/20 text-green-400 border-green-500/30';
        if (aqi <= 100) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        if (aqi <= 150) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    };

    const getWaterRiskColor = (risk: string) => {
        if (risk === 'Low') return 'text-green-400';
        if (risk === 'Medium') return 'text-yellow-400';
        return 'text-red-400';
    };

    const getWaterRiskBg = (risk: string) => {
        if (risk === 'Low') return 'bg-green-500/10 border-green-500/20';
        if (risk === 'Medium') return 'bg-yellow-500/10 border-yellow-500/20';
        return 'bg-red-500/10 border-red-500/20';
    };

    const getPollutionRiskColor = (risk?: string) => {
        if (!risk) return 'text-muted-foreground';
        if (risk === 'Low') return 'text-green-400';
        if (risk === 'Medium') return 'text-yellow-400';
        return 'text-red-400';
    };

    // Loading skeleton component
    const LoadingSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="glass-card animate-pulse">
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 bg-gradient-hero">
            <div className="max-w-6xl mx-auto">
                {/* Back Link */}
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 opacity-0 animate-fade-in"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Dashboard</span>
                </Link>

                {/* Hero Header - Always Visible */}
                <div className="text-center mb-12 opacity-0 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-primary mb-6 shadow-[0_0_40px_hsl(var(--primary)/0.3)]">
                        <Leaf className="w-10 h-10 text-primary-foreground icon-float" />
                    </div>
                    <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
                        <span className="gradient-text-eco">Environment Insights</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Live environmental data and AI-powered insights for your area
                    </p>
                </div>

                {/* Location Permission Section */}
                {locationPermission === 'prompt' && !hasRequestedPermission && (
                    <Card className="glass-card mb-8 opacity-0 animate-scale-in" style={{ animationDelay: '0.2s' }}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <MapPin className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <div>Enable Live Location</div>
                                    <CardDescription className="mt-1">
                                        We need your location to provide accurate environmental insights
                                    </CardDescription>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={requestLocationPermission}
                                    size="lg"
                                    className="btn-gradient-eco gap-2"
                                >
                                    <Navigation className="w-5 h-5" />
                                    Enable GPS Location
                                </Button>
                                <Button
                                    onClick={() => setShowCitySearch(true)}
                                    variant="outline"
                                    size="lg"
                                    className="gap-2"
                                >
                                    <Search className="w-5 h-5" />
                                    Search City Instead
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* City Search Section */}
                {showCitySearch && !coords && (
                    <Card className="glass-card mb-8 opacity-0 animate-scale-in" style={{ animationDelay: '0.2s' }}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Search className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <div>Search Your City</div>
                                    <CardDescription className="mt-1">
                                        Enter your city name to get environmental insights
                                    </CardDescription>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter city name..."
                                    value={cityQuery}
                                    onChange={(e) => setCityQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchCity()}
                                    className="flex-1"
                                />
                                <Button onClick={searchCity} disabled={searchingCity} className="gap-2">
                                    {searchingCity ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4" />
                                    )}
                                    Search
                                </Button>
                            </div>
                            
                            {cityResults.length > 0 && (
                                <div className="space-y-2">
                                    {cityResults.map((city, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => selectCity(city)}
                                            className="w-full text-left p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50"
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
                                onClick={requestLocationPermission}
                                className="w-full gap-2"
                            >
                                <Navigation className="w-4 h-4" />
                                Try GPS Instead
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Location Denied Message with City Search Option */}
                {locationPermission === 'denied' && !showCitySearch && !coords && (
                    <Alert className="glass-card border-yellow-500/50 bg-yellow-500/10 mb-8 opacity-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                        <AlertDescription className="text-base flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <span>Location permission was denied.</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCitySearch(true)}
                                className="gap-2"
                            >
                                <Search className="w-4 h-4" />
                                Search City Instead
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Location Enabled - Fetch Button */}
                {locationPermission === 'granted' && coords && (
                    <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between glass-card p-6 opacity-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <div className="text-sm font-medium">
                                    {coords.city ? `${coords.city}${coords.state ? `, ${coords.state}` : ''}` : 'Location Enabled'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setShowCitySearch(true);
                                    setCoords(null);
                                    setLocationPermission('prompt');
                                    setEnvironmentData(null);
                                    setSummary(null);
                                }}
                            >
                                Change
                            </Button>
                            <Button
                                onClick={fetchEnvironmentData}
                                disabled={isLoading || isFetching}
                                size="lg"
                                className="flex-1 sm:flex-initial btn-gradient-eco gap-2"
                            >
                                {isLoading || isFetching ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Fetching Data...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-5 h-5" />
                                        {environmentData ? 'Refresh Data' : 'Fetch Data'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <Alert variant="destructive" className="glass-card mb-8 opacity-0 animate-scale-in">
                        <XCircle className="w-5 h-5" />
                        <AlertDescription className="text-base">{error}</AlertDescription>
                    </Alert>
                )}

                {/* Loading State with Skeletons */}
                {isLoading && <LoadingSkeleton />}

                {/* Environment Data Cards */}
                {!isLoading && environmentData && (
                    <div className="space-y-6">
                        {/* AI Summary Card - Highlighted */}
                        {summary && (
                            <Card className={cn(
                                "glass-card border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
                                "opacity-0 animate-scale-in shadow-[0_0_40px_hsl(var(--primary)/0.2)]"
                            )} style={{ animationDelay: '0.1s' }}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
                                            <Sparkles className="w-6 h-6 text-primary-foreground" />
                                        </div>
                                        <div>
                                            <div>AI-Powered Summary</div>
                                            <CardDescription className="mt-1">Personalized environmental insights</CardDescription>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-base leading-relaxed whitespace-pre-line bg-background/30 p-4 rounded-xl border border-primary/10">
                                        {summary}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Air Quality Card */}
                            <Card className={cn(
                                "glass-card-hover opacity-0 animate-slide-up",
                                environmentData.airQuality && "hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)]"
                            )} style={{ animationDelay: '0.2s' }}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                            <Wind className="w-5 h-5 text-blue-400" />
                                        </div>
                                        Air Quality
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {environmentData.airQuality ? (
                                        <div className="space-y-4">
                                            <div className={cn("p-6 rounded-xl border-2", getAqiBgColor(environmentData.airQuality.aqi))}>
                                                <div className="flex items-baseline gap-2 mb-2">
                                                    <span className={cn("text-5xl font-bold", getAqiColor(environmentData.airQuality.aqi))}>
                                                        {environmentData.airQuality.aqi}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">AQI</span>
                                                </div>
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border",
                                                    getAqiBadgeColor(environmentData.airQuality.aqi)
                                                )}>
                                                    <Shield className="w-4 h-4" />
                                                    {environmentData.airQuality.category}
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {environmentData.airQuality.healthTip}
                                            </p>
                                            {(environmentData.airQuality.pm25 || environmentData.airQuality.pm10) && (
                                                <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
                                                    {environmentData.airQuality.pm25 && (
                                                        <div className="flex justify-between">
                                                            <span>PM2.5:</span>
                                                            <span className="font-medium">{environmentData.airQuality.pm25.toFixed(1)} µg/m³</span>
                                                        </div>
                                                    )}
                                                    {environmentData.airQuality.pm10 && (
                                                        <div className="flex justify-between">
                                                            <span>PM10:</span>
                                                            <span className="font-medium">{environmentData.airQuality.pm10.toFixed(1)} µg/m³</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                                            <p className="text-sm text-muted-foreground">Air quality data unavailable for this location.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Weather Card */}
                            <Card className={cn(
                                "glass-card-hover opacity-0 animate-slide-up"
                            )} style={{ animationDelay: '0.3s' }}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                            <Thermometer className="w-5 h-5 text-orange-400" />
                                        </div>
                                        Weather & Climate
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {environmentData.weather ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                                                    <div className="text-4xl font-bold mb-1">{environmentData.weather.temperature}°C</div>
                                                    <div className="text-xs text-muted-foreground">Temperature</div>
                                                </div>
                                                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                                                    <div className="text-4xl font-bold mb-1">{environmentData.weather.humidity}%</div>
                                                    <div className="text-xs text-muted-foreground">Humidity</div>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                                <div className="text-sm font-medium mb-1">
                                                    Feels like: <span className="text-primary">{environmentData.weather.feelsLike}°C</span>
                                                </div>
                                                <div className="text-sm text-muted-foreground capitalize">
                                                    {environmentData.weather.description}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                                            <p className="text-sm text-muted-foreground">
                                                Weather data unavailable. OpenWeatherMap API key may not be configured.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Local Area Insight Card */}
                            <Card className={cn(
                                "glass-card-hover opacity-0 animate-slide-up"
                            )} style={{ animationDelay: '0.4s' }}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                            <Factory className="w-5 h-5 text-purple-400" />
                                        </div>
                                        Local Area Insight
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {environmentData.location ? (
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                                                <div className="text-lg font-semibold capitalize mb-1">
                                                    {environmentData.location.industry}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {environmentData.location.locationName || 'Location classification'}
                                                </div>
                                            </div>
                                            {environmentData.location.pollutionRisk && (
                                                <div className={cn(
                                                    "p-4 rounded-xl border-2",
                                                    environmentData.location.pollutionRisk === 'Low' ? 'bg-green-500/10 border-green-500/20' :
                                                        environmentData.location.pollutionRisk === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/20' :
                                                            'bg-red-500/10 border-red-500/20'
                                                )}>
                                                    <div className="text-sm font-medium mb-1">Pollution Risk</div>
                                                    <div className={cn("text-lg font-semibold", getPollutionRiskColor(environmentData.location.pollutionRisk))}>
                                                        {environmentData.location.pollutionRisk}
                                                    </div>
                                                </div>
                                            )}
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                High-level classification based on the area's characteristics and land use patterns.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                                            <p className="text-sm text-muted-foreground">Industry data unavailable for this location.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Water & Environment Card */}
                            <Card className={cn(
                                "glass-card-hover opacity-0 animate-slide-up"
                            )} style={{ animationDelay: '0.5s' }}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                            <Droplets className="w-5 h-5 text-cyan-400" />
                                        </div>
                                        Water & Environment
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {environmentData.location ? (
                                        <div className="space-y-4">
                                            <div className={cn("p-6 rounded-xl border-2", getWaterRiskBg(environmentData.location.waterRisk))}>
                                                <div className="text-sm font-medium mb-2">Water Quality Risk</div>
                                                <div className={cn("text-3xl font-bold mb-2", getWaterRiskColor(environmentData.location.waterRisk))}>
                                                    {environmentData.location.waterRisk}
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                                <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                    <Leaf className="w-4 h-4 text-primary" />
                                                    Conservation Tip
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {environmentData.location.waterRisk === 'Low' &&
                                                        'Continue practicing water conservation. Fix leaks promptly and use water-efficient fixtures.'}
                                                    {environmentData.location.waterRisk === 'Medium' &&
                                                        'Be mindful of water usage and local water sources. Consider rainwater collection and reduce consumption during peak times.'}
                                                    {environmentData.location.waterRisk === 'High' &&
                                                        'Exercise caution with water sources. Follow local advisories, use water filters, and minimize non-essential usage.'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                                            <p className="text-sm text-muted-foreground">Water quality data unavailable for this location.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Empty State - When location is enabled but no data fetched yet */}
                {!isLoading && !environmentData && locationPermission === 'granted' && coords && (
                    <Card className="glass-card opacity-0 animate-scale-in" style={{ animationDelay: '0.3s' }}>
                        <CardContent className="py-16 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                                <MapPin className="w-10 h-10 text-primary icon-float" />
                            </div>
                            <h3 className="font-display text-2xl font-semibold mb-2">Ready to Explore</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                Click "Fetch Environmental Data" to get real-time insights about air quality, weather, and environmental conditions in your area.
                            </p>
                            <Button
                                onClick={fetchEnvironmentData}
                                disabled={isLoading || isFetching}
                                size="lg"
                                className="btn-gradient-eco gap-2"
                            >
                                {isLoading || isFetching ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Fetching...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-5 h-5" />
                                        Fetch Environmental Data
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Initial Empty State - When location not enabled */}
                {!isLoading && !environmentData && locationPermission === 'prompt' && !hasRequestedPermission && (
                    <Card className="glass-card opacity-0 animate-scale-in" style={{ animationDelay: '0.3s' }}>
                        <CardContent className="py-16 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
                                <Navigation className="w-10 h-10 text-muted-foreground icon-float" />
                            </div>
                            <h3 className="font-display text-2xl font-semibold mb-2">Get Started</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                Enable location access to receive personalized environmental insights for your area.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Environment;
