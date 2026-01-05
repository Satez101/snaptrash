import { Link, useLocation } from "react-router-dom";
import { Home, Camera, Leaf, Gift, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isCenter?: boolean;
}

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Don't show on auth page or when not logged in
  if (!user || location.pathname === "/auth") {
    return null;
  }

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/rewards", label: "Rewards", icon: Gift },
    { href: "/scanner", label: "Snap", icon: Camera, isCenter: true },
    { href: "/environment", label: "Environ", icon: Leaf },
    { href: "/leaderboard", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/30" />
      
      {/* Safe area padding for iOS */}
      <div className="relative px-2 pb-safe">
        <div className="flex items-end justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            if (item.isCenter) {
              // Floating action button for Snap
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="relative -mt-6 group"
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-primary/40 blur-xl scale-150 opacity-60 group-hover:opacity-80 transition-opacity" />
                  
                  {/* Main button */}
                  <div className={cn(
                    "relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
                    "bg-gradient-to-br from-primary via-primary to-accent",
                    "shadow-[0_4px_20px_hsl(var(--primary)/0.5)]",
                    "group-hover:scale-110 group-hover:shadow-[0_6px_30px_hsl(var(--primary)/0.7)]",
                    "group-active:scale-95",
                    isActive && "ring-2 ring-primary-foreground/30 ring-offset-2 ring-offset-background"
                  )}>
                    <Icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  
                  {/* Label */}
                  <span className={cn(
                    "absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold whitespace-nowrap",
                    "text-primary"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            // Regular nav items
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300",
                  "group relative min-w-[60px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary animate-scale-in" />
                )}
                
                {/* Icon container */}
                <div className={cn(
                  "relative p-2 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-primary/15 scale-110" 
                    : "group-hover:bg-muted/50 group-hover:scale-105"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive && "drop-shadow-[0_0_8px_hsl(var(--primary)/0.8)]"
                  )} />
                </div>
                
                {/* Label */}
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-300",
                  isActive ? "font-semibold" : "group-hover:text-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
