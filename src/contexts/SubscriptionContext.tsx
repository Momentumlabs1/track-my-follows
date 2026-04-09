import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isNativeApp, launchNativePaywall, haptic } from "@/lib/native";
import { toast } from "sonner";
import { SpyPaywall } from "@/components/SpyPaywall";

interface SubscriptionState {
  plan: "free" | "basic" | "pro";
  status: "active" | "in_trial" | "canceled" | "past_due" | "expired";
  billingPeriod: "weekly" | "monthly" | "yearly" | null;
  maxProfiles: number;
  isProMax: boolean;
  canUseUnfollows: boolean;
  canUsePush: boolean;
  canUseStats: boolean;
  canViewFollows: boolean;
  canUseSpy: boolean;
  shouldBlur: boolean;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  isLoading: boolean;
}

interface SubscriptionContextType extends SubscriptionState {
  refetch: () => Promise<void>;
  showPaywall: (trigger?: string) => void;
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
  canViewFollows: false,
  canUseSpy: false,
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
  const isPaid = ["pro", "basic"].includes(data.plan_type) && ["active", "in_trial"].includes(data.status);
  const isWithinPaidPeriod =
    ["pro", "basic"].includes(data.plan_type) &&
    ["expired", "canceled"].includes(data.status) &&
    data.current_period_end &&
    new Date(data.current_period_end) > new Date();
  return isPaid || !!isWithinPaidPeriod;
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
  const [nativePurchaseSuccess, setNativePurchaseSuccess] = useState(false);
  const [webPaywallOpen, setWebPaywallOpen] = useState(false);
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
        const isActiveOrTrial = ["pro", "basic"].includes(data.plan_type) && ["active", "in_trial"].includes(data.status);
        const isWithinPaidPeriod = 
          ["pro", "basic"].includes(data.plan_type) && 
          ["expired", "canceled"].includes(data.status) && 
          data.current_period_end && 
          new Date(data.current_period_end) > new Date();
        
        const isPaid = isActiveOrTrial || isWithinPaidPeriod;
        const isPro = isPaid && data.plan_type === "pro";
        const isBasic = isPaid && data.plan_type === "basic";
        const proMax = isPro && (data.max_tracked_profiles ?? 0) >= 9999;

        setState({
          plan: isPro ? "pro" : isBasic ? "basic" : "free",
          status: (data.status as SubscriptionState["status"]) || "active",
          billingPeriod: (data.billing_period as SubscriptionState["billingPeriod"]) || null,
          maxProfiles: data.max_tracked_profiles || 1,
          isProMax: proMax,
          canUseUnfollows: isPro,
          canUsePush: isPro,
          canUseStats: isPro,
          canViewFollows: isPaid,
          canUseSpy: isPaid,
          shouldBlur: !isPaid,
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
        (payload: any) => {
          fetchSubscription();
          const wasNotPro = payload?.old?.plan_type !== "pro" || !["active", "in_trial"].includes(payload?.old?.status);
          const isNowPro = payload?.new?.plan_type === "pro" && ["active", "in_trial"].includes(payload?.new?.status);
          if (wasNotPro && isNowPro) {
            try { sessionStorage.setItem("show_pro_tutorial", "1"); } catch {}
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchSubscription]);

  // Register global onRevenueCatPurchase callback for native paywall
  useEffect(() => {
    if (!isNativeApp()) return;

    (window as any).onRevenueCatPurchase = async () => {
      const currentUser = userRef.current;
      if (!currentUser) return;

      const upgraded = await waitForUpgrade(currentUser.id);
      await fetchSubscription();

      if (upgraded) {
        haptic.success();
        setNativePurchaseSuccess(true);
        try { sessionStorage.setItem("show_pro_tutorial", "1"); } catch {}
      } else {
        haptic.error();
      }
    };

    (window as any).iapSuccess = (window as any).onRevenueCatPurchase;

    return () => {
      delete (window as any).onRevenueCatPurchase;
      delete (window as any).iapSuccess;
    };
  }, [fetchSubscription]);

  const showPaywall = useCallback((trigger?: string) => {
    if (isNativeApp() && user) {
      launchNativePaywall(user.id);
    } else {
      setWebPaywallOpen(true);
    }
  }, [user]);

  const clearNativePurchaseSuccess = useCallback(() => {
    setNativePurchaseSuccess(false);
  }, []);

  return (
    <SubscriptionContext.Provider value={{
      ...state,
      refetch: fetchSubscription,
      showPaywall,
      nativePurchaseSuccess,
      clearNativePurchaseSuccess,
    }}>
      {children}
      <SpyPaywall open={webPaywallOpen} onClose={() => setWebPaywallOpen(false)} />
    </SubscriptionContext.Provider>
  );
}
