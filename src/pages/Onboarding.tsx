import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import spyLogoGif from "@/assets/spy-logo-animated.gif";

const STEPS = 3;

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [logoReady, setLogoReady] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  // Logo intro delay
  useEffect(() => {
    const timer = setTimeout(() => setLogoReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = useCallback(() => {
    if (step >= STEPS - 1) {
      navigate("/login");
    } else {
      setStep(s => s + 1);
    }
  }, [step, navigate]);

  // Swipe detection
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientY);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientY;
    if (diff > 60) handleNext();
    if (diff < -60 && step > 0) setStep(s => s - 1);
    setTouchStart(null);
  };

  if (loading) return null;

  return (
    <div
      className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient glow - always present */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{
            opacity: [0.15, 0.3, 0.15],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Spy Logo - always centered, scales down when content appears */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -20 }}
          animate={{
            scale: logoReady && step === 0 ? 1 : 0.6,
            opacity: 1,
            rotate: 0,
            y: logoReady && step > 0 ? -140 : 0,
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Pulse rings */}
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-[32px] border border-primary/20"
          />
          <motion.div
            animate={{ scale: [1, 2, 1], opacity: [0.15, 0, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute inset-0 rounded-[32px] border border-primary/10"
          />
          
          <div className="h-36 w-36 rounded-[32px] bg-background/80 backdrop-blur-xl border border-white/[0.06] flex items-center justify-center shadow-2xl shadow-primary/20 overflow-hidden">
            <img src={spyLogoGif} alt="Spy" className="h-28 w-28 object-contain" />
          </div>
        </motion.div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center relative z-20">
        <AnimatePresence mode="wait">
          {/* Step 0: Just the logo with tagline */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center px-8 pt-48"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: logoReady ? 1 : 0, y: logoReady ? 0 : 30 }}
                transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="mt-44"
              >
                <h1 className="text-[32px] font-extrabold tracking-tight text-foreground leading-[1.15]">
                  {t("onboarding.slide1_title")}
                  <br />
                  <span className="text-primary">{t("onboarding.slide1_highlight")}</span>
                </h1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: logoReady ? 1 : 0, y: logoReady ? 0 : 20 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="text-[15px] text-muted-foreground max-w-[280px] mt-5 leading-relaxed"
              >
                {t("onboarding.slide1_desc")}
              </motion.p>
            </motion.div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center px-8 pt-20"
            >
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mt-20">
                <span className="text-4xl">👁️‍🗨️</span>
              </div>
              <h2 className="text-[26px] font-extrabold tracking-tight text-foreground mb-3 leading-tight">
                {t("onboarding.title_1")}
              </h2>
              <p className="text-[15px] text-muted-foreground max-w-[280px] leading-relaxed">
                {t("onboarding.sub_1")}
              </p>

              {/* Feature pills */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-wrap justify-center gap-2 mt-8"
              >
                {["🔒 100% Anonym", "⚡ Echtzeit", "📱 Kein Login"].map((pill) => (
                  <span
                    key={pill}
                    className="px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.06] text-[13px] text-foreground/70 font-medium"
                  >
                    {pill}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center px-8 pt-20"
            >
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mt-20">
                <span className="text-4xl">🔥</span>
              </div>
              <h2 className="text-[26px] font-extrabold tracking-tight text-foreground mb-3 leading-tight">
                {t("onboarding.title_3")}
              </h2>
              <p className="text-[15px] text-muted-foreground max-w-[280px] leading-relaxed">
                {t("onboarding.sub_3")}
              </p>

              {/* Mock notification */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 w-full max-w-[300px] rounded-2xl bg-white/[0.05] border border-white/[0.06] p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-lg">💘</span>
                  </div>
                  <div className="text-start">
                    <p className="text-[13px] font-semibold text-foreground">Spy-Secret</p>
                    <p className="text-[12px] text-muted-foreground">@saif folgt jetzt @jessica_x 👀</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground/50 shrink-0 self-start">2m</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent pt-16 pb-[calc(env(safe-area-inset-bottom)+16px)] px-6">
        {/* Progress bar */}
        <div className="flex items-center justify-center gap-1.5 mb-5">
          {Array.from({ length: STEPS }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === step ? 28 : 8,
                opacity: i === step ? 1 : 0.25,
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`h-[3px] rounded-full ${
                i <= step ? "bg-primary" : "bg-foreground/20"
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-4 text-[15px] font-bold shadow-lg shadow-primary/25 transition-shadow mb-4"
        >
          {step === STEPS - 1 ? t("onboarding.get_started") : t("onboarding.next")}
          <ArrowRight className="h-4 w-4" />
        </motion.button>

        <p className="text-center text-[13px] text-muted-foreground pb-1">
          {t("onboarding.already_have_account")}{" "}
          <Link to="/login" className="text-primary font-semibold">
            {t("onboarding.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
