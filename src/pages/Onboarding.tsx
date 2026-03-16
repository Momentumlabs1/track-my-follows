import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield, Zap, Bell } from "lucide-react";
import logoWide from "@/assets/logo-wide.png";

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [phase] = useState<"splash" | "landing">("landing");

  // Preload GIF
  useEffect(() => {
    const img = new Image();
    img.onload = () => setGifLoaded(true);
    img.src = spyLogoGif;
  }, []);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  // Splash → landing after 2.5s
  useEffect(() => {
    if (!gifLoaded) return;
    const timer = setTimeout(() => setPhase("landing"), 2500);
    return () => clearTimeout(timer);
  }, [gifLoaded]);

  if (loading || !gifLoaded) return <div className="min-h-[100dvh] bg-background" />;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden select-none">
      {/* ── Landing page (behind splash) ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "landing" ? 1 : 0 }}
        transition={{ duration: 0.4, delay: phase === "landing" ? 0.3 : 0 }}
        className="flex-1 flex flex-col relative"
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.1, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Logo */}
        {phase === "landing" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex justify-center pt-14 pb-2 relative z-10"
          >
            <img src={logoWide} alt="Spy-Secret" className="h-8 object-contain" />
          </motion.div>
        )}

        {/* Content */}
        {phase === "landing" && (
          <div className="flex-1 flex flex-col items-center relative z-20 overflow-y-auto pb-48">
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center px-8 pt-6"
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="h-20 w-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 shadow-lg shadow-primary/10"
              >
                <span className="text-4xl">👁️‍🗨️</span>
              </motion.div>
              <h1 className="text-[26px] font-extrabold tracking-tight text-foreground mb-1 leading-tight">
                {t("onboarding.slide1_title")}
                <br />
                <span className="text-primary">{t("onboarding.slide1_highlight")}</span>
              </h1>
              <p className="text-[14px] text-foreground/60 max-w-[300px] mt-2 leading-relaxed">
                {t("onboarding.slide1_desc")}
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex flex-wrap justify-center gap-2.5 mt-6 px-6"
            >
              {[
                { icon: "🔒", label: t("onboarding.pill_anonymous") },
                { icon: "⚡", label: t("onboarding.pill_realtime") },
                { icon: "📱", label: t("onboarding.pill_no_login") },
              ].map((pill, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2.5 rounded-2xl bg-card/60 border border-border/30 text-[13px] text-foreground font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <span className="text-base">{pill.icon}</span>
                  {pill.label}
                </span>
              ))}
            </motion.div>

            {/* Feature cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              className="mt-8 w-full max-w-[340px] px-6 space-y-3"
            >
              <FeatureRow
                icon={<Shield className="h-5 w-5 text-primary" />}
                title={t("onboarding.title_1")}
                desc={t("onboarding.sub_1")}
                delay={1.2}
              />
              <FeatureRow
                icon={<Zap className="h-5 w-5 text-primary" />}
                title={t("onboarding.title_2")}
                desc={t("onboarding.sub_2")}
                delay={1.35}
              />
              <FeatureRow
                icon={<Bell className="h-5 w-5 text-primary" />}
                title={t("onboarding.title_3")}
                desc={t("onboarding.sub_3")}
                delay={1.5}
              />
            </motion.div>

            {/* Notification preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 w-full max-w-[300px] mx-auto rounded-2xl bg-card/50 border border-border/30 p-4 backdrop-blur-sm shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-lg">💘</span>
                </div>
                <div className="text-start flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-foreground">Spy-Secret</p>
                  <p className="text-[12px] text-foreground/60">{t("onboarding.notification_example")}</p>
                </div>
                <span className="text-[11px] text-foreground/30 shrink-0 self-start">2m</span>
              </div>
            </motion.div>
          </div>
        )}

        {/* Bottom CTA */}
        {phase === "landing" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent pt-12 pb-[calc(env(safe-area-inset-bottom)+16px)] px-6"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/login")}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-4 text-[15px] font-bold shadow-lg shadow-primary/25 transition-shadow mb-3"
            >
              {t("onboarding.get_started")}
              <ArrowRight className="h-4 w-4" />
            </motion.button>

            <p className="text-center text-[13px] text-muted-foreground pb-1">
              {t("onboarding.already_have_account")}{" "}
              <Link to="/login" className="text-primary font-semibold">
                {t("onboarding.login")}
              </Link>
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* ── Splash overlay ── */}
      <AnimatePresence>
        {phase === "splash" && (
          <motion.div
            key="splash-overlay"
            initial={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center overflow-hidden"
          >
            <motion.div
              className="absolute w-72 h-72 rounded-full border border-primary/20"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.8], opacity: [0.4, 0] }}
              transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
            />
            <motion.div
              className="absolute w-48 h-48 rounded-full border border-primary/30"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.8, ease: "easeOut", delay: 0.5 }}
            />
            <motion.div
              className="absolute w-64 h-64 rounded-full bg-primary/15 blur-[100px]"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />

            <div className="relative flex flex-col items-center">
              <motion.img
                src={spyLogoGif}
                alt="Spy-Secret"
                className="h-36 w-36 object-contain mb-6"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1.2, 0.3, 1], delay: 0.1 }}
              />
              <motion.div
                className="flex items-center gap-0.5"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <span className="text-2xl font-extrabold text-foreground tracking-tight">Spy</span>
                <span className="text-2xl font-extrabold text-primary tracking-tight">Secret</span>
              </motion.div>
              <motion.p
                className="text-sm text-muted-foreground mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                {t("splash.subtitle")}
              </motion.p>
              <motion.div
                className="flex gap-1.5 mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Feature row component ── */
function FeatureRow({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3 rounded-2xl bg-card/40 border border-border/20 p-3.5"
    >
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-foreground">{title}</p>
        <p className="text-[12px] text-foreground/50 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}
