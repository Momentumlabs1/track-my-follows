import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import spyLogoGif from "@/assets/spy-logo-animated.gif";
import logoWide from "@/assets/logo-wide.png";

const STEPS = 3;

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [gifLoaded, setGifLoaded] = useState(false);
  const [phase, setPhase] = useState<"splash" | "steps">("splash");
  const [step, setStep] = useState(0);

  // Preload GIF before showing anything
  useEffect(() => {
    const img = new Image();
    img.onload = () => setGifLoaded(true);
    img.src = spyLogoGif;
  }, []);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  // Splash phase: show for 2.5s AFTER gif loaded, then swipe up
  useEffect(() => {
    if (!gifLoaded) return;
    const timer = setTimeout(() => setPhase("steps"), 2500);
    return () => clearTimeout(timer);
  }, [gifLoaded]);

  const handleNext = useCallback(() => {
    if (step >= STEPS - 1) {
      navigate("/login");
    } else {
      setStep(s => s + 1);
    }
  }, [step, navigate]);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientY);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || phase !== "steps") return;
    const diff = touchStart - e.changedTouches[0].clientY;
    if (diff > 60) handleNext();
    if (diff < -60 && step > 0) setStep(s => s - 1);
    setTouchStart(null);
  };

  if (loading || !gifLoaded) return <div className="min-h-[100dvh] bg-background" />;

  return (
    <div
      className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Steps layer (always mounted behind splash) ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "steps" ? 1 : 0 }}
        transition={{ duration: 0.4, delay: phase === "steps" ? 0.3 : 0 }}
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

        {/* Small logo at top */}
        {phase === "steps" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex justify-center pt-14 pb-4 relative z-10"
          >
            <img src={logoWide} alt="Spy-Secret" className="h-8 object-contain" />
          </motion.div>
        )}

        {/* Step content */}
        <div className="flex-1 flex items-start justify-center relative z-20 pt-8">
          <AnimatePresence mode="wait">
            {phase === "steps" && step === 0 && (
              <StepSlide key="s0" emoji="👁️‍🗨️" title={t("onboarding.slide1_title")} highlight={t("onboarding.slide1_highlight")} desc={t("onboarding.slide1_desc")} />
            )}
            {phase === "steps" && step === 1 && (
              <StepSlide key="s1" emoji="🛡️" title={t("onboarding.title_1")} desc={t("onboarding.sub_1")}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  className="flex flex-wrap justify-center gap-2.5 mt-8"
                >
                  {[
                    { icon: "🔒", label: "100% Anonym" },
                    { icon: "⚡", label: "Echtzeit" },
                    { icon: "📱", label: "Kein Login nötig" },
                  ].map((pill) => (
                    <span
                      key={pill.label}
                      className="px-4 py-2.5 rounded-2xl bg-white/[0.08] border border-white/[0.1] text-[13px] text-foreground font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="text-base">{pill.icon}</span>
                      {pill.label}
                    </span>
                  ))}
                </motion.div>
              </StepSlide>
            )}
            {phase === "steps" && step === 2 && (
              <StepSlide key="s2" emoji="🔔" title={t("onboarding.title_3")} desc={t("onboarding.sub_3")}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-8 w-full max-w-[300px] rounded-2xl bg-white/[0.07] border border-white/[0.1] p-4 backdrop-blur-sm shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xl">💘</span>
                    </div>
                    <div className="text-start flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-foreground">Spy-Secret</p>
                      <p className="text-[12px] text-foreground/60">{t("onboarding.notification_example")}</p>
                    </div>
                    <span className="text-[11px] text-foreground/30 shrink-0 self-start">2m</span>
                  </div>
                </motion.div>
              </StepSlide>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom controls */}
        {phase === "steps" && (
          <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent pt-16 pb-[calc(env(safe-area-inset-bottom)+16px)] px-6">
            <div className="flex items-center justify-center gap-1.5 mb-5">
              {Array.from({ length: STEPS }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ width: i === step ? 28 : 8, opacity: i === step ? 1 : 0.25 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-[3px] rounded-full ${i <= step ? "bg-primary" : "bg-foreground/20"}`}
                />
              ))}
            </div>

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
        )}
      </motion.div>

      {/* ── Splash overlay – swipes UP to reveal steps ── */}
      <AnimatePresence>
        {phase === "splash" && (
          <motion.div
            key="splash-overlay"
            initial={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Glow rings */}
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

            {/* Background glow */}
            <motion.div
              className="absolute w-64 h-64 rounded-full bg-primary/15 blur-[100px]"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />

            <div className="relative flex flex-col items-center">
              {/* GIF logo */}
              <motion.img
                src={spyLogoGif}
                alt="Spy-Secret"
                className="h-36 w-36 object-contain mb-6"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1.2, 0.3, 1], delay: 0.1 }}
              />

              {/* Brand name */}
              <motion.div
                className="flex items-center gap-0.5"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <span className="text-2xl font-extrabold text-foreground tracking-tight">Spy</span>
                <span className="text-2xl font-extrabold text-primary tracking-tight">Secret</span>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                className="text-sm text-muted-foreground mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                {t("splash.subtitle")}
              </motion.p>

              {/* Loading dots */}
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

/* ── Step slide component ── */
function StepSlide({
  emoji, title, highlight, desc, children,
}: {
  emoji: string; title: string; highlight?: string; desc: string; children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center px-8"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="h-24 w-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-lg shadow-primary/10"
      >
        <span className="text-5xl">{emoji}</span>
      </motion.div>
      <h2 className="text-[28px] font-extrabold tracking-tight text-foreground mb-1 leading-tight">
        {title}
        {highlight && (
          <>
            <br />
            <span className="text-primary">{highlight}</span>
          </>
        )}
      </h2>
      <p className="text-[15px] text-foreground/60 max-w-[280px] mt-3 leading-relaxed">{desc}</p>
      {children}
    </motion.div>
  );
}
