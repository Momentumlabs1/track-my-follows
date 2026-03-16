import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { SpyIcon } from "@/components/SpyIcon";
import { SpotlightOverlay } from "@/components/SpotlightOverlay";

const TOTAL_STEPS = 9;

type StepDef =
  | { type: "fullscreen"; content: "welcome" | "complete" }
  | {
      type: "spotlight";
      targetId: string;
      titleKey: string;
      textKey: string;
      position: "top" | "bottom";
      hideButton?: boolean;
    }
  | { type: "action"; action: "wait_for_add_profile" | "wait_for_scan_complete" };

const STEPS: StepDef[] = [
  { type: "fullscreen", content: "welcome" },
  { type: "spotlight", targetId: "add-profile-btn", titleKey: "tutorial.step2_title", textKey: "tutorial.step2_text", position: "top", hideButton: true },
  { type: "action", action: "wait_for_add_profile" },
  { type: "action", action: "wait_for_scan_complete" },
  { type: "spotlight", targetId: "gender-bar", titleKey: "tutorial.step5_title", textKey: "tutorial.step5_text", position: "bottom" },
  { type: "spotlight", targetId: "tabs-section", titleKey: "tutorial.step6_title", textKey: "tutorial.step6_text", position: "top" },
  { type: "spotlight", targetId: "locked-analysis", titleKey: "tutorial.step7_title", textKey: "tutorial.step7_text", position: "top" },
  { type: "spotlight", targetId: "spy-agent-zone", titleKey: "tutorial.step8_title", textKey: "tutorial.step8_text", position: "bottom" },
  { type: "fullscreen", content: "complete" },
];

function DotIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: i === current ? 20 : 6,
            background: i === current ? "#FF2D55" : "#3A3A3C",
          }}
        />
      ))}
    </div>
  );
}

export function AppTutorial() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  const tutorialKey = user ? `tutorial_shown_${user.id}` : null;
  const forceShow = (location.state as { showWelcome?: boolean } | null)?.showWelcome === true;

  useEffect(() => {
    if (!tutorialKey || localStorage.getItem(tutorialKey)) return;
    if (forceShow) {
      setActive(true);
      return;
    }
    const timer = setTimeout(() => setActive(true), 600);
    return () => clearTimeout(timer);
  }, [tutorialKey, forceShow]);

  // Listen for route changes to advance action steps
  useEffect(() => {
    if (!active) return;
    const currentStep = STEPS[step];
    if (currentStep?.type !== "action") return;

    if (currentStep.action === "wait_for_add_profile") {
      // User navigated to /analyzing or added a profile
      if (location.pathname.startsWith("/analyzing") || location.pathname.startsWith("/add-profile")) {
        setStep((s) => s + 1);
      }
    } else if (currentStep.action === "wait_for_scan_complete") {
      if (location.pathname.startsWith("/profile/")) {
        setStep((s) => s + 1);
      }
    }
  }, [location.pathname, step, active]);

  // Skip action steps that might already be passed
  useEffect(() => {
    if (!active) return;
    const currentStep = STEPS[step];
    if (currentStep?.type === "action") {
      if (currentStep.action === "wait_for_add_profile" && location.pathname.startsWith("/analyzing")) {
        setStep((s) => s + 1);
      } else if (currentStep.action === "wait_for_scan_complete" && location.pathname.startsWith("/profile/")) {
        setStep((s) => s + 1);
      }
    }
  }, [step, active]);

  // For spotlight steps, check if target element exists. If not on dashboard, skip step 7 (spy-agent-zone) by navigating back.
  useEffect(() => {
    if (!active) return;
    const currentStep = STEPS[step];
    if (currentStep?.type === "spotlight" && currentStep.targetId === "spy-agent-zone") {
      if (!location.pathname.startsWith("/dashboard")) {
        navigate("/dashboard");
      }
    }
  }, [step, active]);

  // For step 2 (spotlight on add-profile-btn), intercept click on the target
  useEffect(() => {
    if (!active) return;
    const currentStep = STEPS[step];
    if (currentStep?.type === "spotlight" && currentStep.hideButton) {
      const handler = (e: MouseEvent) => {
        const el = document.getElementById(currentStep.targetId);
        if (el && (el === e.target || el.contains(e.target as Node))) {
          setStep((s) => s + 1);
        }
      };
      // Use capture to catch the click before anything else
      document.addEventListener("click", handler, true);
      return () => document.removeEventListener("click", handler, true);
    }
  }, [step, active]);

  const handleClose = useCallback(() => {
    if (tutorialKey) localStorage.setItem(tutorialKey, "1");
    setActive(false);
  }, [tutorialKey]);

  const handleNext = useCallback(() => {
    if (step >= TOTAL_STEPS - 1) {
      handleClose();
      return;
    }
    setStep((s) => s + 1);
  }, [step, handleClose]);

  if (!active) return null;

  const currentStep = STEPS[step];
  if (!currentStep) return null;

  // Action steps render nothing
  if (currentStep.type === "action") return null;

  // Fullscreen steps
  if (currentStep.type === "fullscreen") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#000",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          {currentStep.content === "welcome" ? (
            <div className="flex flex-col items-center text-center max-w-[320px]">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
              >
                <SpyIcon size={64} glow />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginTop: 24 }}
              >
                {t("tutorial.welcome_title", "Dein geheimer Agent wurde aktiviert")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                style={{ fontSize: 15, color: "#8E8E93", marginTop: 12, lineHeight: 1.6 }}
              >
                {t("tutorial.welcome_desc", "Finde heraus wem dein Crush heimlich folgt – komplett anonym.")}
              </motion.p>
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={handleNext}
                style={{
                  width: "100%",
                  marginTop: 32,
                  padding: "14px 0",
                  background: "#FF2D55",
                  borderRadius: 12,
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  minHeight: 48,
                }}
              >
                {t("tutorial.welcome_cta", "Erste Mission starten →")}
              </motion.button>
              <div className="mt-6">
                <DotIndicator current={0} total={TOTAL_STEPS} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center max-w-[320px]">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.1 }}
              >
                <SpyIcon size={64} glow />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: "2.5rem", marginTop: 12, marginBottom: 8 }}
              >
                ✅
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}
              >
                {t("tutorial.complete_title", "Du bist bereit, Agent!")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                style={{ fontSize: 15, color: "#8E8E93", marginTop: 12, lineHeight: 1.6 }}
              >
                {t("tutorial.complete_desc", "Dein erster Scan läuft bereits. Schau später wieder rein für neue Ergebnisse.")}
              </motion.p>
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={handleClose}
                style={{
                  width: "100%",
                  marginTop: 32,
                  padding: "14px 0",
                  background: "#FF2D55",
                  borderRadius: 12,
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  minHeight: 48,
                }}
              >
                {t("tutorial.complete_cta", "Mission starten 🚀")}
              </motion.button>
              <div className="mt-6">
                <DotIndicator current={TOTAL_STEPS - 1} total={TOTAL_STEPS} />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Spotlight steps
  if (currentStep.type === "spotlight") {
    // Check if target exists; if not, wait a bit or skip
    const targetExists = !!document.getElementById(currentStep.targetId);
    if (!targetExists) {
      // Don't render overlay if target not found yet — will re-render on next state change
      return null;
    }

    return (
      <SpotlightOverlay
        targetId={currentStep.targetId}
        tooltipTitle={t(currentStep.titleKey)}
        tooltipText={t(currentStep.textKey)}
        buttonText={currentStep.hideButton ? "" : t("onboarding.next", "Weiter")}
        onNext={handleNext}
        position={currentStep.position}
        step={step}
        totalSteps={TOTAL_STEPS}
        hideButton={currentStep.hideButton}
      />
    );
  }

  return null;
}
