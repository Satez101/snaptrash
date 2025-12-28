import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, Crown, TrendingUp, Leaf, Loader2, Sparkles } from "lucide-react";
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

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [previousCreds, setPreviousCreds] = useState<Record<string, number>>({});
  const { user } = useAuth();

  const fetchLeaderboard = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_leaderboard');

    if (error) {
      console.error('Error fetching leaderboard:', error);
    } else if (data) {
      // Track previous credits for animation
      const prevCreds: Record<string, number> = {};
      leaderboardData.forEach(u => {
        prevCreds[u.id] = u.eco_creds;
      });
      setPreviousCreds(prevCreds);
      
      setLeaderboardData(data.map((user: any) => ({
        ...user,
        rank: Number(user.rank)
      })));
    }
    setLoading(false);
  }, [leaderboardData]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Real-time updates when profiles change
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
        () => {
          // Refetch leaderboard when any profile updates
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  const topThree = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);

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
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-warm mb-6 animate-float">
            <Trophy className="w-10 h-10 text-warning-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            SnapTrash <span className="gradient-text-warm">Champions</span>
          </h1>
          <p className="text-muted-foreground">
            The warriors leading the charge for a cleaner planet
          </p>
        </div>

        {leaderboardData.length === 0 ? (
          <div className="glass-card p-12 text-center animate-fade-in">
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
            {topThree.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8 h-64 items-end animate-fade-in" style={{ animationDelay: '0.1s' }}>
                {/* 2nd Place */}
                <div className="flex flex-col items-center">
                  <PodiumCard
                    rank={2}
                    name={topThree[1].name}
                    ecoCredits={topThree[1].eco_creds}
                    height="h-40"
                    isCurrentUser={user?.id === topThree[1].id}
                    previousCredits={previousCreds[topThree[1].id]}
                  />
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center">
                  <PodiumCard
                    rank={1}
                    name={topThree[0].name}
                    ecoCredits={topThree[0].eco_creds}
                    height="h-52"
                    isFirst
                    isCurrentUser={user?.id === topThree[0].id}
                    previousCredits={previousCreds[topThree[0].id]}
                  />
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center">
                  <PodiumCard
                    rank={3}
                    name={topThree[2].name}
                    ecoCredits={topThree[2].eco_creds}
                    height="h-32"
                    isCurrentUser={user?.id === topThree[2].id}
                    previousCredits={previousCreds[topThree[2].id]}
                  />
                </div>
              </div>
            )}

            {/* Handle less than 3 users */}
            {topThree.length > 0 && topThree.length < 3 && (
              <div className="flex justify-center gap-4 mb-8 animate-fade-in">
                {topThree.map((userData, index) => (
                  <div key={userData.id} className="flex flex-col items-center">
                    <PodiumCard
                      rank={index + 1}
                      name={userData.name}
                      ecoCredits={userData.eco_creds}
                      height={index === 0 ? "h-52" : "h-40"}
                      isFirst={index === 0}
                      isCurrentUser={user?.id === userData.id}
                      previousCredits={previousCreds[userData.id]}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Rest of Leaderboard */}
            {rest.length > 0 && (
              <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="p-4 border-b border-border/50">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Rankings
                  </h3>
                </div>
                <div className="divide-y divide-border/30 max-h-96 overflow-y-auto">
                  {rest.map((userData, index) => (
                    <LeaderboardRow
                      key={userData.id}
                      rank={index + 4}
                      name={userData.name}
                      ecoCredits={userData.eco_creds}
                      scans={userData.total_scans}
                      index={index}
                      isCurrentUser={user?.id === userData.id}
                      previousCredits={previousCreds[userData.id]}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Motivational Footer */}
        <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
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
  height,
  isFirst = false,
  isCurrentUser = false,
  previousCredits,
}: {
  rank: number;
  name: string;
  ecoCredits: number;
  height: string;
  isFirst?: boolean;
  isCurrentUser?: boolean;
  previousCredits?: number;
}) => {
  const [animateCredits, setAnimateCredits] = useState(false);
  
  useEffect(() => {
    if (previousCredits !== undefined && previousCredits !== ecoCredits) {
      setAnimateCredits(true);
      const timer = setTimeout(() => setAnimateCredits(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [ecoCredits, previousCredits]);

  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5" />;
      case 2:
      case 3:
        return <Medal className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getRankColor = () => {
    switch (rank) {
      case 1:
        return "bg-yellow-500 text-yellow-900";
      case 2:
        return "bg-gray-400 text-gray-900";
      case 3:
        return "bg-amber-600 text-amber-100";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getGlowStyle = () => {
    switch (rank) {
      case 1:
        return "shadow-[0_0_40px_hsl(45,95%,55%,0.4)] animate-pulse";
      case 2:
        return "shadow-[0_0_30px_hsl(0,0%,70%,0.3)]";
      case 3:
        return "shadow-[0_0_25px_hsl(30,80%,50%,0.3)]";
      default:
        return "";
    }
  };

  const getAvatar = () => name.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "glass-card w-full flex flex-col items-center justify-end p-4 transition-all duration-500",
        height,
        isFirst && "border-yellow-500/30 animate-float",
        getGlowStyle(),
        isCurrentUser && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      {/* You Badge */}
      {isCurrentUser && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center gap-1 animate-scale-in">
          <Sparkles className="w-3 h-3" />
          You
        </div>
      )}

      {/* Avatar */}
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold mb-2 transition-transform duration-300",
          rank === 1
            ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900 scale-110"
            : rank === 2
            ? "bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900"
            : "bg-gradient-to-br from-amber-500 to-amber-700 text-amber-100"
        )}
      >
        {getAvatar()}
      </div>

      {/* Name */}
      <p className="font-medium text-sm text-center mb-1 line-clamp-1">{name}</p>

      {/* Credits */}
      <p className={cn(
        "text-warning font-bold text-lg transition-all duration-500",
        animateCredits && "scale-125 text-green-400"
      )}>
        {ecoCredits.toLocaleString()}
      </p>

      {/* Rank Badge */}
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold mt-2",
          getRankColor()
        )}
      >
        {getRankIcon()}
        <span>#{rank}</span>
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
  previousCredits,
}: {
  rank: number;
  name: string;
  ecoCredits: number;
  scans: number;
  index: number;
  isCurrentUser?: boolean;
  previousCredits?: number;
}) => {
  const [animateCredits, setAnimateCredits] = useState(false);
  
  useEffect(() => {
    if (previousCredits !== undefined && previousCredits !== ecoCredits) {
      setAnimateCredits(true);
      const timer = setTimeout(() => setAnimateCredits(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [ecoCredits, previousCredits]);

  const getAvatar = () => name.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 hover:bg-muted/30 transition-all duration-300 animate-fade-in",
        isCurrentUser && "bg-primary/10 border-l-4 border-primary"
      )}
      style={{ animationDelay: `${0.3 + index * 0.05}s` }}
    >
      {/* Rank */}
      <div className="w-8 text-center font-display font-bold text-muted-foreground">
        #{rank}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
        {getAvatar()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{name}</p>
          {isCurrentUser && (
            <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              You
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{scans} items scanned</p>
      </div>

      {/* Credits */}
      <div className="text-right">
        <p className={cn(
          "font-bold text-warning transition-all duration-500",
          animateCredits && "scale-110 text-green-400"
        )}>
          {ecoCredits.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">SnapCreds</p>
      </div>
    </div>
  );
};

export default Leaderboard;
