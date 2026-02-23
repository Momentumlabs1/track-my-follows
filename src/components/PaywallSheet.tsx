import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

type Period = "weekly" | "monthly" | "yearly";

const PRODUCTS = {
  weekly: "trackiq_pro_weekly",
  monthly: "trackiq_pro_monthly",
  yearly: "trackiq_pro_yearly",
};

const PRICES: Record<Period, { price: string; unit: string; trial: boolean }> = {
  weekly: { price: "8.99", unit: "per_week", trial: false },
  monthly: { price: "14.99", unit: "per_month", trial: true },
  yearly: { price: "49.99", unit: "per_year", trial: true },
};

export function PaywallSheet() {
  const { t } = useTranslation();
  const { isPaywallOpen, closePaywall, refetch } = useSubscription();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Period>("yearly");
  const [loading, setLoading] = useState(false);

  const weeklyEquiv = selected === "yearly" ? (49.99 / 52).toFixed(2) : selected === "monthly" ? (14.99 / 4.33).toFixed(2) : "8.99";
  const savingsPercent = selected === "yearly" ? 89 : selected === "monthly" ? 62 : 0;

  const features = [
    t("paywall.feature_profiles"),
    t("paywall.feature_hourly"),
    t("paywall.feature_unfollows"),
    t("paywall.feature_push"),
    t("paywall.feature_stats"),
    t("paywall.feature_unblur"),
  ];

  const handlePurchase = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // TODO: Replace with Despia/RevenueCat call
      // despia(`revenuecat://purchase?external_id=${user.id}&product=${PRODUCTS[selected]}`);
      console.log("Purchase triggered for:", PRODUCTS[selected]);

      if (import.meta.env.DEV) {
        const { error } = await supabase.from("subscriptions").upsert({
            user_id: user.id,
            plan_type: "pro",
            billing_period: selected,
            status: "active",
            max_tracked_profiles: 5,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }, { onConflict: "user_id" });
        if (error) throw error;
        await refetch();
        toast.success("Pro activated! 🎉");
        closePaywall();
      }
    } catch (err) {
      toast.error(t("common.error"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = () => {
    // TODO: Replace with Despia/RevenueCat
    // despia('revenuecat://restore');
    console.log("Restore purchases triggered");
    toast.info("Restore not available yet");
  };

  return (
    <AnimatePresence>
      {isPaywallOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closePaywall}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-card border-t border-border"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1.5 w-12 rounded-full bg-muted" />
            </div>

            {/* Close */}
            <button onClick={closePaywall} className="absolute top-4 end-4 p-2 text-muted-foreground hover:text-foreground z-10">
              <X className="h-5 w-5" />
            </button>

            <div className="px-6 pb-8 pt-2">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl gradient-bg mb-3">
                  <Crown className="h-7 w-7 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-extrabold">{t("paywall.title")} 🔓</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("paywall.subtitle")}</p>
              </div>

              {/* Features */}
              <div className="space-y-2.5 mb-6">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <span className="text-[13px] font-medium text-foreground">{f}</span>
                  </div>
                ))}
              </div>

              {/* Period selector */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {(["weekly", "monthly", "yearly"] as Period[]).map((period) => {
                  const isSelected = selected === period;
                  const info = PRICES[period];
                  return (
                    <button
                      key={period}
                      onClick={() => setSelected(period)}
                      className={`relative rounded-2xl border-2 p-3 text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      {period === "yearly" && (
                        <span className="absolute -top-2.5 start-1/2 -translate-x-1/2 gradient-bg text-primary-foreground text-[9px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                          {t("paywall.save_percent", { percent: 89 })}
                        </span>
                      )}
                      <p className="text-[11px] font-semibold text-muted-foreground mb-1">
                        {t(`paywall.${period}`)}
                      </p>
                      <p className="text-lg font-extrabold">€{info.price}</p>
                      <p className="text-[10px] text-muted-foreground">{t(`paywall.${info.unit}`)}</p>
                      {info.trial && (
                        <span className="mt-1 inline-block text-[9px] font-semibold text-primary">
                          {t("paywall.free_trial")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Savings info */}
              {savingsPercent > 0 && (
                <p className="text-center text-[12px] text-muted-foreground mb-4">
                  ≈ €{weeklyEquiv}{t("paywall.per_week")} · {t("paywall.save_percent", { percent: savingsPercent })}
                </p>
              )}

              {/* CTA */}
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full pill-btn-primary py-4 justify-center text-[15px] font-bold disabled:opacity-50"
              >
                {loading ? t("common.loading") : `${t("paywall.continue")} (${t(`paywall.${selected}`)})`}
              </button>

              {/* Footer links */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <button onClick={handleRestore} className="text-[11px] text-muted-foreground hover:text-foreground">
                  {t("paywall.restore")}
                </button>
                <span className="text-muted-foreground text-[10px]">·</span>
                <a href="#" className="text-[11px] text-muted-foreground hover:text-foreground">{t("paywall.terms")}</a>
                <span className="text-muted-foreground text-[10px]">·</span>
                <a href="#" className="text-[11px] text-muted-foreground hover:text-foreground">{t("paywall.privacy")}</a>
              </div>
              <p className="text-center text-[10px] text-muted-foreground mt-2">{t("paywall.cancel_note")}</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
