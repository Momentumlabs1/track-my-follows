import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SpyIcon } from "@/components/SpyIcon";
import { InstagramAvatar } from "@/components/InstagramAvatar";

const STEP_KEYS = [
  { title: "step_1", desc: "step_1_desc" },
  { title: "step_2", desc: "step_2_desc" },
  { title: "step_3", desc: "step_3_desc" },
  { title: "step_baseline", desc: "step_baseline_desc" },
  { title: "step_4", desc: "step_4_desc" },
  { title: "step_5", desc: "step_5_desc" },
];

const AnalyzingProfile = () => {
  const { t } = useTranslation();
  const { profileId, username } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const scanStarted = useRef(false);

  useEffect(() => {
    const t1 = setTimeout(() => { setCurrentStep(1); setProgress(15); }, 1200);
    const t2 = setTimeout(() => { setCurrentStep(2); setProgress(30); }, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (currentStep < 2 || scanStarted.current) return;
    scanStarted.current = true;

    const runScan = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await supabase.functions.invoke("trigger-scan", {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
          body: { profileId },
        });
        if (res.error) throw res.error;

        setCurrentStep(3); setProgress(60);
        setCurrentStep(4); setProgress(85);
        await new Promise(r => setTimeout(r, 400));
        setCurrentStep(5); setProgress(100);

        queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
        queryClient.invalidateQueries({ queryKey: ["follow_events"] });

        await new Promise(r => setTimeout(r, 600));
        navigate(`/profile/${profileId}`, { replace: true });

        // Fire-and-forget: baseline scan runs in background
        supabase.functions.invoke("create-baseline", {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
          body: { profileId },
        }).then(({ error }) => {
          if (error) console.error("[Baseline] Background error:", error);
          else {
            console.log("[Baseline] Completed in background");
            queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
          }
        });
      } catch (err) {
        toast.error(t("profile_detail.scan_failed", { error: err instanceof Error ? err.message : String(err) }));
        navigate("/dashboard", { replace: true });
      }
    };

    runScan();
  }, [currentStep, profileId, navigate, queryClient, t]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-12 px-5 pb-8">
      {/* Avatar with gradient ring */}
      <div className="mb-4">
        <div className="h-24 w-24 rounded-full p-[3px] bg-gradient-to-br from-primary to-accent">
          <InstagramAvatar src={null} alt={username || ""} fallbackInitials={username || "?"} size={90} className="border-2 border-background" />
        </div>
      </div>

      {/* Username */}
      <h1 className="text-lg font-bold text-foreground">
        <span className="text-primary">@</span>{username}
      </h1>
      <p className="text-[12px] text-muted-foreground mt-0.5 font-medium">{t("analyzing.title")}</p>

      {/* Progress bar */}
      <div className="w-full max-w-xs mt-6 mb-6">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-pink rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-1.5 font-semibold tabular-nums">
          {progress}%
        </p>
      </div>

      {/* Steps */}
      <div className="w-full max-w-sm space-y-2.5">
        {STEP_KEYS.map((step, i) => {
          const isDone = i < currentStep;
          const isCurrent = i === currentStep;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: i <= currentStep ? 1 : 0.35, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className={`native-card relative px-4 py-3 flex items-start gap-3 transition-colors ${
                isCurrent
                  ? "border-primary/40 ring-1 ring-primary/20"
                  : isDone
                  ? "border-green-500/30"
                  : ""
              }`}
            >
              {/* SpyIcon jumps to current step */}
              <div className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center relative">
                {isDone ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-7 w-7 rounded-full bg-green-500 flex items-center justify-center"
                  >
                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                  </motion.div>
                ) : isCurrent ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`spy-${i}`}
                      layoutId="spy-indicator"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <SpyIcon size={28} glow />
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground font-bold">{i + 1}</span>
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[13px] font-semibold ${
                    isDone ? "text-green-500" : isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {t(`analyzing.${step.title}`)}
                  </span>
                  {isCurrent && (
                    <Loader2 className="h-3 w-3 text-primary animate-spin" />
                  )}
                </div>
                <p className={`text-[11px] mt-0.5 ${
                  isCurrent ? "text-muted-foreground" : "text-muted-foreground/60"
                }`}>
                  {t(`analyzing.${step.desc}`)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full analysis note */}
      <div className="mt-6 flex items-start gap-2 max-w-sm px-2">
        <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t("analyzing.full_analysis_note")}
        </p>
      </div>
    </div>
  );
};

export default AnalyzingProfile;
