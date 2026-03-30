import { useState, useEffect, useCallback, useMemo, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SpyIcon } from "@/components/SpyIcon";
import { SpotlightOverlay } from "@/components/SpotlightOverlay";
import { ProScanOverlay, type ProScanResult } from "@/components/ProScanOverlay";
import { supabase } from "@/integrations/supabase/client";

// ─── Step definitions ───

type StepDef =
  | { type: "info"; titleKey: string; textKey: string }
  | { type: "navigate"; route: string; waitForId?: string }
  | { type: "spotlight"; targetId: string; titleKey: string; textKey: string; commentKey: string; position: "top" | "bottom" }
  | { type: "scan" }
  | { type: "completion" };

const STEPS: StepDef[] = [
  // 0: Welcome
  { type: "info", titleKey: "pro_tutorial.welcome_title", textKey: "pro_tutorial.welcome_text" },
  // 1: Navigate to /spy
  { type: "navigate", route: "/spy", waitForId: "spy-name-field" },
  // 2: Spotlight on spy name
  { type: "spotlight", targetId: "spy-name-field", titleKey: "pro_tutorial.spy_name_title", textKey: "pro_tutorial.spy_name_text", commentKey: "pro_tutorial.spy_name_comment", position: "bottom" },
  // 3: Spotlight on current mission
  { type: "spotlight", targetId: "spy-current-mission", titleKey: "pro_tutorial.current_mission_title", textKey: "pro_tutorial.current_mission_text", commentKey: "pro_tutorial.current_mission_comment", position: "bottom" },
  // 4: Navigate to profile (set dynamically)
  { type: "navigate", route: "/profile/__PROFILE_ID__" },
  // 5: Pro Scan
  { type: "scan" },
  // 6: Completion
  { type: "completion" },
];

const VISUAL_STEPS = STEPS.filter(s => s.type !== "navigate" && s.type !== "scan").length;

const SIDE_PADDING = 24;

const centeredModalStyle: CSSProperties = {
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
            background: i === current ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.2)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Session storage helpers ───

const SESSION_KEY = "pro_tutorial_state";

function getStoredStep(): number {
  try {
    const val = sessionStorage.getItem(SESSION_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch { return 0; }
}

function storeStep(step: number) {
  try { sessionStorage.setItem(SESSION_KEY, String(step)); } catch {}
}

function clearTutorialSession() {
  try { sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem("show_pro_tutorial"); } catch {}
}

// ─── Main component ───

export function ProTutorial() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileUsername, setProfileUsername] = useState<string>("");
  const [scanOverlayOpen, setScanOverlayOpen] = useState(false);
  const [scanResult, setScanResult] = useState<ProScanResult | null>(null);

  // Determine visual step index (for indicator dots)
  const visualStep = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < step; i++) {
      const s = STEPS[i];
      if (s.type !== "navigate" && s.type !== "scan") idx++;
    }
    return idx;
  }, [step]);

  const { nativePurchaseSuccess, clearNativePurchaseSuccess } = useSubscription();

  // Check if tutorial should show
  const shouldShow = useMemo(() => {
    if (!user) return false;
    if (localStorage.getItem(`pro_tutorial_done_${user.id}`)) return false;
    const hasSessionFlag = sessionStorage.getItem("show_pro_tutorial") === "1";
    if (hasSessionFlag || nativePurchaseSuccess) return true;
    return false;
  }, [user, nativePurchaseSuccess]);

  // Initialize
  useEffect(() => {
    if (!shouldShow) return;
    const storedStep = getStoredStep();
    setStep(storedStep);
    setActive(true);
    // Clear nativePurchaseSuccess so it doesn't re-trigger
    if (nativePurchaseSuccess) clearNativePurchaseSuccess();
    // Ensure sessionStorage flag is set
    try { sessionStorage.setItem("show_pro_tutorial", "1"); } catch {}
    console.log("[ProTutorial] Tutorial activated, step:", storedStep);

    // Load first tracked profile for scanning
    const loadProfile = async () => {
      const { data } = await supabase
        .from("tracked_profiles")
        .select("id, username")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1);
      if (data && data.length > 0) {
        setProfileId(data[0].id);
        setProfileUsername(data[0].username);
      }
    };
    loadProfile();
  }, [shouldShow, user]);

  const handleClose = useCallback(() => {
    if (user) localStorage.setItem(`pro_tutorial_done_${user.id}`, "1");
    clearTutorialSession();
    setActive(false);
  }, [user]);

  const advance = useCallback(() => {
    const next = step + 1;
    if (next >= STEPS.length) {
      handleClose();
      navigate("/dashboard", { replace: true });
      return;
    }

    setStep(next);
    storeStep(next);

    const nextStep = STEPS[next];
    if (nextStep.type === "navigate") {
      const route = nextStep.route.replace("__PROFILE_ID__", profileId || "");
      navigate(route);
      // Auto-advance past navigate step after a brief delay
      setTimeout(() => {
        const afterNav = next + 1;
        if (afterNav < STEPS.length) {
          setStep(afterNav);
          storeStep(afterNav);
          // If the step after navigation is a scan, open it
          if (STEPS[afterNav].type === "scan") {
            setScanOverlayOpen(true);
          }
        }
      }, 800);
    } else if (nextStep.type === "scan") {
      setScanOverlayOpen(true);
    }
  }, [step, handleClose, navigate, profileId]);

  const handleScanComplete = useCallback((result: ProScanResult) => {
    setScanResult(result);
    setScanOverlayOpen(false);
    // Move to next step (completion)
    const next = step + 1;
    setStep(next);
    storeStep(next);
  }, [step]);

  // Auto-advance on navigate steps when arriving at correct page
  useEffect(() => {
    if (!active || step >= STEPS.length) return;
    const currentStep = STEPS[step];
    if (currentStep.type !== "navigate") return;

    const targetRoute = currentStep.route.replace("__PROFILE_ID__", profileId || "");
    if (location.pathname === targetRoute || location.pathname.startsWith(targetRoute.split("__")[0])) {
      // Already on correct page, advance
      setTimeout(() => {
        const next = step + 1;
        if (next < STEPS.length) {
          setStep(next);
          storeStep(next);
          if (STEPS[next].type === "scan") setScanOverlayOpen(true);
        }
      }, 600);
    }
  }, [active, step, location.pathname, profileId]);

  if (!active) return null;
  if (step >= STEPS.length) return null;

  const currentStep = STEPS[step];

  // Don't render UI during navigate steps
  if (currentStep.type === "navigate") return null;

  // Scan overlay
  if (currentStep.type === "scan" || scanOverlayOpen) {
    return (
      <ProScanOverlay
        open={scanOverlayOpen}
        profileId={profileId || ""}
        username={profileUsername}
        onComplete={handleScanComplete}
      />
    );
  }

  return (
    <>
      {/* Overlay bg for info/completion */}
      {(currentStep.type === "info" || currentStep.type === "completion") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.7)" }}
        />
      )}

      <AnimatePresence mode="wait">
        {/* Info step */}
        {currentStep.type === "info" && (
          <motion.div
            key={`info-${step}`}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={centeredModalStyle}
          >
            <div style={{
              width: `min(340px, calc(100vw - ${SIDE_PADDING * 2}px))`,
              pointerEvents: "auto",
              background: "hsl(var(--card))",
              borderRadius: 24,
              padding: 24,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
            }}>
              <StepIndicator current={visualStep} total={VISUAL_STEPS} />
              <div className="flex items-center gap-3 mb-3">
                <SpyIcon size={32} glow />
                <p className="text-lg font-bold text-foreground leading-tight">
                  {t(currentStep.titleKey)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(currentStep.textKey)}
              </p>
              <button
                onClick={advance}
                className="w-full mt-4 py-3.5 rounded-xl font-bold text-[15px] text-primary-foreground"
                style={{ background: "hsl(var(--primary))", minHeight: 48 }}
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
            stepIndex={visualStep}
            totalSteps={VISUAL_STEPS}
          />
        )}

        {/* Completion step */}
        {currentStep.type === "completion" && (
          <motion.div
            key="completion"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={centeredModalStyle}
          >
            <div style={{
              width: `min(340px, calc(100vw - ${SIDE_PADDING * 2}px))`,
              pointerEvents: "auto",
              background: "hsl(var(--card))",
              borderRadius: 24,
              padding: 24,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
            }}>
              <div className="flex items-center gap-3 mb-3">
                <SpyIcon size={32} glow />
                <p className="text-lg font-bold text-foreground leading-tight">
                  {t("pro_tutorial.done_title")}
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("pro_tutorial.done_text")}
              </p>

              {/* Show scan result summary if available */}
              {scanResult && scanResult.followingsLoaded > 0 && (
                <div className="mt-3 rounded-xl p-3 space-y-1" style={{ background: "hsl(var(--secondary) / 0.3)" }}>
                  <p className="text-xs font-semibold text-foreground">
                    ✅ {t("pro_tutorial.done_scan_summary", { count: scanResult.followingsLoaded })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("pro_tutorial.done_gender_summary", {
                      female: scanResult.genderFemale,
                      male: scanResult.genderMale,
                    })}
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">✅</span>
                  <span className="text-xs text-muted-foreground">{t("pro_tutorial.done_feature_1")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">✅</span>
                  <span className="text-xs text-muted-foreground">{t("pro_tutorial.done_feature_2")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">✅</span>
                  <span className="text-xs text-muted-foreground">{t("pro_tutorial.done_feature_3")}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  handleClose();
                  navigate("/dashboard", { replace: true });
                }}
                className="w-full mt-4 py-3.5 rounded-xl font-bold text-[15px] text-primary-foreground"
                style={{ background: "hsl(var(--primary))", minHeight: 48 }}
              >
                {t("pro_tutorial.done_cta", "Los geht's! 🕵️")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}