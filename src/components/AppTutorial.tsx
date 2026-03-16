import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { SpyIcon } from "@/components/SpyIcon";
import { SpotlightOverlay } from "@/components/SpotlightOverlay";

type StepDef =
  | {
      type: "spotlight";
      targetId: string;
      titleKey: string;
      textKey: string;
      commentKey: string;
      position: "top" | "bottom";
      hideButton?: boolean;
    }
  | { type: "action"; action: "wait_for_add_profile" | "wait_for_scan_complete" };

const STEPS: StepDef[] = [
  // Step 0: Spotlight on "+" button — user must tap it
  { type: "spotlight", targetId: "add-profile-btn", titleKey: "tutorial.step2_title", textKey: "tutorial.step2_text", commentKey: "tutorial.comment_add", position: "top", hideButton: true },
  // Step 1: Wait for navigation to /analyzing or /add-profile
  { type: "action", action: "wait_for_add_profile" },
  // Step 2: Wait for scan complete → /profile/*
  { type: "action", action: "wait_for_scan_complete" },
  // Step 3: Gender bar
  { type: "spotlight", targetId: "gender-bar", titleKey: "tutorial.step5_title", textKey: "tutorial.step5_text", commentKey: "tutorial.comment_gender", position: "bottom" },
  // Step 4: Tabs
  { type: "spotlight", targetId: "tabs-section", titleKey: "tutorial.step6_title", textKey: "tutorial.step6_text", commentKey: "tutorial.comment_tabs", position: "top" },
  // Step 5: Locked analysis
  { type: "spotlight", targetId: "locked-analysis", titleKey: "tutorial.step7_title", textKey: "tutorial.step7_text", commentKey: "tutorial.comment_pro", position: "top" },
  // Step 6: Spy agent zone (back on dashboard)
  { type: "spotlight", targetId: "spy-agent-zone", titleKey: "tutorial.step8_title", textKey: "tutorial.step8_text", commentKey: "tutorial.comment_spy", position: "bottom" },
];

export function AppTutorial() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<"idle" | "intro" | "walkthrough" | "done">("idle");
  const [step, setStep] = useState(0);
  const [spotlightVisible, setSpotlightVisible] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout>>();

  const tutorialKey = user ? `tutorial_shown_${user.id}` : null;
  const forceShow = (location.state as { showWelcome?: boolean } | null)?.showWelcome === true;

  // ONLY trigger on fresh registration via showWelcome flag — never auto-trigger
  useEffect(() => {
    if (!tutorialKey) return;
    if (localStorage.getItem(tutorialKey)) return;
    
    // Must have explicit showWelcome from registration flow
    const hasFlag = forceShow || (user && sessionStorage.getItem(`show_welcome_${user.id}`));
    if (!hasFlag) return;
    
    const timer = setTimeout(() => setPhase("intro"), 2000);
    return () => clearTimeout(timer);
  }, [tutorialKey, forceShow, user]);

  // Navigate to dashboard for spy-agent-zone step
  useEffect(() => {
    if (phase !== "walkthrough") return;
    const currentStep = STEPS[step];
    if (currentStep?.type === "spotlight" && currentStep.targetId === "spy-agent-zone") {
      if (!location.pathname.startsWith("/dashboard")) navigate("/dashboard");
    }
  }, [step, phase]);

  // Listen for route changes to advance action steps
  useEffect(() => {
    if (phase !== "walkthrough") return;
    const currentStep = STEPS[step];
    if (currentStep?.type !== "action") return;

    if (currentStep.action === "wait_for_add_profile") {
      if (location.pathname.startsWith("/analyzing") || location.pathname.startsWith("/add-profile")) {
        advanceStep();
      }
    } else if (currentStep.action === "wait_for_scan_complete") {
      if (location.pathname.startsWith("/profile/")) {
        advanceStep();
      }
    }
  }, [location.pathname, step, phase]);

  // For spotlight steps with hideButton: intercept click on target element
  useEffect(() => {
    if (phase !== "walkthrough") return;
    const currentStep = STEPS[step];
    if (currentStep?.type === "spotlight" && currentStep.hideButton) {
      const handler = (e: MouseEvent) => {
        const el = document.getElementById(currentStep.targetId);
        if (el && (el === e.target || el.contains(e.target as Node))) {
          advanceStep();
        }
      };
      document.addEventListener("click", handler, true);
      return () => document.removeEventListener("click", handler, true);
    }
  }, [step, phase]);

  // Show spotlight with delay when entering a new spotlight step
  useEffect(() => {
    if (phase !== "walkthrough") return;
    const currentStep = STEPS[step];
    if (currentStep?.type !== "spotlight") return;

    setSpotlightVisible(false);
    const timer = setTimeout(() => setSpotlightVisible(true), 300);
    return () => clearTimeout(timer);
  }, [step, phase]);

  const advanceStep = useCallback(() => {
    setSpotlightVisible(false);
    clearTimeout(transitionTimer.current);

    const nextStep = step + 1;
    if (nextStep >= STEPS.length) {
      // Tutorial complete
      if (tutorialKey) localStorage.setItem(tutorialKey, "1");
      setPhase("done");
      return;
    }
    // 300ms pause between steps
    transitionTimer.current = setTimeout(() => setStep(nextStep), 300);
  }, [step, tutorialKey]);

  const handleClose = useCallback(() => {
    if (tutorialKey) localStorage.setItem(tutorialKey, "1");
    setPhase("done");
  }, [tutorialKey]);

  const handleIntroStart = useCallback(() => {
    setPhase("walkthrough");
    setStep(0);
  }, []);

  // Render nothing
  if (phase === "idle" || phase === "done") return null;

  // Intro bubble
  if (phase === "intro") {
    return (
      <AnimatePresence>
        <motion.div
          key="intro-bubble"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            position: "fixed",
            bottom: 100,
            right: 20,
            zIndex: 9999,
            maxWidth: 300,
            width: "calc(100% - 40px)",
          }}
        >
          <div
            style={{
              background: "#1C1C1E",
              borderRadius: 20,
              padding: 20,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <SpyIcon size={32} glow />
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
                  {t("tutorial.intro_title", "Hey! Willkommen bei Spy Secret.")}
                </p>
                <p style={{ fontSize: 14, color: "#8E8E93", marginTop: 6, lineHeight: 1.5 }}>
                  {t("tutorial.intro_text", "Lass uns dein erstes Profil scannen!")}
                </p>
              </div>
            </div>
            <button
              onClick={handleIntroStart}
              style={{
                width: "100%",
                marginTop: 16,
                padding: "13px 0",
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
              {t("tutorial.intro_cta", "Los geht's →")}
            </button>
            <button
              onClick={handleClose}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "8px 0",
                background: "transparent",
                border: "none",
                color: "#8E8E93",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {t("tutorial.skip", "Überspringen")}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Walkthrough phase
  const currentStep = STEPS[step];
  if (!currentStep) return null;
  if (currentStep.type === "action") return null;

  const targetExists = !!document.getElementById(currentStep.targetId);
  if (!targetExists) return null;

  return (
    <SpotlightOverlay
      targetId={currentStep.targetId}
      tooltipTitle={t(currentStep.titleKey)}
      tooltipText={t(currentStep.textKey)}
      buttonText={currentStep.hideButton ? "" : t("onboarding.next", "Weiter")}
      onNext={advanceStep}
      position={currentStep.position}
      agentComment={t(currentStep.commentKey)}
      visible={spotlightVisible}
      hideButton={currentStep.hideButton}
    />
  );
}
