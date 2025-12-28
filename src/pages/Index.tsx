import { Link } from "react-router-dom";
import { 
  Camera, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Leaf, 
  Wind, 
  MessageCircle,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import FeatureCard from "@/components/FeatureCard";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Hero Section */}
      <section className="relative px-4 py-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Join 10,000+ Eco Warriors
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-display text-6xl md:text-8xl font-bold mb-6 opacity-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span className="gradient-text-eco">Ecoza</span>
          </h1>

          {/* Quote */}
          <p className="text-xl md:text-2xl text-foreground/90 font-light mb-4 opacity-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            "The world doesn't need heroes.
            <br />
            <span className="gradient-text-accent font-medium">It needs people who act.</span>"
          </p>

          {/* Supporting Text */}
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-6 opacity-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            How do you want to save the Earth today?
          </p>

          {/* CTA Button */}
          <div className="opacity-0 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button className="btn-gradient-eco rounded-xl px-8 py-6 text-lg gap-2 hover:shadow-[0_0_40px_hsl(var(--primary)/0.4)] transition-all">
                {user ? "Open Dashboard" : "Get Started"}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Access Cards for Logged In Users */}
      {user && (
        <section className="px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <QuickAccessCard to="/trashemon" icon={<Camera className="w-6 h-6" />} label="Scan Waste" color="primary" />
              <QuickAccessCard to="/environment" icon={<Wind className="w-6 h-6" />} label="Environment" color="secondary" />
              <QuickAccessCard to="/chatbot" icon={<MessageCircle className="w-6 h-6" />} label="Ask Expert" color="accent" />
              <QuickAccessCard to="/machines" icon={<MapPin className="w-6 h-6" />} label="Find Machines" color="warning" />
            </div>
          </div>
        </section>
      )}

      {/* Feature Cards Section */}
      <section className="px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 opacity-0 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            {/* Trashemon Card */}
            <FeatureCard
              to="/trashemon"
              icon={<Camera className="w-7 h-7" />}
              title="Play Trashemon"
              subtitle="Scan. Learn. Act."
              description="Scan waste items with AI, learn proper disposal methods, earn EcoCreds, and climb the leaderboard!"
              points={10}
              variant="primary"
            />

            {/* Civic Report Card */}
            <FeatureCard
              to="/report"
              icon={<MapPin className="w-7 h-7" />}
              title="Civic Report"
              subtitle="See a problem? Fix it."
              description="Spot garbage in public spaces? Report it directly to your local municipality with one click!"
              points={20}
              variant="warm"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-0 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <StatItem value="50K+" label="Items Scanned" />
            <StatItem value="10K+" label="Active Users" />
            <StatItem value="2.5K" label="Reports Filed" />
            <StatItem value="100+" label="Cities Covered" />
          </div>
        </div>
      </section>

      {/* Bottom Motivational Section */}
      <section className="px-4 py-12">
        <div className="max-w-2xl mx-auto text-center opacity-0 animate-slide-up" style={{ animationDelay: '0.7s' }}>
          <p className="text-muted-foreground text-lg mb-6">
            <span className="text-foreground font-medium">Small actions.</span>{" "}
            Real impact.{" "}
            <span className="gradient-text font-medium">Join the movement.</span>
          </p>
          <Link to="/leaderboard">
            <Button variant="outline" className="rounded-xl gap-2">
              <Trophy className="w-4 h-4" />
              View Leaderboard
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

const QuickAccessCard = ({ to, icon, label, color }: { to: string; icon: React.ReactNode; label: string; color: string }) => (
  <Link to={to} className="glass-card-hover p-4 flex flex-col items-center gap-2 text-center">
    <div className={`w-12 h-12 rounded-xl bg-${color}/10 flex items-center justify-center text-${color}`}>
      {icon}
    </div>
    <span className="text-sm font-medium text-foreground">{label}</span>
  </Link>
);

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <div className="font-display text-3xl md:text-4xl font-bold gradient-text mb-2">
      {value}
    </div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

export default Index;
