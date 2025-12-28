import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Gift, 
  Trophy, 
  ShoppingBag, 
  Leaf, 
  Award,
  Sparkles,
  Check,
  X,
  Loader2,
  Clock,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Reward {
  id: string;
  name: string;
  description: string;
  tier: "digital" | "food" | "gift_card" | "impact";
  cost: number;
  is_sold_out: boolean;
}

interface Redemption {
  id: string;
  reward_id: string;
  snapcreds_spent: number;
  redeemed_at: string;
}

const tierConfig = {
  digital: {
    label: "Digital",
    icon: Award,
    color: "text-[hsl(var(--eco-water))]",
    bg: "bg-[hsl(var(--eco-water)/0.1)]",
    border: "border-[hsl(var(--eco-water)/0.3)]",
    glow: "group-hover:shadow-[0_0_30px_hsl(var(--eco-water)/0.3)]",
  },
  food: {
    label: "Food Coupons",
    icon: ShoppingBag,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    glow: "group-hover:shadow-[0_0_30px_hsl(var(--warning)/0.3)]",
  },
  gift_card: {
    label: "Gift Cards",
    icon: Gift,
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/30",
    glow: "group-hover:shadow-[0_0_30px_hsl(var(--accent)/0.3)]",
  },
  impact: {
    label: "Impact Rewards",
    icon: Leaf,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    glow: "group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]",
  },
};

const RewardCard = ({ 
  reward, 
  userCreds, 
  onRedeem,
  isRedeeming,
  hasRedeemedToday 
}: { 
  reward: Reward; 
  userCreds: number;
  onRedeem: (reward: Reward) => void;
  isRedeeming: boolean;
  hasRedeemedToday: boolean;
}) => {
  const config = tierConfig[reward.tier];
  const TierIcon = config.icon;
  const canAfford = userCreds >= reward.cost;
  const isDisabled = reward.is_sold_out || !canAfford || hasRedeemedToday;

  return (
    <div 
      className={cn(
        "group relative glass-card p-6 flex flex-col transition-all duration-500",
        !reward.is_sold_out && "hover:-translate-y-2",
        config.glow,
        reward.is_sold_out && "opacity-60"
      )}
    >
      {/* Sold Out Overlay */}
      {reward.is_sold_out && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
          <span className="px-4 py-2 bg-destructive/20 border border-destructive/40 rounded-full text-destructive font-semibold text-sm">
            Sold Out
          </span>
        </div>
      )}

      {/* Tier Badge */}
      <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium w-fit mb-4", config.bg, config.color)}>
        <TierIcon className="w-3 h-3" />
        {config.label}
      </div>

      {/* Icon */}
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300",
        config.bg,
        "group-hover:scale-110"
      )}>
        <Gift className={cn("w-7 h-7", config.color)} />
      </div>

      {/* Content */}
      <h3 className="font-display font-semibold text-lg text-foreground mb-2">{reward.name}</h3>
      <p className="text-sm text-muted-foreground mb-4 flex-grow">{reward.description}</p>

      {/* Cost */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-warning" />
          <span className={cn(
            "font-display font-bold text-lg",
            canAfford ? "text-warning" : "text-muted-foreground"
          )}>
            {reward.cost}
          </span>
          <span className="text-xs text-muted-foreground">SnapCreds</span>
        </div>
        {!canAfford && !reward.is_sold_out && (
          <span className="text-xs text-muted-foreground">Need {reward.cost - userCreds} more</span>
        )}
      </div>

      {/* Redeem Button */}
      <Button
        variant={isDisabled ? "outline" : "gradient"}
        className="w-full gap-2"
        disabled={isDisabled || isRedeeming}
        onClick={() => onRedeem(reward)}
      >
        {isRedeeming ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Redeeming...
          </>
        ) : hasRedeemedToday ? (
          <>
            <Clock className="w-4 h-4" />
            Daily Limit Reached
          </>
        ) : reward.is_sold_out ? (
          <>
            <X className="w-4 h-4" />
            Unavailable
          </>
        ) : !canAfford ? (
          <>
            <Trophy className="w-4 h-4" />
            Insufficient SnapCreds
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Redeem Now
          </>
        )}
      </Button>
    </div>
  );
};

const Rewards = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [justRedeemed, setJustRedeemed] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [rewardsRes, redemptionsRes] = await Promise.all([
        supabase.from("rewards").select("*").eq("is_active", true).order("cost", { ascending: true }),
        supabase.from("redemptions").select("*").eq("user_id", user?.id)
      ]);

      if (rewardsRes.data) setRewards(rewardsRes.data as Reward[]);
      if (redemptionsRes.data) setRedemptions(redemptionsRes.data as Redemption[]);
    } catch (error) {
      console.error("Error fetching rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasRedeemedToday = () => {
    const today = new Date().toDateString();
    return redemptions.some(r => new Date(r.redeemed_at).toDateString() === today);
  };

  const handleRedeem = async (reward: Reward) => {
    if (!user) return;
    
    setRedeemingId(reward.id);
    
    try {
      const { data, error } = await supabase.rpc("redeem_reward", {
        p_reward_id: reward.id,
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; reward_name?: string; spent?: number };

      if (result.success) {
        setJustRedeemed(reward.id);
        toast.success(
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold">Reward Redeemed!</p>
              <p className="text-sm text-muted-foreground">{reward.name} • -{reward.cost} SnapCreds</p>
            </div>
          </div>
        );
        await refreshProfile();
        await fetchData();
        setTimeout(() => setJustRedeemed(null), 2000);
      } else {
        toast.error(result.error || "Failed to redeem reward");
      }
    } catch (error: any) {
      console.error("Redeem error:", error);
      toast.error(error.message || "Failed to redeem reward");
    } finally {
      setRedeemingId(null);
    }
  };

  const filteredRewards = selectedTier === "all" 
    ? rewards 
    : rewards.filter(r => r.tier === selectedTier);

  const userCreds = profile?.eco_creds || 0;

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 opacity-0 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Gift className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Rewards Store</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text-eco">Spend Your SnapCreds</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Turn your environmental actions into real rewards. Premium perks for eco champions.
          </p>
        </div>

        {/* Balance Card */}
        <div className="glass-card p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 opacity-0 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Balance</p>
              <p className="font-display text-3xl font-bold text-warning">{userCreds}</p>
              <p className="text-xs text-muted-foreground">SnapCreds Available</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>1 redemption per day</span>
          </div>
        </div>

        {/* Floating Quote */}
        <div className="text-center mb-8 opacity-0 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <p className="text-muted-foreground italic flex items-center justify-center gap-2">
            <Star className="w-4 h-4 text-warning animate-pulse" />
            "Your eco-actions unlock real value."
            <Star className="w-4 h-4 text-warning animate-pulse" />
          </p>
        </div>

        {/* Tier Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 opacity-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Button
            variant={selectedTier === "all" ? "gradient" : "outline"}
            size="sm"
            onClick={() => setSelectedTier("all")}
          >
            All Rewards
          </Button>
          {Object.entries(tierConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <Button
                key={key}
                variant={selectedTier === key ? "gradient" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setSelectedTier(key)}
              >
                <Icon className="w-4 h-4" />
                {config.label}
              </Button>
            );
          })}
        </div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRewards.map((reward, index) => (
            <div 
              key={reward.id} 
              className={cn(
                "opacity-0 animate-slide-up",
                justRedeemed === reward.id && "animate-pulse"
              )}
              style={{ animationDelay: `${0.25 + index * 0.05}s` }}
            >
              <RewardCard
                reward={reward}
                userCreds={userCreds}
                onRedeem={handleRedeem}
                isRedeeming={redeemingId === reward.id}
                hasRedeemedToday={hasRedeemedToday()}
              />
            </div>
          ))}
        </div>

        {filteredRewards.length === 0 && (
          <div className="text-center py-16">
            <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No rewards available in this category.</p>
          </div>
        )}

        {/* Redemption History */}
        {redemptions.length > 0 && (
          <div className="mt-16 opacity-0 animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
              <Check className="w-6 h-6 text-primary" />
              Your Redemption History
            </h2>
            <div className="glass-card divide-y divide-border/50">
              {redemptions.slice(0, 5).map((redemption) => {
                const reward = rewards.find(r => r.id === redemption.reward_id);
                return (
                  <div key={redemption.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{reward?.name || "Reward"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(redemption.redeemed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-warning">
                      <Trophy className="w-4 h-4" />
                      <span className="font-semibold">-{redemption.snapcreds_spent}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rewards;
