import { useState, useEffect } from "react";
import { 
  Wind, 
  Sun, 
  AlertTriangle, 
  Factory,
  MapPin,
  Loader2,
  ArrowLeft,
  ThermometerSun,
  Droplets,
  Gauge,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EnvironmentData {
  aqi: number;
  aqiLevel: string;
  temperature: number;
  humidity: number;
  solarPotential: number;
  solarRating: string;
  industrialZones: { name: string; distance: number; riskLevel: string }[];
  riskIndicators: { type: string; level: string; description: string }[];
  location: string;
}

const getAqiClass = (aqi: number) => {
  if (aqi <= 50) return "aqi-good";
  if (aqi <= 100) return "aqi-moderate";
  if (aqi <= 150) return "aqi-unhealthy-sensitive";
  if (aqi <= 200) return "aqi-unhealthy";
  if (aqi <= 300) return "aqi-very-unhealthy";
  return "aqi-hazardous";
};

const getAqiLabel = (aqi: number) => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
};

const getRiskColor = (level: string) => {
  switch (level.toLowerCase()) {
    case "low": return "text-[hsl(var(--aqi-good))]";
    case "moderate": return "text-[hsl(var(--aqi-moderate))]";
    case "high": return "text-[hsl(var(--aqi-unhealthy))]";
    default: return "text-muted-foreground";
  }
};

const Environment = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<EnvironmentData | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

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

  const getLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        await fetchEnvironmentData(latitude, longitude);
        setLoading(false);
      },
      (error) => {
        console.error("Location error:", error);
        toast.error("Please enable location services");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const refresh = async () => {
    if (!coords) return;
    setRefreshing(true);
    await fetchEnvironmentData(coords.lat, coords.lng);
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  useEffect(() => {
    getLocation();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Fetching environment data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
          <p className="text-foreground font-medium mb-2">Unable to load data</p>
          <Button onClick={getLocation} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold gradient-text">Live Environment</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{data.location}</span>
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

        {/* Main AQI Card */}
        <div className="glass-card p-8 mb-6 text-center opacity-0 animate-slide-up">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Wind className="w-6 h-6 text-secondary" />
            <span className="text-sm font-medium text-muted-foreground">Air Quality Index</span>
          </div>
          <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getAqiClass(data.aqi)} mb-4`}>
            <span className="font-display text-5xl font-bold">{data.aqi}</span>
          </div>
          <p className="text-xl font-semibold text-foreground mb-2">{getAqiLabel(data.aqi)}</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {data.aqi <= 50 
              ? "Air quality is satisfactory. Enjoy outdoor activities!" 
              : data.aqi <= 100 
              ? "Acceptable quality. Sensitive individuals should limit prolonged outdoor exertion."
              : "Consider reducing outdoor activities, especially if you're sensitive to air pollution."}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4 text-center opacity-0 animate-slide-up stagger-1">
            <ThermometerSun className="w-6 h-6 text-warning mx-auto mb-2" />
            <div className="font-display text-2xl font-bold text-foreground">{data.temperature}°C</div>
            <div className="text-xs text-muted-foreground">Temperature</div>
          </div>
          <div className="glass-card p-4 text-center opacity-0 animate-slide-up stagger-2">
            <Droplets className="w-6 h-6 text-[hsl(var(--eco-water))] mx-auto mb-2" />
            <div className="font-display text-2xl font-bold text-foreground">{data.humidity}%</div>
            <div className="text-xs text-muted-foreground">Humidity</div>
          </div>
          <div className="glass-card p-4 text-center opacity-0 animate-slide-up stagger-3">
            <Sun className="w-6 h-6 text-[hsl(var(--eco-solar))] mx-auto mb-2" />
            <div className="font-display text-2xl font-bold text-foreground">{data.solarPotential}%</div>
            <div className="text-xs text-muted-foreground">Solar Potential</div>
          </div>
          <div className="glass-card p-4 text-center opacity-0 animate-slide-up stagger-4">
            <Gauge className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="font-display text-lg font-bold text-foreground">{data.solarRating}</div>
            <div className="text-xs text-muted-foreground">Solar Rating</div>
          </div>
        </div>

        {/* Industrial Zones */}
        <div className="glass-card p-6 mb-6 opacity-0 animate-slide-up stagger-5">
          <div className="flex items-center gap-2 mb-4">
            <Factory className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-display font-semibold text-lg">Nearby Industrial Zones</h2>
          </div>
          <div className="space-y-3">
            {data.industrialZones.map((zone, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="font-medium text-foreground">{zone.name}</p>
                  <p className="text-sm text-muted-foreground">{zone.distance} km away</p>
                </div>
                <span className={`text-sm font-medium ${getRiskColor(zone.riskLevel)}`}>
                  {zone.riskLevel} Risk
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Indicators */}
        <div className="glass-card p-6 opacity-0 animate-slide-up stagger-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h2 className="font-display font-semibold text-lg">Environmental Risk Indicators</h2>
          </div>
          <div className="space-y-3">
            {data.riskIndicators.map((indicator, i) => (
              <div key={i} className="glass-card p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">{indicator.type}</span>
                  <span className={`text-sm font-medium ${getRiskColor(indicator.level)}`}>
                    {indicator.level}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{indicator.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Environment;
