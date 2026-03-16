import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { SpyIcon } from "@/components/SpyIcon";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const TOTAL_STEPS = 5;

function FeatureCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-[#1C1C1E] border border-border/30 p-3">
      <span className="text-2xl flex-shrink-0">{emoji}</span>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-foreground leading-tight">{title}</p>
        <p className="text-[13px] text-[#8E8E93] leading-snug mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function DotIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export function WelcomeDialog() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const welcomeKey = user ? `welcome_shown_${user.id}` : null;
  const forceShow = (location.state as { showWelcome?: boolean } | null)?.showWelcome === true;

  useEffect(() => {
    if (!welcomeKey || localStorage.getItem(welcomeKey)) return;

    if (forceShow) {
      setOpen(true);
      return;
    }

    const timer = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(timer);
  }, [welcomeKey, forceShow]);

  const handleClose = () => {
    if (welcomeKey) localStorage.setItem(welcomeKey, "1");
    setOpen(false);
  };

  const next = useCallback(() => {
    if (step === TOTAL_STEPS - 1) {
      handleClose();
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  }, [step]);

  const back = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col items-center text-center px-2">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
            >
              <SpyIcon size={80} glow />
            </motion.div>
            <h2 className="text-xl font-extrabold text-foreground mt-6 mb-2">
              {t("welcome.step1_title", "Willkommen, Agent! 🕵️")}
            </h2>
            <p className="text-[15px] text-[#8E8E93] leading-relaxed max-w-[280px]">
              {t("welcome.step1_desc", "Dein geheimer Agent wurde aktiviert. Finde heraus wem dein Crush heimlich folgt – komplett anonym.")}
            </p>
          </div>
        );

      case 1:
        return (
          <div className="flex flex-col items-center text-center px-2">
            <div className="w-full max-w-[280px] mb-6">
              <div className="flex items-center gap-2 rounded-xl bg-[#1C1C1E] border border-border/30 px-4 py-3">
                <span className="text-[#8E8E93] text-lg">@</span>
                <span className="text-[15px] text-[#8E8E93]">
                  {t("welcome.step2_placeholder", "Username eingeben...")}
                </span>
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-foreground mb-2">
              {t("welcome.step2_title", "Profil tracken")}
            </h2>
            <p className="text-[15px] text-[#8E8E93] leading-relaxed max-w-[280px]">
              {t("welcome.step2_desc", "Gib einen Instagram-Usernamen ein – wir scannen das Profil anonym. Niemand erfährt davon.")}
            </p>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col items-center text-center px-2">
            <h2 className="text-xl font-extrabold text-foreground mb-4">
              {t("welcome.step3_title", "Was dein Agent findet")}
            </h2>
            <div className="w-full space-y-2.5">
              <FeatureCard
                emoji="👀"
                title={t("welcome.step3_card1_title", "Neue Follows")}
                desc={t("welcome.step3_card1_desc", "Sieh wem die Person zuletzt gefolgt ist")}
              />
              <FeatureCard
                emoji="👥"
                title={t("welcome.step3_card2_title", "Neue Follower")}
                desc={t("welcome.step3_card2_desc", "Wer folgt der Person neu")}
              />
              <FeatureCard
                emoji="♀♂"
                title={t("welcome.step3_card3_title", "Geschlechterverteilung")}
                desc={t("welcome.step3_card3_desc", "Folgt die Person eher Frauen oder Männern")}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col items-center text-center px-2">
            <h2 className="text-xl font-extrabold text-foreground mb-4">
              {t("welcome.step4_title", "Pro Features 💎")}
            </h2>
            <div className="w-full space-y-2.5">
              <FeatureCard
                emoji="🔄"
                title={t("welcome.step4_card1_title", "Unfollow-Tracker")}
                desc={t("welcome.step4_card1_desc", "Wer wurde entfolgt")}
              />
              <FeatureCard
                emoji="🕵️"
                title={t("welcome.step4_card2_title", "Spy-Agent")}
                desc={t("welcome.step4_card2_desc", "Stündliche Scans rund um die Uhr")}
              />
              <FeatureCard
                emoji="🚩"
                title={t("welcome.step4_card3_title", "Verdachts-Score")}
                desc={t("welcome.step4_card3_desc", "Wie verdächtig ist das Verhalten (0-100)")}
              />
              <FeatureCard
                emoji="👻"
                title={t("welcome.step4_card4_title", "Ghost-Follows")}
                desc={t("welcome.step4_card4_desc", "Follow-Unfollow Muster erkennen")}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col items-center text-center px-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.1 }}
            >
              <SpyIcon size={80} glow />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl mt-3 mb-2"
            >
              🎉
            </motion.div>
            <h2 className="text-xl font-extrabold text-foreground mb-2">
              {t("welcome.step5_title", "Los geht's!")}
            </h2>
            <p className="text-[15px] text-[#8E8E93] leading-relaxed max-w-[280px]">
              {t("welcome.step5_desc", "Du bist bereit, Agent! Dein erster Scan läuft.")}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-[380px] w-[calc(100%-32px)] rounded-3xl border-border/30 bg-background p-0 overflow-hidden [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Tutorial</DialogTitle>
        <DialogDescription className="sr-only">Welcome tutorial</DialogDescription>

        <div className="relative px-5 pt-8 pb-5 flex flex-col min-h-[420px]">
          {/* Step content */}
          <div className="flex-1 flex items-center justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "tween", duration: 0.25 }}
                className="w-full"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom: dots + buttons */}
          <div className="mt-6 space-y-4">
            <DotIndicator current={step} total={TOTAL_STEPS} />

            <div className="flex gap-3">
              {step > 0 && (
                <button
                  onClick={back}
                  className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground text-[14px] font-bold active:scale-[0.97] transition-transform"
                >
                  {t("common.back", "Zurück")}
                </button>
              )}
              <button
                onClick={next}
                className={`${step > 0 ? "flex-[2]" : "w-full"} py-3 rounded-xl bg-primary text-primary-foreground text-[14px] font-bold active:scale-[0.97] transition-transform`}
              >
                {step === 0
                  ? t("welcome.step1_cta", "Erste Mission starten →")
                  : step === TOTAL_STEPS - 1
                    ? t("welcome.step5_cta", "Mission starten 🚀")
                    : t("onboarding.next", "Weiter")}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
