import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Crown, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";
import { purchase, restorePurchases, haptic, PRODUCTS, isNativeApp } from "@/lib/native";

type Period = "weekly" | "monthly" | "yearly";

const PRICES: Record<Period, { price: string; unit: string; trial: boolean }> = {
  weekly: { price: "4,95", unit: "per_week", trial: false },
  monthly: { price: "14,95", unit: "per_month", trial: true },
  yearly: { price: "99,95", unit: "per_year", trial: true },
};

export function PaywallSheet() {
  const { t } = useTranslation();
  const { isPaywallOpen, closePaywall, refetch } = useSubscription();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Period>("yearly");
  const [loading, setLoading] = useState(false);

  // Calculate savings: yearly = 99.95 vs weekly*52 = 257.40 → ~61% savings
  const weeklyEquiv = selected === "yearly" ? (99.95 / 52).toFixed(2) : selected === "monthly" ? (14.95 / 4.33).toFixed(2) : "4,95";
  const savingsPercent = selected === "yearly" ? 61 : selected === "monthly" ? 30 : 0;

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
    haptic.light();

    try {
      if (isNativeApp()) {
        await purchase(user.id, PRODUCTS[selected]);
        haptic.success();
        await refetch();
        closePaywall();
      } else {
        toast.info(t("settings.manage_in_app_store"));
      }
    } catch (err) {
      haptic.error();
      toast.error(t("common.error"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!user) return;
    haptic.light();
    try {
      await restorePurchases(user.id);
      await refetch();
      toast.success(t("settings.subscription_restored"));
    } catch {
      toast.info(t("settings.no_subscription_found"));
    }
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
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1.5 w-12 rounded-full bg-muted" />
            </div>
            <button onClick={closePaywall} className="absolute top-4 end-4 p-2 text-muted-foreground hover:text-foreground z-10 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="h-5 w-5" />
            </button>

            <div className="px-6 pb-8 pt-2">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl gradient-bg mb-3">
                  <Crown className="h-7 w-7 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-extrabold">{t("paywall.title")} 🔓</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("paywall.subtitle")}</p>
              </div>

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

              <div className="grid grid-cols-3 gap-2 mb-6">
                {(["weekly", "monthly", "yearly"] as Period[]).map((period) => {
                  const isSelected = selected === period;
                  const info = PRICES[period];
                  return (
                    <button
                      key={period}
                      onClick={() => { setSelected(period); haptic.light(); }}
                      className={`relative rounded-2xl border-2 p-3 text-center transition-all min-h-[44px] ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      {period === "yearly" && (
                        <span className="absolute -top-2.5 start-1/2 -translate-x-1/2 gradient-bg text-primary-foreground text-[9px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                          {t("paywall.save_percent", { percent: 61 })}
                        </span>
                      )}
                      <p className="text-[11px] font-semibold text-muted-foreground mb-1">{t(`paywall.${period}`)}</p>
                      <p className="text-lg font-extrabold">€{info.price}</p>
                      <p className="text-[10px] text-muted-foreground">{t(`paywall.${info.unit}`)}</p>
                      {info.trial && (
                        <span className="mt-1 inline-block text-[9px] font-semibold text-primary">{t("paywall.free_trial")}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {savingsPercent > 0 && (
                <p className="text-center text-[12px] text-muted-foreground mb-4">
                  ≈ €{weeklyEquiv}{t("paywall.per_week")} · {t("paywall.save_percent", { percent: savingsPercent })}
                </p>
              )}

              <button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full pill-btn-primary py-4 justify-center text-[15px] font-bold disabled:opacity-50 min-h-[44px]"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${t("paywall.continue")} (${t(`paywall.${selected}`)})`}
              </button>

              {/* Apple-required subscription disclosure */}
              <p className="text-center text-[11px] text-muted-foreground mt-4 px-2 leading-relaxed">
                Das Abonnement verlängert sich automatisch, sofern es nicht mindestens 24 Stunden vor Ablauf der aktuellen Laufzeit gekündigt wird. Die Kündigung erfolgt über die Abo-Verwaltung in den App Store Einstellungen.
              </p>

              <div className="flex items-center justify-center gap-4 mt-4">
                <button onClick={handleRestore} className="text-[11px] text-muted-foreground hover:text-foreground min-h-[44px] px-2">
                  {t("paywall.restore")}
                </button>
                <span className="text-muted-foreground text-[10px]">·</span>
                <button onClick={() => closePaywall()} className="text-[11px] text-muted-foreground hover:text-foreground min-h-[44px] px-2">{t("paywall.terms")}</button>
                <span className="text-muted-foreground text-[10px]">·</span>
                <button onClick={() => closePaywall()} className="text-[11px] text-muted-foreground hover:text-foreground min-h-[44px] px-2">{t("paywall.privacy")}</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
