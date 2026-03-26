import { useState, useEffect, useCallback, useMemo, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { SpyIcon } from "@/components/SpyIcon";
import { SpotlightOverlay } from "@/components/SpotlightOverlay";

type StepDef =
  | { type: "info"; titleKey: string; textKey: string }
  | { type: "spotlight"; targetId: string; titleKey: string; textKey: string; commentKey: string; position: "top" | "bottom" }
  | { type: "completion" };

const PRO_STEPS: StepDef[] = [
  { type: "info", titleKey: "pro_tutorial.welcome_title", textKey: "pro_tutorial.welcome_text" },
  { type: "spotlight", targetId: "spy-agent-zone", titleKey: "pro_tutorial.spy_zone_title", textKey: "pro_tutorial.spy_zone_text", commentKey: "pro_tutorial.spy_zone_comment", position: "bottom" },
  { type: "completion" },
];

const VISUAL_STEPS = PRO_STEPS.filter(s => s.type !== "completion").length;

const SIDE_PADDING = 24;

const centeredModalContainerStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: `${SIDE_PADDING}px`,
  pointerEvents: "none",
};

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
            background: i === current ? "#FF2D55" : "rgba(255,255,255,0.2)",
          }}
        />
      ))}
    </div>
  );
}

export function ProTutorial() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [phase, setPhase] = useState<"idle" | "intro" | "walkthrough" | "done">("idle");
  const [step, setStep] = useState(0);

  const shouldShow = useMemo(() => {
    if (!user) return false;
    if (localStorage.getItem(`pro_tutorial_done_${user.id}`)) return false;
    if (!sessionStorage.getItem("show_pro_tutorial")) return false;
    return true;
  }, [user]);

  useEffect(() => {
    if (!shouldShow) return;
    if (phase !== "idle") return;
    // Small delay to let dashboard render
    const timer = setTimeout(() => setPhase("intro"), 600);
    return () => clearTimeout(timer);
  }, [shouldShow, phase]);

  const handleClose = useCallback(() => {
    if (user) localStorage.setItem(`pro_tutorial_done_${user.id}`, "1");
    sessionStorage.removeItem("show_pro_tutorial");
    setPhase("done");
  }, [user]);

  const advance = useCallback(() => {
    const next = step + 1;
    if (next >= PRO_STEPS.length) {
      handleClose();
      return;
    }
    setStep(next);
    if (PRO_STEPS[next].type === "spotlight") {
      setPhase("walkthrough");
    }
  }, [step, handleClose]);

  if (phase === "idle" || phase === "done") return null;

  const currentStep = PRO_STEPS[step];

  return (
    <>
      {/* Overlay background for info/completion steps */}
      {(currentStep.type === "info" || currentStep.type === "completion") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.7)" }}
        />
      )}

      <AnimatePresence mode="wait">
        {/* Info bubble */}
        {currentStep.type === "info" && (
          <motion.div
            key={`info-${step}`}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={centeredModalContainerStyle}
          >
            <div
              style={{
                width: `min(340px, calc(100vw - ${SIDE_PADDING * 2}px))`,
                pointerEvents: "auto",
                background: "#1C1C1E",
                borderRadius: 24,
                padding: 24,
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
              }}
            >
              <StepIndicator current={step} total={VISUAL_STEPS} />
              <div className="flex items-center gap-3 mb-3">
                <SpyIcon size={32} glow />
                <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                  {t(currentStep.titleKey)}
                </p>
              </div>
              <p style={{ fontSize: 14, color: "#8E8E93", lineHeight: 1.5 }}>
                {t(currentStep.textKey)}
              </p>
              <button
                onClick={advance}
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
        )}

        {/* Spotlight step */}
        {currentStep.type === "spotlight" && (
          <SpotlightOverlay
            key={`spotlight-${step}`}
            targetId={currentStep.targetId}
            tooltipTitle={t(currentStep.titleKey)}
            tooltipText={t(currentStep.textKey)}
            buttonText={t("onboarding.next", "Weiter")}
            onNext={advance}
            position={currentStep.position}
            agentComment={t(currentStep.commentKey)}
            visible
            stepIndex={step}
            totalSteps={VISUAL_STEPS}
          />
        )}

        {/* Completion */}
        {currentStep.type === "completion" && (
          <motion.div
            key="completion"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={centeredModalContainerStyle}
          >
            <div
              style={{
                width: `min(340px, calc(100vw - ${SIDE_PADDING * 2}px))`,
                pointerEvents: "auto",
                background: "#1C1C1E",
                borderRadius: 24,
                padding: 24,
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <SpyIcon size={32} glow />
                <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                  {t("pro_tutorial.done_title")}
                </p>
              </div>
              <p style={{ fontSize: 14, color: "#8E8E93", lineHeight: 1.5 }}>
                {t("pro_tutorial.done_text")}
              </p>
              <button
                onClick={handleClose}
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
        )}
      </AnimatePresence>
    </>
  );
}
