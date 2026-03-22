import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Minus, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";
import { purchase, restorePurchases, haptic, PRODUCTS, isNativeApp } from "@/lib/native";
import spyGif from "@/assets/spy-logo-animated.gif";

type Period = "weekly" | "monthly" | "yearly";

const PRICES: Record<Period, { price: string; unit: string; trial: boolean }> = {
  weekly: { price: "4,95", unit: "per_week", trial: false },
  monthly: { price: "14,95", unit: "per_month", trial: true },
  yearly: { price: "99,95", unit: "per_year", trial: true },
};

interface ComparisonRow {
  label: string;
  free: string | boolean;
  pro: string | boolean;
}

export function PaywallSheet() {
  const { t } = useTranslation();
  const { isPaywallOpen, closePaywall, refetch } = useSubscription();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Period>("yearly");
  const [loading, setLoading] = useState(false);

  const savingsPercent = selected === "yearly" ? 61 : selected === "monthly" ? 30 : 0;

  const comparisonRows: ComparisonRow[] = [
    { label: t("paywall.comp_profiles"), free: "1", pro: "5" },
    { label: t("paywall.comp_scans"), free: t("paywall.comp_once_daily"), pro: t("paywall.comp_hourly") },
    { label: t("paywall.comp_spy_agent"), free: false, pro: true },
    { label: t("paywall.comp_unfollow"), free: false, pro: true },
    { label: t("paywall.comp_gender"), free: false, pro: true },
    { label: t("paywall.comp_suspicion"), free: false, pro: true },
    { label: t("paywall.comp_push"), free: false, pro: true },
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
              {/* Hero: Spy GIF */}
              <div className="text-center mb-5">
                <motion.img
                  src={spyGif}
                  alt="Spy Agent"
                  className="h-20 w-20 mx-auto mb-3 drop-shadow-lg"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 15 }}
                />
                <h2 className="text-2xl font-extrabold text-foreground">{t("paywall.title")} 🕵️</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("paywall.subtitle")}</p>
              </div>

              {/* Comparison Table */}
              <div className="rounded-2xl border border-border overflow-hidden mb-6">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_60px_60px] items-center px-4 py-3 border-b border-border bg-muted/30">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("paywall.comp_feature")}</span>
                  <span className="text-[11px] font-semibold text-muted-foreground text-center uppercase tracking-wider">Free</span>
                  <span className="text-[11px] font-bold text-center uppercase tracking-wider gradient-text">Pro</span>
                </div>
                {/* Rows */}
                {comparisonRows.map((row, i) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-[1fr_60px_60px] items-center px-4 py-3 ${
                      i < comparisonRows.length - 1 ? "border-b border-border/50" : ""
                    }`}
                  >
                    <span className="text-[13px] font-medium text-foreground">{row.label}</span>
                    <div className="flex justify-center">
                      {typeof row.free === "boolean" ? (
                        row.free ? (
                          <Check className="h-4 w-4 text-muted-foreground/50" />
                        ) : (
                          <Minus className="h-4 w-4 text-muted-foreground/40" />
                        )
                      ) : (
                        <span className="text-[12px] text-muted-foreground">{row.free}</span>
                      )}
                    </div>
                    <div className="flex justify-center">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? (
                          <div className="h-5 w-5 rounded-full gradient-bg flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        ) : (
                          <Minus className="h-4 w-4 text-muted-foreground/40" />
                        )
                      ) : (
                        <span className="text-[12px] font-bold text-primary">{row.pro}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Cards */}
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
                  {t("paywall.save_percent", { percent: savingsPercent })}
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
                {t("paywall.subscription_disclosure")}
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
