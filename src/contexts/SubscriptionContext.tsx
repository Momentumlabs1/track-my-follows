import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionState {
  plan: "free" | "pro";
  status: "active" | "in_trial" | "canceled" | "past_due" | "expired";
  billingPeriod: "weekly" | "monthly" | "yearly" | null;
  maxProfiles: number;
  canUseUnfollows: boolean;
  canUsePush: boolean;
  canUseStats: boolean;
  shouldBlur: boolean;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  isLoading: boolean;
}

interface SubscriptionContextType extends SubscriptionState {
  refetch: () => Promise<void>;
  showPaywall: (trigger?: string) => void;
  isPaywallOpen: boolean;
  closePaywall: () => void;
  paywallTrigger: string | null;
}

const defaultState: SubscriptionState = {
  plan: "free",
  status: "active",
  billingPeriod: null,
  maxProfiles: 1,
  canUseUnfollows: false,
  canUsePush: false,
  canUseStats: false,
  shouldBlur: true,
  trialEnd: null,
  currentPeriodEnd: null,
  isLoading: true,
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  ...defaultState,
  refetch: async () => {},
  showPaywall: () => {},
  isPaywallOpen: false,
  closePaywall: () => {},
  paywallTrigger: null,
});

export const useSubscription = () => useContext(SubscriptionContext);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>(defaultState);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setState({ ...defaultState, isLoading: false });
      return;
    }

    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        // Check if user has Pro access:
        // 1. Active or in_trial status
        // 2. OR expired/canceled but still within paid period (current_period_end > now)
        const isActiveOrTrial = data.plan_type === "pro" && ["active", "in_trial"].includes(data.status);
        const isWithinPaidPeriod = 
          data.plan_type === "pro" && 
          ["expired", "canceled"].includes(data.status) && 
          data.current_period_end && 
          new Date(data.current_period_end) > new Date();
        
        const isPro = isActiveOrTrial || isWithinPaidPeriod;

        setState({
          plan: isPro ? "pro" : "free",
          status: (data.status as SubscriptionState["status"]) || "active",
          billingPeriod: (data.billing_period as SubscriptionState["billingPeriod"]) || null,
          maxProfiles: data.max_tracked_profiles || 1,
          canUseUnfollows: isPro,
          canUsePush: isPro,
          canUseStats: isPro,
          shouldBlur: !isPro,
          trialEnd: data.trial_end || null,
          currentPeriodEnd: data.current_period_end || null,
          isLoading: false,
        });
      } else {
        setState({ ...defaultState, isLoading: false });
      }
    } catch {
      setState({ ...defaultState, isLoading: false });
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("subscription-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => { fetchSubscription(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchSubscription]);

  const showPaywall = useCallback((trigger?: string) => {
    setPaywallTrigger(trigger || null);
    setIsPaywallOpen(true);
  }, []);

  const closePaywall = useCallback(() => {
    setIsPaywallOpen(false);
    setPaywallTrigger(null);
  }, []);

  return (
    <SubscriptionContext.Provider value={{ ...state, refetch: fetchSubscription, showPaywall, isPaywallOpen, closePaywall, paywallTrigger }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
