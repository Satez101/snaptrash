import { useState, useEffect } from "react";
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  ArrowLeft,
  Recycle,
  Clock,
  Trophy,
  CheckCircle2,
  XCircle,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DisposalMachine {
  id: string;
  name: string;
  location: string;
  distance: number;
  available: boolean;
  acceptedTypes: string[];
  rewardMultiplier: number;
  lastUpdated: string;
  coordinates: { lat: number; lng: number };
}

const wasteTypeColors: Record<string, string> = {
  "Plastic": "bg-[hsl(var(--eco-water)/0.1)] text-[hsl(var(--eco-water))]",
  "Glass": "bg-secondary/10 text-secondary",
  "Metal": "bg-muted text-muted-foreground",
  "Paper": "bg-[hsl(var(--eco-earth)/0.1)] text-[hsl(var(--eco-earth))]",
  "E-Waste": "bg-warning/10 text-warning",
  "Organic": "bg-accent/10 text-accent",
};

const Machines = () => {
  const [loading, setLoading] = useState(true);
  const [machines, setMachines] = useState<DisposalMachine[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<DisposalMachine | null>(null);

  const fetchMachines = async (lat: number, lng: number) => {
    try {
      const { data, error } = await supabase.functions.invoke("disposal-machines", {
        body: { latitude: lat, longitude: lng },
      });

      if (error) throw error;
      setMachines(data.machines || []);
    } catch (error) {
      console.error("Machines fetch error:", error);
      toast.error("Failed to fetch nearby machines");
    }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        await fetchMachines(latitude, longitude);
        setLoading(false);
      },
      (error) => {
        console.error("Location error:", error);
        toast.error("Please enable location services");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  const openDirections = (machine: DisposalMachine) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${machine.coordinates.lat},${machine.coordinates.lng}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Finding nearby disposal machines...</p>
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
          <div>
            <h1 className="font-display text-3xl font-bold gradient-text">Disposal Machines</h1>
            <p className="text-sm text-muted-foreground">
              {machines.length} Ecoza machines found nearby
            </p>
          </div>
        </div>

        {/* Machines List */}
        <div className="space-y-4">
          {machines.map((machine, index) => (
            <div
              key={machine.id}
              className="glass-card-hover p-5 opacity-0 animate-slide-up"
              style={{ animationDelay: `${0.1 * index}s` }}
              onClick={() => setSelectedMachine(selectedMachine?.id === machine.id ? null : machine)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      machine.available ? "bg-accent/10" : "bg-muted"
                    }`}>
                      <Recycle className={`w-5 h-5 ${machine.available ? "text-accent" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{machine.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {machine.location}
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Info */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      <Navigation className="w-3 h-3 inline mr-1" />
                      {machine.distance} km
                    </span>
                    <span className={machine.available ? "text-accent" : "text-destructive"}>
                      {machine.available ? (
                        <><CheckCircle2 className="w-3 h-3 inline mr-1" /> Available</>
                      ) : (
                        <><XCircle className="w-3 h-3 inline mr-1" /> Full</>
                      )}
                    </span>
                    <span className="text-warning">
                      <Trophy className="w-3 h-3 inline mr-1" />
                      {machine.rewardMultiplier}x rewards
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${
                  selectedMachine?.id === machine.id ? "rotate-90" : ""
                }`} />
              </div>

              {/* Expanded Details */}
              {selectedMachine?.id === machine.id && (
                <div className="mt-4 pt-4 border-t border-border/50 animate-fade-in">
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Accepted Waste Types</p>
                    <div className="flex flex-wrap gap-2">
                      {machine.acceptedTypes.map((type) => (
                        <span 
                          key={type} 
                          className={`px-3 py-1 rounded-full text-xs font-medium ${wasteTypeColors[type] || "bg-muted text-muted-foreground"}`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated {machine.lastUpdated}
                    </p>
                    <Button 
                      onClick={(e) => { e.stopPropagation(); openDirections(machine); }}
                      className="btn-gradient rounded-xl"
                      size="sm"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Directions
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {machines.length === 0 && (
          <div className="glass-card p-12 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">No machines found nearby</p>
            <p className="text-sm text-muted-foreground">
              Try expanding your search area or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Machines;
