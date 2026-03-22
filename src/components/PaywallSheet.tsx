import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Minus, Loader2, Shield, Zap, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo } from "react";
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

// Confetti particle component
function ConfettiParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.2,
      duration: 1.5 + Math.random() * 2,
      size: 4 + Math.random() * 6,
      color: i % 3 === 0 ? "hsl(var(--primary))" : i % 3 === 1 ? "hsl(var(--primary) / 0.6)" : "hsl(var(--foreground) / 0.3)",
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            backgroundColor: p.color,
          }}
          initial={{ y: -20, opacity: 0, scale: 0 }}
          animate={{
            y: ["0%", "120%"],
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.5],
            rotate: [0, 360],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// Success celebration view
function SuccessView({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();

  const features = [
    { icon: Shield, label: t("paywall.success_spy_unlocked"), delay: 0.7 },
    { icon: Zap, label: t("paywall.success_hourly_scans"), delay: 0.9 },
    { icon: BarChart3, label: t("paywall.success_all_analytics"), delay: 1.1 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex flex-col items-center justify-center min-h-[70vh] px-6 py-10"
    >
      {/* Radial glow background */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: "radial-gradient(circle at 50% 40%, hsl(var(--primary) / 0.4) 0%, transparent 70%)",
        }}
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <ConfettiParticles />

      {/* Spy GIF */}
      <motion.img
        src={spyGif}
        alt="Spy Agent"
        className="h-28 w-28 mb-6 drop-shadow-[0_0_30px_hsl(var(--primary)/0.5)] relative z-10"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: [0, 1.25, 1], rotate: [-20, 5, 0] }}
        transition={{ type: "spring", damping: 12, stiffness: 200, duration: 0.8 }}
      />

      {/* Title */}
      <motion.h2
        className="text-3xl font-extrabold text-foreground text-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {t("paywall.success_title")}
      </motion.h2>

      <motion.p
        className="text-muted-foreground text-center mt-2 text-sm relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.4 }}
      >
        {t("paywall.success_subtitle")}
      </motion.p>

      {/* Feature bullets */}
      <div className="mt-8 space-y-3 w-full max-w-xs relative z-10">
        {features.map((feat) => (
          <motion.div
            key={feat.label}
            className="flex items-center gap-3 bg-primary/10 rounded-2xl px-4 py-3"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: feat.delay, duration: 0.4, type: "spring", damping: 20 }}
          >
            <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center shrink-0">
              <feat.icon className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">{feat.label}</span>
          </motion.div>
        ))}
      </div>

      {/* CTA Button */}
      <motion.button
        onClick={() => { haptic.light(); onClose(); }}
        className="mt-10 w-full max-w-xs pill-btn-primary py-4 justify-center text-[15px] font-bold min-h-[44px] relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.5, type: "spring" }}
      >
        {t("paywall.success_cta")}
      </motion.button>
    </motion.div>
  );
}

export function PaywallSheet() {
  const { t } = useTranslation();
  const { isPaywallOpen, closePaywall, refetch } = useSubscription();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Period>("yearly");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
        setShowSuccess(true);
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

  const handleSuccessClose = () => {
    setShowSuccess(false);
    closePaywall();
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
            onClick={() => { if (!showSuccess) closePaywall(); }}
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
            {!showSuccess && (
              <button onClick={closePaywall} className="absolute top-4 end-4 p-2 text-muted-foreground hover:text-foreground z-10 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            )}

            <AnimatePresence mode="wait">
              {showSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SuccessView onClose={handleSuccessClose} />
                </motion.div>
              ) : (
                <motion.div
                  key="paywall"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-6 pb-8 pt-2"
                >
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
                    <div className="grid grid-cols-[1fr_60px_60px] items-center px-4 py-3 border-b border-border bg-muted/30">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("paywall.comp_feature")}</span>
                      <span className="text-[11px] font-semibold text-muted-foreground text-center uppercase tracking-wider">Free</span>
                      <span className="text-[11px] font-bold text-center uppercase tracking-wider gradient-text">Pro</span>
                    </div>
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
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
