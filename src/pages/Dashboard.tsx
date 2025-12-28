import { Link } from "react-router-dom";
import { 
  Camera, 
  Trophy, 
  MapPin, 
  Wind, 
  MessageCircle, 
  Trash2,
  Sparkles,
  ArrowRight,
  Gift
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardCardProps {
  to: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  delay: string;
}

const DashboardCard = ({ to, icon, iconBg, title, subtitle, badge, badgeColor, delay }: DashboardCardProps) => (
  <Link 
    to={to}
    className="dashboard-card group opacity-0 animate-slide-up"
    style={{ animationDelay: delay }}
  >
    <div className={`dashboard-icon ${iconBg} group-hover:scale-110`}>
      {icon}
    </div>
    <div>
      <h3 className="font-display font-semibold text-lg text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
    {badge && (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
        {badge}
      </span>
    )}
    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
  </Link>
);

const Dashboard = () => {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="text-center mb-8 opacity-0 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Trash2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Welcome back, {profile?.name || 'Eco Warrior'}
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text-eco">SnapTrash Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Your hub for environmental action. Choose how you want to make an impact today.
          </p>
        </div>

        {/* Quick Stats */}
        {profile && (
          <div className="glass-card p-6 grid grid-cols-3 gap-4 mb-8 opacity-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-warning">{profile.eco_creds}</div>
              <div className="text-xs text-muted-foreground">SnapCreds</div>
            </div>
            <div className="text-center border-x border-border/50">
              <div className="font-display text-2xl font-bold text-primary">{profile.total_scans}</div>
              <div className="text-xs text-muted-foreground">Scans</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-accent">{profile.total_reports}</div>
              <div className="text-xs text-muted-foreground">Reports</div>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Waste Scanner */}
          <DashboardCard
            to="/scanner"
            icon={<Camera className="w-8 h-8 text-primary" />}
            iconBg="bg-primary/10"
            title="AI Waste Scanner"
            subtitle="Scan & identify waste with AI"
            badge="+10 SnapCreds"
            badgeColor="bg-primary/10 text-primary"
            delay="0.2s"
          />

          {/* Rewards Store */}
          <DashboardCard
            to="/rewards"
            icon={<Gift className="w-8 h-8 text-warning" />}
            iconBg="bg-warning/10"
            title="Rewards Store"
            subtitle="Spend your SnapCreds"
            badge="New"
            badgeColor="bg-warning/10 text-warning"
            delay="0.25s"
          />

          {/* Leaderboard */}
          <DashboardCard
            to="/leaderboard"
            icon={<Trophy className="w-8 h-8 text-accent" />}
            iconBg="bg-accent/10"
            title="Leaderboard"
            subtitle="Compete with eco champions"
            badge="Top 100"
            badgeColor="bg-accent/10 text-accent"
            delay="0.3s"
          />

          {/* Disposal Machines */}
          <DashboardCard
            to="/machines"
            icon={<MapPin className="w-8 h-8 text-[hsl(var(--eco-earth))]" />}
            iconBg="bg-[hsl(var(--eco-earth)/0.1)]"
            title="Disposal Machines"
            subtitle="Find nearby SnapTrash machines"
            badge="Near You"
            badgeColor="bg-[hsl(var(--eco-earth)/0.1)] text-[hsl(var(--eco-earth))]"
            delay="0.35s"
          />

          {/* Live Environment */}
          <DashboardCard
            to="/environment"
            icon={<Wind className="w-8 h-8 text-secondary" />}
            iconBg="bg-secondary/10"
            title="Live Environment"
            subtitle="AQI, solar & risk data"
            badge="Real-time"
            badgeColor="bg-secondary/10 text-secondary"
            delay="0.35s"
          />

          {/* SnapTrash Expert Chatbot */}
          <DashboardCard
            to="/chatbot"
            icon={<MessageCircle className="w-8 h-8 text-[hsl(var(--eco-water))]" />}
            iconBg="bg-[hsl(var(--eco-water)/0.1)]"
            title="SnapTrash Expert"
            subtitle="Environmental AI assistant"
            badge="New"
            badgeColor="bg-[hsl(var(--eco-water)/0.1)] text-[hsl(var(--eco-water))]"
            delay="0.4s"
          />

          {/* Civic Reports */}
          <DashboardCard
            to="/report"
            icon={<Sparkles className="w-8 h-8 text-[hsl(var(--eco-earth))]" />}
            iconBg="bg-[hsl(var(--eco-earth)/0.1)]"
            title="Civic Reports"
            subtitle="Report environmental issues"
            badge="+20 SnapCreds"
            badgeColor="bg-[hsl(var(--eco-earth)/0.1)] text-[hsl(var(--eco-earth))]"
            delay="0.45s"
          />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-2xl mx-auto mt-16 text-center opacity-0 animate-slide-up" style={{ animationDelay: '0.6s' }}>
        <p className="text-muted-foreground">
          <span className="text-foreground font-medium">Every action counts.</span>{" "}
          Start making a difference today.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;