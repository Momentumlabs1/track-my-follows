import { useState, useEffect, useCallback, useRef, useMemo, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useTrackedProfiles } from "@/hooks/useTrackedProfiles";
import { SpyIcon } from "@/components/SpyIcon";
import { SpotlightOverlay } from "@/components/SpotlightOverlay";
import { Shield, Eye, Users, TrendingUp, Check, X } from "lucide-react";

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
  | { type: "info"; titleKey: string; textKey: string }
  | { type: "pro_upsell" }
  | { type: "completion" };

const STEPS: StepDef[] = [
  // 0: Spotlight on "+" button — user must tap it
  { type: "spotlight", targetId: "add-profile-btn", titleKey: "tutorial.step2_title", textKey: "tutorial.step2_text", commentKey: "tutorial.comment_add", position: "top", hideButton: true },
  // 1: Wait for navigation to /add-profile or /analyzing
  { type: "action", action: "wait_for_add_profile", waitingKey: "tutorial.waiting_add" },
  // 2: Wait for scan complete → /profile/*
  { type: "action", action: "wait_for_scan_complete", waitingKey: "tutorial.waiting_scan" },
  // 3: Profile intro bubble
  { type: "info", titleKey: "tutorial.profile_intro_title", textKey: "tutorial.profile_intro_text" },
  // 4: Gender bar
  { type: "spotlight", targetId: "gender-bar", titleKey: "tutorial.step5_title", textKey: "tutorial.step5_text", commentKey: "tutorial.comment_gender", position: "bottom" },
  // 5: Tabs
  { type: "spotlight", targetId: "tabs-section", titleKey: "tutorial.step6_title", textKey: "tutorial.step6_text", commentKey: "tutorial.comment_tabs", position: "top" },
  // 6: Locked analysis
  { type: "spotlight", targetId: "locked-analysis", titleKey: "tutorial.step7_title", textKey: "tutorial.step7_text", commentKey: "tutorial.comment_pro", position: "top" },
  // 7: Pro upsell
  { type: "pro_upsell" },
  // 8: Completion (on dashboard)
  { type: "completion" },
];

// Count visual steps (exclude action steps and completion)
const VISUAL_STEPS = STEPS.filter(s => s.type !== "action" && s.type !== "completion").length;

const TUTORIAL_SIDE_PADDING = 24;
const TUTORIAL_BOTTOM_OFFSET = "max(120px, calc(env(safe-area-inset-bottom) + 88px))";

const centeredBottomBubbleStyle = (maxWidth: number): CSSProperties => ({
  position: "fixed",
  bottom: TUTORIAL_BOTTOM_OFFSET,
  left: TUTORIAL_SIDE_PADDING,
  right: TUTORIAL_SIDE_PADDING,
  marginLeft: "auto",
  marginRight: "auto",
  zIndex: 9999,
  pointerEvents: "auto",
  width: `min(${maxWidth}px, calc(100vw - ${TUTORIAL_SIDE_PADDING * 2}px))`,
});

const centeredModalContainerStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: `${TUTORIAL_SIDE_PADDING}px`,
  pointerEvents: "none",
};

const centeredModalCardStyle = (maxWidth: number): CSSProperties => ({
  width: `min(${maxWidth}px, calc(100vw - ${TUTORIAL_SIDE_PADDING * 2}px))`,
  pointerEvents: "auto",
});

function getVisualIndex(stepIndex: number): number {
  let visual = 0;
  for (let i = 0; i < stepIndex; i++) {
    const s = STEPS[i];
    if (s.type !== "action" && s.type !== "completion") visual++;
  }
  return visual;
}

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
      style={centeredBottomBubbleStyle(320)}
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
          <StepIndicator current={getVisualIndex(stepIndex)} total={VISUAL_STEPS} />
          <span style={{ fontSize: 13, color: "#EBEBF5", fontWeight: 500 }}>{text}</span>
        </div>
      </div>
    </motion.div>
  );
}

function InfoBubble({ title, text, onNext, stepIndex }: { title: string; text: string; onNext: () => void; stepIndex: number }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={centeredModalContainerStyle}
    >
      <div
        style={{
          ...centeredModalCardStyle(340),
          background: "#1C1C1E",
          borderRadius: 24,
          padding: 24,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
        }}
      >
        <StepIndicator current={getVisualIndex(stepIndex)} total={VISUAL_STEPS} />
        <div className="flex items-center gap-3 mb-3">
          <SpyIcon size={32} glow />
          <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{title}</p>
        </div>
        <p style={{ fontSize: 14, color: "#8E8E93", lineHeight: 1.5 }}>{text}</p>
        <button
          onClick={onNext}
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
          {t("onboarding.next", "Weiter")}
        </button>
      </div>
    </motion.div>
  );
}

function ComparisonRow({ label, free, pro }: { label: string; free: boolean; pro: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span style={{ fontSize: 13, color: "#EBEBF5", flex: 1 }}>{label}</span>
      <div className="flex items-center gap-6" style={{ width: 80, justifyContent: "space-around" }}>
        {free ? (
          <Check size={15} color="#8E8E93" />
        ) : (
          <X size={15} color="rgba(255,255,255,0.15)" />
        )}
        {pro ? (
          <Check size={15} color="#FF2D55" />
        ) : (
          <X size={15} color="rgba(255,255,255,0.15)" />
        )}
      </div>
    </div>
  );
}

function ProUpsellBubble({ onUnlock, onLater, stepIndex }: { onUnlock: () => void; onLater: () => void; stepIndex: number }) {
  const { t } = useTranslation();

  const rows = [
    { label: t("tutorial.compare_profiles", "Profile tracken"), free: true, pro: true, freeDetail: "1", proDetail: "5" },
    { label: t("tutorial.compare_scans", "Scans pro Tag"), free: true, pro: true, freeDetail: "1", proDetail: "∞" },
    { label: t("tutorial.compare_new_follows", "Folgt neu"), free: true, pro: true },
    { label: t("tutorial.compare_new_followers", "Neue Follower"), free: true, pro: true },
    { label: t("tutorial.compare_unfollows", "Entfolgt-Tracking"), free: false, pro: true },
    { label: t("tutorial.compare_spy", "Spy-Agent"), free: false, pro: true },
    { label: t("tutorial.compare_suspicion", "Verdachts-Score"), free: false, pro: true },
    { label: t("tutorial.compare_gender", "Geschlechteranalyse"), free: false, pro: true },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.6)" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={centeredModalContainerStyle}
      >
        <div
          style={{
            ...centeredModalCardStyle(360),
            background: "#1C1C1E",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
          }}
        >
          <StepIndicator current={getVisualIndex(stepIndex)} total={VISUAL_STEPS} />
          <div className="flex items-center gap-3 mb-4">
            <SpyIcon size={40} glow />
            <div>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
                {t("tutorial.pro_upsell_title", "Werde Pro-Agent 🕵️")}
              </p>
              <p style={{ fontSize: 13, color: "#8E8E93", marginTop: 2 }}>
                {t("tutorial.pro_upsell_text", "Schalte alle Features frei")}
              </p>
            </div>
          </div>

          {/* Free vs Pro header */}
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", flex: 1 }}></span>
            <div className="flex items-center gap-6" style={{ width: 80, justifyContent: "space-around" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>FREE</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#FF2D55" }}>PRO</span>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8 }} className="mb-5">
            {rows.map((r, i) => (
              <ComparisonRow key={i} label={r.label} free={r.free} pro={r.pro} />
            ))}
          </div>

          <button
            onClick={onUnlock}
            style={{
              width: "100%",
              padding: "14px 0",
              background: "#FF2D55",
              borderRadius: 14,
              border: "none",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              minHeight: 50,
            }}
          >
            {t("tutorial.pro_cta", "Pro freischalten 🚀")}
          </button>
          <button
            onClick={onLater}
            style={{
              width: "100%",
              marginTop: 10,
              padding: "8px 0",
              background: "transparent",
              border: "none",
              color: "#8E8E93",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {t("tutorial.pro_later", "Später")}
          </button>
        </div>
      </motion.div>
    </>
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
      style={centeredBottomBubbleStyle(320)}
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
  const { showPaywall } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: profiles } = useTrackedProfiles();

  const [phase, setPhase] = useState<"idle" | "intro" | "walkthrough" | "done">("idle");
  const [step, setStep] = useState(0);
  const [spotlightVisible, setSpotlightVisible] = useState(false);
  const [targetReady, setTargetReady] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastProfileIdRef = useRef<string | null>(null);
  const advancingRef = useRef(false);

  const tutorialKey = user ? `tutorial_shown_${user.id}` : null;

  // FIX 1: Trigger based ONLY on user + no localStorage key + 0 profiles
  const shouldStartTutorial = useMemo(() => {
    if (!user) return false;
    if (!tutorialKey) return false;
    if (localStorage.getItem(tutorialKey)) return false;
    // Wait until profiles query has loaded
    if (profiles === undefined) return false;
    if (profiles && profiles.length > 0) return false;
    return true;
  }, [user, tutorialKey, profiles]);

  useEffect(() => {
    if (!shouldStartTutorial) return;
    if (phase !== "idle") return;
    setPhase("intro");
  }, [shouldStartTutorial, phase]);

  // Track latest profile ID from URL for navigation after scan
  useEffect(() => {
    const match = location.pathname.match(/\/(analyzing|profile)\/([a-f0-9-]+)/);
    if (match) lastProfileIdRef.current = match[2];
  }, [location.pathname]);

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
      // FIX 6: Actively navigate to profile when found on dashboard
      if (location.pathname === "/dashboard") {
        const checkProfiles = setInterval(() => {
          const profileLinks = document.querySelectorAll('[data-profile-id]');
          if (profileLinks.length > 0) {
            const firstId = profileLinks[0].getAttribute('data-profile-id');
            if (firstId) {
              clearInterval(checkProfiles);
              navigate(`/profile/${firstId}`);
              // advanceStep will be called when location changes to /profile/*
            }
          }
        }, 1000);
        return () => clearInterval(checkProfiles);
      }
    }
  }, [location.pathname, step, phase]);

  // FIX 2: For spotlight steps with hideButton, intercept click and skip Step 1
  useEffect(() => {
    if (phase !== "walkthrough") return;
    const currentStep = STEPS[step];
    if (currentStep?.type === "spotlight" && currentStep.hideButton) {
      const handler = (e: MouseEvent) => {
        const el = document.getElementById(currentStep.targetId);
        if (el && (el === e.target || el.contains(e.target as Node))) {
          // If this is Step 0 (add-profile-btn), skip Step 1 entirely → go to Step 2
          if (step === 0) {
            if (advancingRef.current) return;
            advancingRef.current = true;
            setSpotlightVisible(false);
            setTargetReady(false);
            clearTimeout(transitionTimer.current);
            transitionTimer.current = setTimeout(() => {
              setStep(2); // Skip step 1 (wait_for_add_profile), go to step 2 (wait_for_scan)
              advancingRef.current = false;
            }, 300);
          } else {
            advanceStep();
          }
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

    setTargetReady(false);
    let attempts = 0;
    const maxAttempts = 33;
    const interval = setInterval(() => {
      attempts++;
      const found = document.getElementById(currentStep.targetId);
      if (found) {
        setTargetReady(true);
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        advanceStep();
      }
    }, 300);

    return () => clearInterval(interval);
  }, [step, phase]);

  // FIX 4: Auto-scroll BEFORE spotlight (500ms delay for scroll to finish)
  useEffect(() => {
    if (phase !== "walkthrough") return;
    const currentStep = STEPS[step];
    if (currentStep?.type === "spotlight" && targetReady) {
      const el = document.getElementById(currentStep.targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [step, phase, targetReady]);

  // FIX 4 continued: Show spotlight with 500ms delay (after scroll completes)
  useEffect(() => {
    if (phase !== "walkthrough") return;
    const currentStep = STEPS[step];
    if (currentStep?.type !== "spotlight" || !targetReady) {
      setSpotlightVisible(false);
      return;
    }

    setSpotlightVisible(false);
    const timer = setTimeout(() => setSpotlightVisible(true), 500);
    return () => clearTimeout(timer);
  }, [step, phase, targetReady]);

  // FIX 5: advanceStep with 300ms pause between steps
  const advanceStep = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    // 1. Hide current overlay
    setSpotlightVisible(false);
    setTargetReady(false);
    clearTimeout(transitionTimer.current);

    const nextStep = step + 1;
    if (nextStep >= STEPS.length) {
      if (tutorialKey) localStorage.setItem(tutorialKey, "1");
      navigate("/dashboard", { replace: true });
      setPhase("done");
      advancingRef.current = false;
      return;
    }

    // 2. 300ms pause then show next step
    transitionTimer.current = setTimeout(() => {
      setStep(nextStep);
      advancingRef.current = false;
    }, 300);
  }, [step, tutorialKey, navigate]);

  // FIX 8: All exit paths → dashboard
  const handleClose = useCallback(() => {
    if (tutorialKey) localStorage.setItem(tutorialKey, "1");
    setPhase("done");
    navigate("/dashboard", { replace: true });
  }, [tutorialKey, navigate]);

  const handleIntroStart = useCallback(() => {
    setPhase("walkthrough");
    setStep(0);
  }, []);

  const handleProUnlock = useCallback(() => {
    if (tutorialKey) localStorage.setItem(tutorialKey, "1");
    setPhase("done");
    navigate("/dashboard", { replace: true });
    setTimeout(() => showPaywall("tutorial"), 500);
  }, [tutorialKey, navigate, showPaywall]);

  // Render nothing
  if (phase === "idle" || phase === "done") return null;

  // FIX 3: Intro bubble — centered BOTTOM, above BottomNav
  if (phase === "intro") {
    return (
      <AnimatePresence>
        <motion.div
          key="intro-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.6)" }}
        />
        <motion.div
          key="intro-bubble"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={centeredBottomBubbleStyle(360)}
        >
          <div
            style={{
              background: "#1C1C1E",
              borderRadius: 24,
              padding: 24,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex items-start gap-3 mb-4">
              <SpyIcon size={36} glow className="flex-shrink-0 mt-0.5" />
              <div>
                <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
                  {t("tutorial.intro_title", "Hey! Willkommen bei Spy Secret.")}
                </p>
                <p style={{ fontSize: 15, color: "#8E8E93", lineHeight: 1.5, marginTop: 4 }}>
                  {t("tutorial.intro_text", "Lass uns dein erstes Profil scannen!")}
                </p>
              </div>
            </div>
            <button
              onClick={handleIntroStart}
              style={{
                width: "100%",
                padding: "13px 0",
                background: "#FF2D55",
                borderRadius: 12,
                border: "none",
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
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
                color: "rgba(255,255,255,0.3)",
                fontSize: 14,
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

  // Info bubble (profile intro)
  if (currentStep.type === "info") {
    return (
      <AnimatePresence>
        <motion.div
          key="info-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.6)" }}
        />
        <InfoBubble
          title={t(currentStep.titleKey)}
          text={t(currentStep.textKey)}
          onNext={advanceStep}
          stepIndex={step}
        />
      </AnimatePresence>
    );
  }

  // Pro upsell
  if (currentStep.type === "pro_upsell") {
    return (
      <AnimatePresence>
        <ProUpsellBubble onUnlock={handleProUnlock} onLater={handleClose} stepIndex={step} />
      </AnimatePresence>
    );
  }

  // FIX 2: Action steps — Step 1 shows NOTHING (no popup flash)
  if (currentStep.type === "action") {
    // Step 1 (wait_for_add_profile) is silent — no UI, just route detection
    if (currentStep.action === "wait_for_add_profile") {
      return null;
    }
    // Step 2 (wait_for_scan) shows waiting bubble
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
      stepIndex={getVisualIndex(step)}
      totalSteps={VISUAL_STEPS}
    />
  );
}
