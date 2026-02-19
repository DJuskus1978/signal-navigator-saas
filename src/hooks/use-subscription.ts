import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionTier = "novice" | "day_trader" | "pro_day_trader" | "bull_trader";

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  dailyLimit: number;
  hasCryptoAccess: boolean;
  trialStartedAt: string | null;
  isTrialExpired: boolean;
}

const TIER_LIMITS: Record<SubscriptionTier, number> = {
  novice: 2,
  day_trader: 25,
  pro_day_trader: 50,
  bull_trader: Infinity,
};

export function useSubscription() {
  const { user } = useAuth();

  return useQuery<SubscriptionInfo>({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_tier, trial_started_at")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      const tier = (data.subscription_tier as SubscriptionTier) || "novice";
      const trialStartedAt = data.trial_started_at;

      // Check if 7-day trial has expired for novice users
      let isTrialExpired = false;
      if (tier === "novice" && trialStartedAt) {
        const trialEnd = new Date(trialStartedAt);
        trialEnd.setDate(trialEnd.getDate() + 7);
        isTrialExpired = new Date() > trialEnd;
      }

      return {
        tier,
        dailyLimit: TIER_LIMITS[tier],
        hasCryptoAccess: tier === "bull_trader",
        trialStartedAt,
        isTrialExpired,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });
}
