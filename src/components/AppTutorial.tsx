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
      navigateTo?: string;
    }
  | { type: "action"; action: "wait_for_add_profile" | "wait_for_scan_complete"; waitingKey: string }
  | { type: "completion" };

const STEPS: StepDef[] = [
  // Step 0: Spotlight on "+" button — user must tap it
  { type: "spotlight", targetId: "add-profile-btn", titleKey: "tutorial.step2_title", textKey: "tutorial.step2_text", commentKey: "tutorial.comment_add", position: "top", hideButton: true },
  // Step 1: Wait for navigation to /add-profile or /analyzing
  { type: "action", action: "wait_for_add_profile", waitingKey: "tutorial.waiting_add" },
  // Step 2: Wait for scan complete → /profile/*
  { type: "action", action: "wait_for_scan_complete", waitingKey: "tutorial.waiting_scan" },
  // Step 3: Gender bar (on profile page)
  { type: "spotlight", targetId: "gender-bar", titleKey: "tutorial.step5_title", textKey: "tutorial.step5_text", commentKey: "tutorial.comment_gender", position: "bottom" },
  // Step 4: Tabs (on profile page)
  { type: "spotlight", targetId: "tabs-section", titleKey: "tutorial.step6_title", textKey: "tutorial.step6_text", commentKey: "tutorial.comment_tabs", position: "top" },
  // Step 5: Locked analysis (on profile page)
  { type: "spotlight", targetId: "locked-analysis", titleKey: "tutorial.step7_title", textKey: "tutorial.step7_text", commentKey: "tutorial.comment_pro", position: "top" },
  // Step 6: Spy agent zone (back on dashboard)
  { type: "spotlight", targetId: "spy-agent-zone", titleKey: "tutorial.step8_title", textKey: "tutorial.step8_text", commentKey: "tutorial.comment_spy", position: "bottom", navigateTo: "/dashboard" },
  // Step 7: Completion
  { type: "completion" },
];

const TOTAL_STEPS = STEPS.length;

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all"
          style={{
            width: i === current ? 16 : 6,
            height: 6,
            background: i === current ? "hsl(347 100% 59%)" : "hsl(0 0% 30%)",
          }}
        />
      ))}
    </div>
  );
}

function WaitingBubble({ text, stepIndex }: { text: string; stepIndex: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.4 }}
      style={{
        position: "fixed",
        bottom: 120,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        pointerEvents: "none",
        width: "calc(100% - 48px)",
        maxWidth: 320,
      }}
    >
      <div
        style={{
          background: "#1C1C1E",
          borderRadius: 20,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
        }}
      >
        <SpyIcon size={24} glow />
        <div className="flex-1">
          <StepIndicator current={stepIndex} total={TOTAL_STEPS - 1} />
          <span style={{ fontSize: 13, color: "#EBEBF5", fontWeight: 500 }}>{text}</span>
        </div>
      </div>
    </motion.div>
  );
}

function CompletionBubble({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        position: "fixed",
        bottom: 120,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        maxWidth: 320,
        width: "calc(100% - 48px)",
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
              {t("tutorial.done_title", "Tutorial abgeschlossen! 🎉")}
            </p>
            <p style={{ fontSize: 14, color: "#8E8E93", marginTop: 6, lineHeight: 1.5 }}>
              {t("tutorial.comment_done", "Viel Spaß, Agent! 🚀")}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
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
          {t("tutorial.done_cta", "Alles klar! 🕵️")}
        </button>
      </div>
    </motion.div>
  );
}

export function AppTutorial() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<"idle" | "intro" | "walkthrough" | "done">("idle");
  const [step, setStep] = useState(0);
  const [spotlightVisible, setSpotlightVisible] = useState(false);
  const [targetReady, setTargetReady] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout>>();

  const tutorialKey = user ? `tutorial_shown_${user.id}` : null;
  const forceShow = (location.state as { showWelcome?: boolean } | null)?.showWelcome === true;

  // ONLY trigger on fresh registration via showWelcome flag
  useEffect(() => {
    if (!tutorialKey) return;
    if (localStorage.getItem(tutorialKey)) return;
    
    const hasFlag = forceShow || (user && sessionStorage.getItem(`show_welcome_${user.id}`));
    if (!hasFlag) return;
    
    const timer = setTimeout(() => setPhase("intro"), 2000);
    return () => clearTimeout(timer);
  }, [tutorialKey, forceShow, user]);

  // Navigate to required page for spotlight steps
  useEffect(() => {
    if (phase !== "walkthrough") return;
    const currentStep = STEPS[step];
    if (currentStep?.type === "spotlight" && currentStep.navigateTo) {
      if (!location.pathname.startsWith(currentStep.navigateTo)) {
        navigate(currentStep.navigateTo);
      }
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

  // Poll for target element existence (up to 10s)
  useEffect(() => {
    if (phase !== "walkthrough") return;
    const currentStep = STEPS[step];
    if (currentStep?.type !== "spotlight") {
      setTargetReady(false);
      return;
    }

    const el = document.getElementById(currentStep.targetId);
    if (el) {
      setTargetReady(true);
      return;
    }

    // Poll every 500ms for up to 10s
    setTargetReady(false);
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const found = document.getElementById(currentStep.targetId);
      if (found) {
        setTargetReady(true);
        clearInterval(interval);
      } else if (attempts >= 20) {
        // Skip this step after 10s
        clearInterval(interval);
        advanceStep();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [step, phase]);

  // Show spotlight with delay when target is ready
  useEffect(() => {
    if (phase !== "walkthrough") return;
    const currentStep = STEPS[step];
    if (currentStep?.type !== "spotlight" || !targetReady) {
      setSpotlightVisible(false);
      return;
    }

    setSpotlightVisible(false);
    const timer = setTimeout(() => setSpotlightVisible(true), 300);
    return () => clearTimeout(timer);
  }, [step, phase, targetReady]);

  const advanceStep = useCallback(() => {
    setSpotlightVisible(false);
    setTargetReady(false);
    clearTimeout(transitionTimer.current);

    const nextStep = step + 1;
    if (nextStep >= STEPS.length) {
      if (tutorialKey) localStorage.setItem(tutorialKey, "1");
      setPhase("done");
      return;
    }
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

  // Intro bubble — centered
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
            bottom: 120,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            maxWidth: 320,
            width: "calc(100% - 48px)",
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

  // Completion step
  if (currentStep.type === "completion") {
    return (
      <AnimatePresence>
        <CompletionBubble onClose={handleClose} />
      </AnimatePresence>
    );
  }

  // Action steps: show waiting bubble
  if (currentStep.type === "action") {
    return (
      <AnimatePresence>
        <WaitingBubble text={t(currentStep.waitingKey)} stepIndex={step} />
      </AnimatePresence>
    );
  }

  // Spotlight steps: wait for element to be ready
  if (!targetReady) return null;

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
      stepIndex={step}
      totalSteps={TOTAL_STEPS - 1}
    />
  );
}
