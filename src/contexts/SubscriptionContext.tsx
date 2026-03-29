import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isNativeApp, launchNativePaywall, haptic } from "@/lib/native";

interface SubscriptionState {
  plan: "free" | "pro";
  status: "active" | "in_trial" | "canceled" | "past_due" | "expired";
  billingPeriod: "weekly" | "monthly" | "yearly" | null;
  maxProfiles: number;
  isProMax: boolean;
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
  nativePurchaseSuccess: boolean;
  clearNativePurchaseSuccess: () => void;
}

const defaultState: SubscriptionState = {
  plan: "free",
  status: "active",
  billingPeriod: null,
  maxProfiles: 1,
  isProMax: false,
  canUseUnfollows: false,
  canUsePush: false,
  canUseStats: false,
  shouldBlur: true,
  trialEnd: null,
  currentPeriodEnd: null,
  isLoading: true,
};

const PURCHASE_POLL_INTERVAL_MS = 1500;
const PURCHASE_POLL_ATTEMPTS = 20;

const SubscriptionContext = createContext<SubscriptionContextType>({
  ...defaultState,
  refetch: async () => {},
  showPaywall: () => {},
  isPaywallOpen: false,
  closePaywall: () => {},
  paywallTrigger: null,
  nativePurchaseSuccess: false,
  clearNativePurchaseSuccess: () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

async function isUserProInDatabase(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan_type, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return false;
  const isActiveOrTrial = data.plan_type === "pro" && ["active", "in_trial"].includes(data.status);
  const isWithinPaidPeriod =
    data.plan_type === "pro" &&
    ["expired", "canceled"].includes(data.status) &&
    data.current_period_end &&
    new Date(data.current_period_end) > new Date();
  return isActiveOrTrial || !!isWithinPaidPeriod;
}

async function waitForUpgrade(userId: string): Promise<boolean> {
  for (let i = 0; i < PURCHASE_POLL_ATTEMPTS; i++) {
    const isPro = await isUserProInDatabase(userId);
    if (isPro) return true;
    await new Promise((r) => setTimeout(r, PURCHASE_POLL_INTERVAL_MS));
  }
  return false;
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>(defaultState);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState<string | null>(null);
  const [nativePurchaseSuccess, setNativePurchaseSuccess] = useState(false);
  const userRef = useRef(user);
  userRef.current = user;

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
        const isActiveOrTrial = data.plan_type === "pro" && ["active", "in_trial"].includes(data.status);
        const isWithinPaidPeriod = 
          data.plan_type === "pro" && 
          ["expired", "canceled"].includes(data.status) && 
          data.current_period_end && 
          new Date(data.current_period_end) > new Date();
        
        const isPro = isActiveOrTrial || isWithinPaidPeriod;
        const proMax = isPro && (data.max_tracked_profiles ?? 0) >= 9999;

        setState({
          plan: isPro ? "pro" : "free",
          status: (data.status as SubscriptionState["status"]) || "active",
          billingPeriod: (data.billing_period as SubscriptionState["billingPeriod"]) || null,
          maxProfiles: data.max_tracked_profiles || 1,
          isProMax: proMax,
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

  // Register global onRevenueCatPurchase callback for native paywall
  useEffect(() => {
    if (!isNativeApp()) return;

    (window as any).onRevenueCatPurchase = async () => {
      console.log("[PaywallNative] onRevenueCatPurchase callback fired, polling DB...");
      const currentUser = userRef.current;
      if (!currentUser) return;

      const upgraded = await waitForUpgrade(currentUser.id);
      await fetchSubscription();

      if (upgraded) {
        haptic.success();
        setNativePurchaseSuccess(true);
      } else {
        haptic.error();
        console.warn("[PaywallNative] Purchase callback fired but DB not updated after polling");
      }
    };

    // Also support the legacy iapSuccess callback
    (window as any).iapSuccess = (window as any).onRevenueCatPurchase;

    return () => {
      delete (window as any).onRevenueCatPurchase;
      delete (window as any).iapSuccess;
    };
  }, [fetchSubscription]);

  const showPaywall = useCallback((trigger?: string) => {
    if (isNativeApp() && user) {
      // Native: launch RevenueCat's native paywall
      console.log("[PaywallNative] Launching RevenueCat native paywall");
      launchNativePaywall(user.id);
      // Don't open custom paywall — purchase result comes via onRevenueCatPurchase callback
    } else {
      // Web: show custom paywall
      setPaywallTrigger(trigger || null);
      setIsPaywallOpen(true);
    }
  }, [user]);

  const closePaywall = useCallback(() => {
    setIsPaywallOpen(false);
    setPaywallTrigger(null);
  }, []);

  const clearNativePurchaseSuccess = useCallback(() => {
    setNativePurchaseSuccess(false);
  }, []);

  return (
    <SubscriptionContext.Provider value={{
      ...state,
      refetch: fetchSubscription,
      showPaywall,
      isPaywallOpen,
      closePaywall,
      paywallTrigger,
      nativePurchaseSuccess,
      clearNativePurchaseSuccess,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
