import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, Crown, TrendingUp, Leaf, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardUser {
  id: string;
  name: string;
  eco_creds: number;
  total_scans: number;
}

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // Use the secure function to get leaderboard data (no email/phone exposed)
      const { data, error } = await supabase.rpc('get_leaderboard');

      if (error) {
        console.error('Error fetching leaderboard:', error);
      } else {
        setLeaderboardData(data || []);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

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
            Eco <span className="gradient-text-warm">Champions</span>
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
              No eco-warriors on the leaderboard yet. Start scanning to claim the top spot!
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
                  />
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center">
                  <PodiumCard
                    rank={3}
                    name={topThree[2].name}
                    ecoCredits={topThree[2].eco_creds}
                    height="h-32"
                  />
                </div>
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
                <div className="divide-y divide-border/30">
                  {rest.map((user, index) => (
                    <LeaderboardRow
                      key={user.id}
                      rank={index + 4}
                      name={user.name}
                      ecoCredits={user.eco_creds}
                      scans={user.total_scans}
                      index={index}
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
}: {
  rank: number;
  name: string;
  ecoCredits: number;
  height: string;
  isFirst?: boolean;
}) => {
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

  const getAvatar = () => name.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "glass-card w-full flex flex-col items-center justify-end p-4",
        height,
        isFirst && "border-yellow-500/30 shadow-[0_0_30px_hsl(45,95%,55%,0.2)]"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold mb-2",
          rank === 1
            ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900"
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
      <p className="text-warning font-bold text-lg">{ecoCredits.toLocaleString()}</p>

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
}: {
  rank: number;
  name: string;
  ecoCredits: number;
  scans: number;
  index: number;
}) => {
  const getAvatar = () => name.charAt(0).toUpperCase();

  return (
    <div
      className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
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
        <p className="font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{scans} items scanned</p>
      </div>

      {/* Credits */}
      <div className="text-right">
        <p className="font-bold text-warning">{ecoCredits.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">SnapCreds</p>
      </div>
    </div>
  );
};

export default Leaderboard;
