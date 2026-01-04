import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Trash2, User, Trophy, Menu, X, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const ecoCredits = profile?.eco_creds || 0;

  const navLinks = user ? [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/scanner", label: "Scanner" },
    { href: "/rewards", label: "Rewards" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/settings", label: "Settings" },
  ] : [
    { href: "/", label: "Home" },
    { href: "/leaderboard", label: "Leaderboard" },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all duration-300">
              <Trash2 className="w-5 h-5 text-primary-foreground" />
              <div className="absolute inset-0 rounded-xl bg-gradient-primary opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">
              SnapTrash
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                  location.pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* EcoCredits Badge */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border/50">
                <Trophy className="w-4 h-4 text-warning" />
                <span className="text-sm font-semibold text-warning">{ecoCredits}</span>
              </div>
            )}

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium truncate max-w-[100px]">
                    {profile?.name || 'User'}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="glass" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-2 glass-card p-4 animate-scale-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                    location.pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 mt-2 pt-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-warning" />
                    <span className="text-sm font-semibold text-warning">{ecoCredits} SnapCreds</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;