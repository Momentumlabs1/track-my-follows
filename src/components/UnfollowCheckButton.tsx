import { useState, useEffect, useRef } from "react";
import { Search, Lock, Shield, UserMinus, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SpyIcon } from "@/components/SpyIcon";

interface UnfollowCheckButtonProps {
  profileId: string;
}

type ScanPhase = "idle" | "scanning_following" | "evaluating" | "done";

const PHASE_TIMINGS: Record<string, number> = {
  scanning_following: 0,
  evaluating: 15000,
};

const TIMEOUT_MS = 180_000;

export function UnfollowCheckButton({ profileId }: UnfollowCheckButtonProps) {
  const { t } = useTranslation();
  const { plan, showPaywall } = useSubscription();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [checksRemaining, setChecksRemaining] = useState<number | null>(null);
  const [result, setResult] = useState<{
    unfollows_found: number;
    new_follows_found: number;
  } | null>(null);
  const phaseTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (plan !== "pro") return;
    const loadChecks = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("unfollow_checks")
        .select("*", { count: "exact", head: true })
        .eq("tracked_profile_id", profileId)
        .gte("created_at", `${today}T00:00:00Z`);
      setChecksRemaining(2 - (count || 0));
    };
    loadChecks();
  }, [profileId, plan]);

  useEffect(() => {
    return () => {
      phaseTimers.current.forEach(clearTimeout);
      if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    };
  }, []);

  const handleCheck = async () => {
    if (plan !== "pro") { showPaywall("unfollows"); return; }
    if (checksRemaining !== null && checksRemaining <= 0) { toast.error(t("unfollow_check.limit_reached")); return; }

    setLoading(true);
    setResult(null);
    setPhase("scanning_following");

    phaseTimers.current = [
      setTimeout(() => setPhase("evaluating"), PHASE_TIMINGS.evaluating),
    ];

    timeoutTimer.current = setTimeout(() => {
      setLoading(false);
      setPhase("idle");
      toast.error(t("unfollow_check.timeout", "Scan took too long. Please try again."));
    }, TIMEOUT_MS);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("unfollow-check", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: { profileId },
      });
      if (res.error) throw res.error;
      const data = res.data as {
        error?: string;
        unfollows_found?: number;
        new_follows_found?: number;
        checks_remaining?: number;
      };

      if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
      phaseTimers.current.forEach(clearTimeout);

      if (data.error === "LIMIT_REACHED") {
        setChecksRemaining(0);
        setPhase("idle");
        toast.error(t("unfollow_check.limit_reached"));
      } else if (data.error === "PRO_REQUIRED") {
        setPhase("idle");
        showPaywall("unfollows");
      } else if (data.error === "PARTIAL_FETCH") {
        setPhase("idle");
        toast.error(t("unfollow_check.partial_fetch", "Scan unvollständig – bitte erneut versuchen."));
      } else if (data.unfollows_found !== undefined) {
        setPhase("done");
        setResult({
          unfollows_found: data.unfollows_found || 0,
          new_follows_found: data.new_follows_found || 0,
        });
        setChecksRemaining(data.checks_remaining ?? null);
        if ((data.unfollows_found || 0) > 0) {
          toast.success(`🚩 ${data.unfollows_found} ${t("unfollow_check.unfollows_detected")}`);
        } else {
          toast.success(`✅ ${t("unfollow_check.no_unfollows")}`);
        }
        queryClient.invalidateQueries({ queryKey: ["follow_events"] });
        queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
        queryClient.invalidateQueries({ queryKey: ["profile_followings"] });
      }
    } catch (err) {
      if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
      phaseTimers.current.forEach(clearTimeout);
      setPhase("idle");
      toast.error(t("common.error"));
      console.error("Unfollow check error:", err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setPhase((prev) => prev === "done" ? "idle" : prev);
      }, 10000);
    }
  };

  const isDisabled = loading || (checksRemaining !== null && checksRemaining <= 0 && plan === "pro");
  const isPro = plan === "pro";

  const phaseLabel = (): string => {
    switch (phase) {
      case "scanning_following": return t("unfollow_check.phase_following", "🔍 Scanning following list...");
      case "evaluating": return t("unfollow_check.phase_evaluating", "📊 Evaluating results...");
      default: return t("unfollow_check.checking");
    }
  };

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="native-card p-5 border border-primary/20 relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="relative flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <SpyIcon size={36} glow />
              </motion.div>
              <div className="text-center">
                <motion.p
                  key={phase}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[13px] font-bold text-foreground"
                >
                  {phaseLabel()}
                </motion.p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {t("unfollow_check.please_wait", "Das kann bis zu 2 Minuten dauern...")}
                </p>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  initial={{ x: "-100%", width: "35%" }}
                  animate={{ x: "350%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <div className="flex items-center gap-3 w-full justify-center">
                {[
                  { key: "scanning_following", label: "Following" },
                  { key: "evaluating", label: "Auswertung" },
                ].map((step, i) => {
                  const isActive = phase === step.key;
                  const isDone = (phase === "evaluating" && i === 0) || (phase === "done" && i <= 1);
                  return (
                    <div key={step.key} className="flex items-center gap-1.5">
                      <motion.div
                        className={`h-2 w-2 rounded-full ${
                          isDone ? "bg-brand-green" : isActive ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                        animate={isActive ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className={`text-[9px] font-medium ${
                        isActive ? "text-foreground" : isDone ? "text-brand-green" : "text-muted-foreground/50"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-2"
          >
            {result.unfollows_found > 0 ? (
              <div className="native-card p-4 border border-destructive/30 bg-destructive/5">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-destructive/15 flex items-center justify-center">
                    <span className="text-sm">🚩</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-destructive">
                      {result.unfollows_found} {t("unfollow_check.unfollows_detected")}
                    </p>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <UserMinus className="h-2.5 w-2.5" /> {result.unfollows_found} entfolgt
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="native-card p-4 border border-brand-green/30 bg-brand-green/5">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-brand-green/15 flex items-center justify-center">
                    <span className="text-sm">✅</span>
                  </div>
                  <p className="text-[13px] font-bold text-brand-green">
                    {t("unfollow_check.no_unfollows")}
                  </p>
                </div>
              </div>
            )}

            {result.new_follows_found > 0 && (
              <div className="native-card p-3 border border-primary/20">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-3.5 w-3.5 text-primary" />
                  <p className="text-[11px] text-muted-foreground">
                    +{result.new_follows_found} {t("unfollow_check.new_activity_found", "neue Aktivität gefunden")}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.button
            key="button"
            onClick={handleCheck}
            disabled={isDisabled}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl text-[13px] font-bold transition-all disabled:opacity-50 min-h-[48px] relative overflow-hidden ${
              isPro && !isDisabled
                ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-secondary text-foreground"
            }`}
          >
            {isPro && !isDisabled && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {!isPro ? (
                <><Lock className="h-4 w-4" /> {t("unfollow_check.pro_only")}</>
              ) : checksRemaining !== null && checksRemaining <= 0 ? (
                <><Shield className="h-4 w-4" /> {t("unfollow_check.limit_reached")}</>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>{t("unfollow_check.button")}</span>
                  {checksRemaining !== null && (
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full tabular-nums">
                      {checksRemaining}/2
                    </span>
                  )}
                </>
              )}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
