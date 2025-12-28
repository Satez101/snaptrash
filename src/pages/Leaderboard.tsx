import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, Crown, TrendingUp, Leaf, Loader2, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderboardUser {
  id: string;
  name: string;
  eco_creds: number;
  total_scans: number;
  rank: number;
}

// Animated counter hook for smooth number transitions
const useAnimatedCounter = (end: number, duration: number = 1000) => {
  const [count, setCount] = useState(end);
  const prevEndRef = useRef(end);
  
  useEffect(() => {
    if (prevEndRef.current === end) return;
    
    const startValue = prevEndRef.current;
    const startTime = Date.now();
    const difference = end - startValue;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(startValue + difference * easeOut));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
    prevEndRef.current = end;
  }, [end, duration]);
  
  return count;
};

const motivationalQuotes = [
  "Small actions. Real impact.",
  "Every scan makes the planet cleaner.",
  "Be the change you wish to see.",
  "Together, we're building a greener future.",
];

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { user } = useAuth();
  const [quote] = useState(() => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);

  const fetchLeaderboard = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_leaderboard');

    if (error) {
      console.error('Error fetching leaderboard:', error);
    } else if (data) {
      setLeaderboardData(data.map((user: any) => ({
        ...user,
        rank: Number(user.rank)
      })));
    }
    setLoading(false);
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        () => fetchLeaderboard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  // Reorder top 3 for podium display: [2nd, 1st, 3rd]
  const getPodiumOrder = () => {
    const top3 = leaderboardData.slice(0, 3);
    if (top3.length < 3) return top3;
    return [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd
  };

  const podiumUsers = getPodiumOrder();
  const restUsers = leaderboardData.slice(3);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className={cn(
          "text-center mb-10 transition-all duration-700",
          hasLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-warm mb-6 shadow-lg shadow-warning/20">
            <Trophy className="w-10 h-10 text-warning-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            SnapTrash <span className="gradient-text-warm">Champions</span>
          </h1>
          <p className="text-muted-foreground">
            The eco-warriors leading the charge for a cleaner planet
          </p>
        </div>

        {/* Motivational Quote */}
        <div className={cn(
          "text-center mb-8 transition-all duration-1000 delay-300",
          hasLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}>
          <p className="text-sm text-muted-foreground/80 italic flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-warning/60" />
            "{quote}"
            <Sparkles className="w-4 h-4 text-warning/60" />
          </p>
        </div>

        {leaderboardData.length === 0 ? (
          <div className={cn(
            "glass-card p-12 text-center transition-all duration-500",
            hasLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Leaf className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-2xl font-bold mb-2">Be the First SnapTrash Champion! 🌱</h3>
            <p className="text-muted-foreground mb-6">
              Start scanning to climb the ranks and become the ultimate eco-warrior!
            </p>
            <Link to="/scanner">
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] transition-all duration-300 hover:-translate-y-0.5">
                <Leaf className="w-5 h-5" />
                Start Scanning
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Podium - Top 3 */}
            {podiumUsers.length > 0 && (
              <div className={cn(
                "flex justify-center items-end gap-3 md:gap-6 mb-10 px-2 transition-all duration-700 delay-200",
                hasLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}>
                {podiumUsers.map((userData, index) => {
                  // Map display index to actual rank: [0=2nd, 1=1st, 2=3rd]
                  const actualRank = index === 1 ? 1 : index === 0 ? 2 : 3;
                  const isFirst = actualRank === 1;
                  
                  return (
                    <PodiumCard
                      key={userData.id}
                      rank={actualRank}
                      name={userData.name}
                      ecoCredits={userData.eco_creds}
                      isFirst={isFirst}
                      isCurrentUser={user?.id === userData.id}
                      delayIndex={index}
                    />
                  );
                })}
              </div>
            )}

            {/* Rest of Leaderboard */}
            {restUsers.length > 0 && (
              <div className={cn(
                "glass-card overflow-hidden transition-all duration-700 delay-400",
                hasLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}>
                <div className="p-4 border-b border-border/50 bg-muted/20">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Rankings
                  </h3>
                </div>
                <div className="divide-y divide-border/20 max-h-[400px] overflow-y-auto scrollbar-thin">
                  {restUsers.map((userData, index) => (
                    <LeaderboardRow
                      key={userData.id}
                      rank={index + 4}
                      name={userData.name}
                      ecoCredits={userData.eco_creds}
                      scans={userData.total_scans}
                      index={index}
                      isCurrentUser={user?.id === userData.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer CTA */}
        <div className={cn(
          "text-center mt-12 transition-all duration-700 delay-500",
          hasLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <p className="text-muted-foreground mb-4">
            Keep scanning, keep climbing, keep saving the planet!
          </p>
          <Link to="/scanner">
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] transition-all duration-300 hover:-translate-y-0.5">
              <Leaf className="w-5 h-5" />
              Start Scanning
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

const PodiumCard = ({
  rank,
  name,
  ecoCredits,
  isFirst = false,
  isCurrentUser = false,
  delayIndex = 0,
}: {
  rank: number;
  name: string;
  ecoCredits: number;
  isFirst?: boolean;
  isCurrentUser?: boolean;
  delayIndex?: number;
}) => {
  const animatedCredits = useAnimatedCounter(ecoCredits, 1200);
  
  const getCardHeight = () => {
    switch (rank) {
      case 1: return "h-56 md:h-64";
      case 2: return "h-44 md:h-52";
      case 3: return "h-40 md:h-48";
      default: return "h-40";
    }
  };

  const getCardWidth = () => {
    switch (rank) {
      case 1: return "w-28 md:w-36";
      case 2: return "w-24 md:w-32";
      case 3: return "w-24 md:w-32";
      default: return "w-24";
    }
  };

  const getRingColor = () => {
    switch (rank) {
      case 1: return "ring-yellow-400/60 shadow-[0_0_40px_hsl(45,100%,50%,0.35)]";
      case 2: return "ring-gray-300/60 shadow-[0_0_30px_hsl(0,0%,75%,0.25)]";
      case 3: return "ring-amber-500/60 shadow-[0_0_25px_hsl(30,90%,45%,0.25)]";
      default: return "";
    }
  };

  const getAvatarGradient = () => {
    switch (rank) {
      case 1: return "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600";
      case 2: return "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-500";
      case 3: return "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700";
      default: return "bg-gradient-primary";
    }
  };

  const getAvatarTextColor = () => {
    switch (rank) {
      case 1: return "text-yellow-900";
      case 2: return "text-gray-800";
      case 3: return "text-amber-900";
      default: return "text-primary-foreground";
    }
  };

  const getBadgeStyle = () => {
    switch (rank) {
      case 1: return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900";
      case 2: return "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800";
      case 3: return "bg-gradient-to-r from-amber-500 to-amber-600 text-amber-100";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getAvatar = () => name.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "relative flex flex-col items-center",
        getCardWidth()
      )}
      style={{ 
        animationDelay: `${delayIndex * 150}ms`,
        animation: "podium-enter 0.6s ease-out forwards"
      }}
    >
      {/* Crown for Rank 1 */}
      {isFirst && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 animate-float">
          <Crown className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_hsl(45,100%,50%,0.6)]" />
        </div>
      )}

      {/* You Badge */}
      {isCurrentUser && (
        <div className="absolute -top-2 right-0 z-20 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center gap-1 shadow-lg">
          <Star className="w-2.5 h-2.5" />
          You
        </div>
      )}

      {/* Card */}
      <div
        className={cn(
          "glass-card w-full flex flex-col items-center justify-end p-4 ring-2 transition-all duration-500",
          getCardHeight(),
          getRingColor(),
          isCurrentUser && "ring-primary ring-offset-2 ring-offset-background"
        )}
        style={{
          animation: isFirst ? "gentle-float 4s ease-in-out infinite" : "gentle-float 5s ease-in-out infinite",
          animationDelay: `${delayIndex * 0.3}s`
        }}
      >
        {/* Avatar */}
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-bold mb-3 ring-2 ring-white/30 shadow-lg transition-transform duration-300",
            getAvatarGradient(),
            getAvatarTextColor(),
            isFirst ? "w-14 h-14 md:w-16 md:h-16 text-xl" : "w-12 h-12 md:w-14 md:h-14 text-lg"
          )}
        >
          {getAvatar()}
        </div>

        {/* Name */}
        <p className="font-medium text-sm text-center mb-1 w-full truncate px-1">{name}</p>

        {/* Credits with animation */}
        <p className={cn(
          "font-bold text-warning transition-all",
          isFirst ? "text-xl" : "text-lg"
        )}>
          {animatedCredits.toLocaleString()}
        </p>
        <p className="text-[10px] text-muted-foreground">SnapCreds</p>

        {/* Rank Badge */}
        <div
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold mt-2 shadow-md",
            getBadgeStyle()
          )}
        >
          {rank === 1 ? <Crown className="w-3.5 h-3.5" /> : <Medal className="w-3.5 h-3.5" />}
          <span>#{rank}</span>
        </div>
      </div>
    </div>
  );
};

const LeaderboardRow = ({
  rank,
  name,
  ecoCredits,
  scans,
  index,
  isCurrentUser = false,
}: {
  rank: number;
  name: string;
  ecoCredits: number;
  scans: number;
  index: number;
  isCurrentUser?: boolean;
}) => {
  const animatedCredits = useAnimatedCounter(ecoCredits, 1000);
  const getAvatar = () => name.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 transition-all duration-200 hover:bg-muted/30",
        isCurrentUser && "bg-primary/5 border-l-4 border-primary"
      )}
      style={{ 
        opacity: 0,
        animation: `fade-slide-in 0.4s ease-out forwards`,
        animationDelay: `${500 + index * 50}ms`
      }}
    >
      {/* Rank */}
      <div className="w-8 text-center font-display font-bold text-muted-foreground">
        #{rank}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-md flex-shrink-0">
        {getAvatar()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{name}</p>
          {isCurrentUser && (
            <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center gap-1 flex-shrink-0">
              <Star className="w-2.5 h-2.5" />
              You
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{scans} items scanned</p>
      </div>

      {/* Credits */}
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-warning">{animatedCredits.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">SnapCreds</p>
      </div>
    </div>
  );
};

export default Leaderboard;
