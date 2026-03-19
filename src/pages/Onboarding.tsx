import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowRight, Eye, Zap, Shield } from "lucide-react";
import logoWide from "@/assets/logo-wide.png";
import { SpyIcon } from "@/components/SpyIcon";

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  if (loading) return <div className="min-h-[100dvh] bg-background" />;

  return (
    <div className="h-[100dvh] bg-background flex flex-col relative overflow-hidden select-none">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ opacity: [0.12, 0.25, 0.12], scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)" }}
        />
      </div>

      {/* Content area — no scroll */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        {/* Logo */}
        <motion.img
          src={logoWide}
          alt="Spy-Secret"
          className="h-7 object-contain mb-6"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />

        {/* Spy Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mb-5"
        >
          <SpyIcon size={56} glow />
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mb-6"
        >
          <h1 className="text-[24px] font-extrabold tracking-tight text-foreground leading-tight">
            {t("onboarding.slide1_title")}
            <br />
            <span className="text-primary">{t("onboarding.slide1_highlight")}</span>
          </h1>
          <p className="text-[13px] text-muted-foreground max-w-[280px] mx-auto mt-2.5 leading-relaxed">
            {t("onboarding.slide1_desc")}
          </p>
        </motion.div>

        {/* 3 Feature icons in a row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex items-center justify-center gap-5 mb-6"
        >
          {[
            { icon: <Shield className="h-5 w-5 text-primary" />, label: t("onboarding.pill_anonymous") },
            { icon: <Zap className="h-5 w-5 text-primary" />, label: t("onboarding.pill_realtime") },
            { icon: <Eye className="h-5 w-5 text-primary" />, label: t("onboarding.pill_no_login") },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                {item.icon}
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold text-center max-w-[72px] leading-tight">
                {item.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Notification preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="w-full max-w-[280px] rounded-2xl bg-card/50 border border-border/30 p-3.5 backdrop-blur-sm shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-base">💘</span>
            </div>
            <div className="text-start flex-1 min-w-0">
              <p className="text-[12px] font-bold text-foreground">Spy-Secret</p>
              <p className="text-[11px] text-muted-foreground">{t("onboarding.notification_example")}</p>
            </div>
            <span className="text-[10px] text-foreground/30 shrink-0 self-start">2m</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom CTA — fixed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="relative z-20 px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-4"
        style={{ background: "linear-gradient(to top, hsl(var(--background)) 60%, transparent)" }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/login")}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-4 text-[15px] font-bold shadow-lg shadow-primary/25 mb-3"
        >
          {t("onboarding.get_started")}
          <ArrowRight className="h-4 w-4" />
        </motion.button>

        <p className="text-center text-[12px] text-muted-foreground pb-1">
          {t("onboarding.already_have_account")}{" "}
          <Link to="/login" className="text-primary font-semibold">
            {t("onboarding.login")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
