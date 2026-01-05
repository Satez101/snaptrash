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
  ChevronRight,
  Cpu,
  Smartphone,
  Camera,
  Sparkles,
  Gift,
  Leaf,
  Search,
  MapPinned,
  ChevronDown,
  Zap,
  Target,
  Award,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface DisposalMachine {
  id: string;
  name: string;
  location: string;
  area: string;
  distance: number;
  available: boolean;
  acceptedTypes: string[];
  rewardMultiplier: number;
  lastUpdated: string;
  coordinates: { lat: number; lng: number };
  type: "mall" | "campus" | "municipal" | "park";
}

const wasteTypeColors: Record<string, string> = {
  "Plastic": "bg-[hsl(var(--eco-water)/0.15)] text-[hsl(var(--eco-water))]",
  "Glass": "bg-secondary/15 text-secondary",
  "Metal": "bg-muted text-muted-foreground",
  "Paper": "bg-[hsl(var(--eco-earth)/0.15)] text-[hsl(var(--eco-earth))]",
  "E-Waste": "bg-warning/15 text-warning",
  "Organic": "bg-accent/15 text-accent",
};

const typeIcons: Record<string, string> = {
  mall: "🏬",
  campus: "🎓",
  municipal: "🏛️",
  park: "🌳",
};

const howToSteps = [
  {
    step: 1,
    title: "Open SnapTrash App",
    description: "Launch the SnapTrash app on your phone",
    icon: Smartphone,
  },
  {
    step: 2,
    title: "Go to Scanner",
    description: "Navigate to the AI Waste Scanner",
    icon: Camera,
  },
  {
    step: 3,
    title: "Scan Your Waste",
    description: "Take a photo of the waste item",
    icon: Target,
  },
  {
    step: 4,
    title: "AI Identifies Waste",
    description: "Our AI tells you the category & disposal method",
    icon: Sparkles,
  },
  {
    step: 5,
    title: "Follow Guidance",
    description: "Get step-by-step disposal instructions",
    icon: CheckCircle2,
  },
  {
    step: 6,
    title: "Dispose Correctly",
    description: "Drop waste in the correct slot on machine",
    icon: Recycle,
  },
  {
    step: 7,
    title: "Earn SnapCreds! 🎉",
    description: "Get rewarded for proper disposal",
    icon: Gift,
  },
];

const Machines = () => {
  const [loading, setLoading] = useState(false);
  const [machines, setMachines] = useState<DisposalMachine[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<DisposalMachine | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<"intro" | "find" | "howto">("intro");

  const fetchMachines = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("disposal-machines", {
        body: { latitude: lat, longitude: lng },
      });

      if (error) throw error;
      setMachines(data.machines || []);
    } catch (error) {
      console.error("Machines fetch error:", error);
      toast.error("Failed to fetch nearby machines");
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    setLocationRequested(true);
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        await fetchMachines(latitude, longitude);
        setActiveSection("find");
      },
      (error) => {
        console.error("Location error:", error);
        toast.error("Please enable location services");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleManualSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a city or area");
      return;
    }
    // Simulate coordinates for manual search
    const lat = 28.6139 + (Math.random() - 0.5) * 0.1;
    const lng = 77.2090 + (Math.random() - 0.5) * 0.1;
    setCoords({ lat, lng });
    await fetchMachines(lat, lng);
    setActiveSection("find");
    toast.success(`Searching near ${searchQuery}`);
  };

  const openDirections = (machine: DisposalMachine) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${machine.coordinates.lat},${machine.coordinates.lng}`;
    window.open(url, "_blank");
  };

  const filteredMachines = machines.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center animate-float">
              <Cpu className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold gradient-text">SnapTrash Machines</h1>
              <p className="text-sm text-muted-foreground">
                Smart waste stations for real rewards
              </p>
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: "intro", label: "What is it?", icon: Sparkles },
            { id: "find", label: "Find Machines", icon: MapPin },
            { id: "howto", label: "How to Use", icon: Target },
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as typeof activeSection)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                activeSection === section.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <section.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{section.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Section 1: Introduction */}
          {activeSection === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Hero Card */}
              <div className="glass-card p-8 text-center">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-eco flex items-center justify-center mb-6 icon-pulse">
                  <Cpu className="w-12 h-12 text-primary-foreground" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-4 gradient-text-eco">
                  What is a SnapTrash Machine?
                </h2>
                <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  SnapTrash Machines are <span className="text-foreground font-medium">smart waste stations</span> placed in malls, 
                  campuses, parks, and public areas. Dispose waste correctly, earn SnapCreds instantly, 
                  and help the environment. It's recycling made rewarding! 🌱
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div 
                  className="glass-card p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Cpu className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">Smart Technology</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered machines that verify correct waste disposal and track your environmental impact.
                  </p>
                </motion.div>

                <motion.div 
                  className="glass-card p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-warning" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">Instant Rewards</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn SnapCreds immediately when you dispose waste correctly. Up to 2.5x multipliers!
                  </p>
                </motion.div>

                <motion.div 
                  className="glass-card p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <Leaf className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">Real Impact</h3>
                  <p className="text-sm text-muted-foreground">
                    Every item disposed correctly prevents pollution and supports sustainable recycling.
                  </p>
                </motion.div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => setActiveSection("find")} 
                  className="btn-gradient rounded-xl gap-2"
                  size="lg"
                >
                  <MapPin className="w-5 h-5" />
                  Find Nearby Machines
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveSection("howto")}
                  className="rounded-xl gap-2"
                  size="lg"
                >
                  <Target className="w-5 h-5" />
                  Learn How to Use
                </Button>
              </div>
            </motion.div>
          )}

          {/* Section 2: Find Nearby Machines */}
          {activeSection === "find" && (
            <motion.div
              key="find"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Location Request */}
              {!locationRequested ? (
                <div className="glass-card p-8 text-center">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
                    <MapPinned className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="font-display text-xl font-bold mb-3">Find Machines Near You</h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Enable location to discover SnapTrash SmartStations in your area, or search by city.
                  </p>
                  
                  <div className="flex flex-col gap-4 max-w-md mx-auto">
                    <Button 
                      onClick={requestLocation} 
                      className="btn-gradient rounded-xl gap-2"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                      Use My Location
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">or</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter city or area..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="glass-input"
                        onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                      />
                      <Button 
                        onClick={handleManualSearch} 
                        variant="outline" 
                        className="rounded-xl px-6"
                        disabled={loading}
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Search Bar */}
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search machines..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="glass-input pl-11"
                      />
                    </div>
                    <Button 
                      onClick={requestLocation} 
                      variant="outline" 
                      className="rounded-xl gap-2"
                      disabled={loading}
                    >
                      <Navigation className="w-4 h-4" />
                      Refresh
                    </Button>
                  </div>

                  {/* Loading State */}
                  {loading && (
                    <div className="glass-card p-12 text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">Finding nearby SnapTrash machines...</p>
                    </div>
                  )}

                  {/* Machines List */}
                  {!loading && filteredMachines.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {filteredMachines.length} machines found nearby
                      </p>
                      
                      {filteredMachines.map((machine, index) => (
                        <motion.div
                          key={machine.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="glass-card-hover p-5"
                          onClick={() => setSelectedMachine(selectedMachine?.id === machine.id ? null : machine)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                                  machine.available ? "bg-accent/10" : "bg-muted"
                                }`}>
                                  {typeIcons[machine.type]}
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
                              <div className="flex flex-wrap items-center gap-3 text-sm">
                                <span className="text-muted-foreground">
                                  <Navigation className="w-3 h-3 inline mr-1" />
                                  {machine.distance} km
                                </span>
                                <span className={machine.available ? "text-accent" : "text-destructive"}>
                                  {machine.available ? (
                                    <><CheckCircle2 className="w-3 h-3 inline mr-1" /> Active</>
                                  ) : (
                                    <><XCircle className="w-3 h-3 inline mr-1" /> Maintenance</>
                                  )}
                                </span>
                                <span className="text-warning">
                                  <Trophy className="w-3 h-3 inline mr-1" />
                                  {machine.rewardMultiplier}x SnapCreds
                                </span>
                              </div>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                              selectedMachine?.id === machine.id ? "rotate-180" : ""
                            }`} />
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {selectedMachine?.id === machine.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 pt-4 border-t border-border/50">
                                  <div className="mb-4">
                                    <p className="text-xs text-muted-foreground mb-2">Accepted Waste Types</p>
                                    <div className="flex flex-wrap gap-2">
                                      {machine.acceptedTypes.map((type) => (
                                        <span 
                                          key={type} 
                                          className={`px-3 py-1.5 rounded-full text-xs font-medium ${wasteTypeColors[type] || "bg-muted text-muted-foreground"}`}
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
                                      className="btn-gradient rounded-xl gap-2"
                                      size="sm"
                                    >
                                      <Navigation className="w-4 h-4" />
                                      Get Directions
                                      <ExternalLink className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Empty State */}
                  {!loading && filteredMachines.length === 0 && locationRequested && (
                    <div className="glass-card p-12 text-center">
                      <Cpu className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-foreground font-medium mb-2">No machines found nearby</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Be the first SnapTrash champion in your area! 🌱
                      </p>
                      <Button variant="outline" onClick={requestLocation} className="rounded-xl gap-2">
                        <Navigation className="w-4 h-4" />
                        Try Another Location
                      </Button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Section 3: How to Use */}
          {activeSection === "howto" && (
            <motion.div
              key="howto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="glass-card p-6 text-center mb-8">
                <h2 className="font-display text-2xl font-bold gradient-text mb-2">
                  How to Use a SnapTrash Machine
                </h2>
                <p className="text-muted-foreground">
                  Follow these simple steps to earn rewards for proper waste disposal
                </p>
              </div>

              {/* Steps Timeline */}
              <div className="space-y-4">
                {howToSteps.map((step, index) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-4"
                  >
                    {/* Step Number & Line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        step.step === 7 
                          ? "bg-gradient-warm text-warning-foreground" 
                          : "bg-primary/10 text-primary"
                      }`}>
                        <step.icon className="w-6 h-6" />
                      </div>
                      {index < howToSteps.length - 1 && (
                        <div className="w-0.5 h-12 bg-border/50 my-2" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="glass-card p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-primary">Step {step.step}</span>
                        </div>
                        <h3 className="font-display font-semibold text-foreground mb-1">
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pro Tips */}
              <div className="glass-card p-6 bg-accent/5 border-accent/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-accent mb-2">Pro Tips</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span>Clean containers before disposal for maximum SnapCreds</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span>Look for machines with higher reward multipliers (up to 2.5x!)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span>Separate mixed waste before scanning for accurate disposal</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/scanner">
                  <Button className="btn-gradient rounded-xl gap-2 w-full sm:w-auto" size="lg">
                    <Camera className="w-5 h-5" />
                    Open Scanner Now
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveSection("find")}
                  className="rounded-xl gap-2"
                  size="lg"
                >
                  <MapPin className="w-5 h-5" />
                  Find Nearby Machines
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Machines;