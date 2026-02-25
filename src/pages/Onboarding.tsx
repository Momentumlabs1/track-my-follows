import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import spyLogoGif from "@/assets/spy-logo-animated.gif";

type Phase = "intro" | "steps";
const STEPS = 3;

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  // Auto-transition: intro → steps after 2.5s
  useEffect(() => {
    const timer = setTimeout(() => setPhase("steps"), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = useCallback(() => {
    if (step >= STEPS - 1) {
      navigate("/login");
    } else {
      setStep(s => s + 1);
    }
  }, [step, navigate]);

  // Swipe detection for steps
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientY);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || phase !== "steps") return;
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
      <AnimatePresence mode="wait">
        {/* ── PHASE 1: Full-screen logo intro ── */}
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{
              opacity: { duration: 1.2, ease: "easeOut" },
              y: { duration: 0.7, ease: [0.76, 0, 0.24, 1] },
            }}
            className="absolute inset-0 z-50 bg-background flex items-center justify-center"
          >
            {/* Ambient glow behind logo */}
            <motion.div
              animate={{ opacity: [0, 0.4, 0.25], scale: [0.8, 1.1, 1] }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute w-[400px] h-[400px] rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)",
              }}
            />
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Pulse ring */}
              <motion.div
                animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 rounded-[36px] border border-primary/30"
              />
              <div className="h-40 w-40 rounded-[36px] bg-background/80 backdrop-blur-xl border border-white/[0.06] flex items-center justify-center shadow-2xl shadow-primary/20 overflow-hidden">
                <img src={spyLogoGif} alt="Spy" className="h-32 w-32 object-contain" />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── PHASE 2: Step explanations ── */}
        {phase === "steps" && (
          <motion.div
            key="steps"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
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
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center pt-14 pb-4 relative z-10"
            >
              <div className="h-16 w-16 rounded-2xl bg-background/80 backdrop-blur-xl border border-white/[0.06] flex items-center justify-center shadow-lg shadow-primary/10 overflow-hidden">
                <img src={spyLogoGif} alt="Spy" className="h-12 w-12 object-contain" />
              </div>
            </motion.div>

            {/* Step content */}
            <div className="flex-1 flex items-start justify-center relative z-20 pt-8">
              <AnimatePresence mode="wait">
                {step === 0 && <StepSlide key="s0" icon="👁️‍🗨️" title={t("onboarding.slide1_title")} highlight={t("onboarding.slide1_highlight")} desc={t("onboarding.slide1_desc")} />}
                {step === 1 && (
                  <StepSlide key="s1" icon="🔒" title={t("onboarding.title_1")} desc={t("onboarding.sub_1")}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35, duration: 0.5 }}
                      className="flex flex-wrap justify-center gap-2 mt-8"
                    >
                      {["🔒 100% Anonym", "⚡ Echtzeit", "📱 Kein Login"].map((pill) => (
                        <span key={pill} className="px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.06] text-[13px] text-foreground/70 font-medium">
                          {pill}
                        </span>
                      ))}
                    </motion.div>
                  </StepSlide>
                )}
                {step === 2 && (
                  <StepSlide key="s2" icon="🔥" title={t("onboarding.title_3")} desc={t("onboarding.sub_3")}>
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
                  </StepSlide>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom controls */}
            <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent pt-16 pb-[calc(env(safe-area-inset-bottom)+16px)] px-6">
              {/* Progress dots */}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Step slide component ── */
function StepSlide({
  icon, title, highlight, desc, children,
}: {
  icon: string; title: string; highlight?: string; desc: string; children?: React.ReactNode;
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
        className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6"
      >
        <span className="text-4xl">{icon}</span>
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
      <p className="text-[15px] text-muted-foreground max-w-[280px] mt-3 leading-relaxed">{desc}</p>
      {children}
    </motion.div>
  );
}
