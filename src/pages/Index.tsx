import { Camera, MapPin, Sparkles } from "lucide-react";
import FeatureCard from "@/components/FeatureCard";

const Index = () => {
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
            <span className="gradient-text">Ecoza</span>
          </h1>

          {/* Quote */}
          <p className="text-xl md:text-2xl text-foreground/90 font-light mb-4 opacity-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            "The world doesn't need heroes.
            <br />
            <span className="gradient-text-accent font-medium">It needs people who act.</span>"
          </p>

          {/* Supporting Text */}
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-4 opacity-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            How do you want to save the Earth today?
          </p>

          {/* Motivational Micro-copy */}
          <p className="text-sm text-muted-foreground/70 italic opacity-0 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            Action beats awareness. Every scan counts.
          </p>
        </div>
      </section>

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
          <p className="text-muted-foreground text-lg">
            <span className="text-foreground font-medium">Small actions.</span>{" "}
            Real impact.{" "}
            <span className="gradient-text font-medium">Join the movement.</span>
          </p>
        </div>
      </section>
    </div>
  );
};

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <div className="font-display text-3xl md:text-4xl font-bold gradient-text mb-2">
      {value}
    </div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

export default Index;
