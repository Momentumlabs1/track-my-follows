import { motion } from "framer-motion";
import { Check, Crown, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/contexts/SubscriptionContext";

const Pricing = () => {
  const { t } = useTranslation();
  const { plan, showPaywall } = useSubscription();

  const freeFeatures = [
    { label: t("paywall.feature_profiles").replace("5", "1"), included: true },
    { label: "6h scan updates", included: true },
    { label: t("paywall.feature_unfollows"), included: false },
    { label: t("paywall.feature_push"), included: false },
    { label: t("paywall.feature_stats"), included: false },
    { label: t("paywall.feature_unblur"), included: false },
  ];

  const proFeatures = [
    t("paywall.feature_profiles"),
    t("paywall.feature_hourly"),
    t("paywall.feature_unfollows"),
    t("paywall.feature_push"),
    t("paywall.feature_stats"),
    t("paywall.feature_unblur"),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 aurora-bg opacity-40" />
        <div className="absolute inset-0 mesh-dots" />
      </div>

      <main className="container relative py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <span className="tag-lavender mb-4">{t("pricing.tag")}</span>
          <h1 className="text-3xl md:text-5xl font-extrabold mt-4">
            {t("pricing.title")}
          </h1>
          <p className="mt-4 text-muted-foreground text-sm max-w-md mx-auto">
            {t("pricing.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {/* Free */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-3xl p-7">
            <span className="text-3xl">🕵️</span>
            <h3 className="text-xl font-extrabold mt-2">Free</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold">€0</span>
            </div>
            <ul className="mt-7 space-y-3">
              {freeFeatures.map(f => (
                <li key={f.label} className="flex items-center gap-2.5 text-[13px]">
                  {f.included ? (
                    <div className="h-4 w-4 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <X className="h-2.5 w-2.5 text-muted-foreground" />
                    </div>
                  )}
                  <span className={f.included ? "text-foreground" : "text-muted-foreground line-through"}>{f.label}</span>
                </li>
              ))}
            </ul>
            {plan === "free" && (
              <div className="mt-8 w-full py-3 rounded-2xl text-[13px] font-bold bg-secondary text-secondary-foreground text-center">
                {t("pricing.current") || "Current Plan"}
              </div>
            )}
          </motion.div>

          {/* Pro */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="relative glass-card gradient-border border-transparent glow-pink rounded-3xl p-7 scale-[1.03]">
            <div className="absolute inset-0 aurora-bg opacity-15 rounded-3xl" />
            <span className="relative inline-block gradient-bg text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full mb-4">
              🔥 Best Value
            </span>
            <div className="relative">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-extrabold">Pro</h3>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">€49.99</span>
                <span className="text-muted-foreground text-xs">{t("paywall.per_year")}</span>
              </div>
              <p className="text-[11px] text-primary font-semibold mt-1">
                ≈ €0.96{t("paywall.per_week")} · {t("paywall.save_percent", { percent: 89 })}
              </p>
              <ul className="mt-7 space-y-3">
                {proFeatures.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-[13px]">
                    <div className="h-4 w-4 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => showPaywall("pricing")}
                className="mt-8 pill-btn-primary w-full py-3 justify-center text-[13px] font-bold"
              >
                {plan === "pro" ? (t("pricing.current") || "Current Plan") : `${t("paywall.title")} 🚀`}
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
