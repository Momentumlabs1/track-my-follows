import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Lock, Shield, UserMinus, UserPlus, Check, ChevronDown, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SpyIcon } from "@/components/SpyIcon";
import { Progress } from "@/components/ui/progress";

interface UnfollowCheckButtonProps {
  profileId: string;
}

type ScanPhase = "idle" | "connecting" | "scanning_following" | "evaluating" | "done";

const TIMEOUT_MS = 180_000;

// Phase progress ranges: connecting 0-15, scanning 15-70, evaluating 70-99, done 100
// evaluating crawls slowly over 120s so the bar never "stops" while waiting for the API
const PHASE_RANGES: Record<string, [number, number, number]> = {
  // [start, end, durationMs]
  connecting: [0, 15, 3000],
  scanning_following: [15, 70, 17000],
  evaluating: [70, 99, 120000],
};

export function UnfollowCheckButton({ profileId }: UnfollowCheckButtonProps) {
  const { t } = useTranslation();
  const { plan, showPaywall, isProMax } = useSubscription();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [checksRemaining, setChecksRemaining] = useState<number | null>(null);
  const [result, setResult] = useState<{
    unfollows_found: number;
    new_follows_found: number;
    baseline_backfill_count?: number;
  } | null>(null);
  const phaseTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const normalizeErrorMessage = useCallback((error: unknown) => {
    if (typeof error === "string") return error;
    if (error && typeof error === "object") {
      const candidate = (error as { message?: unknown }).message;
      if (typeof candidate === "string" && candidate.trim().length > 0) return candidate;
      try {
        return JSON.stringify(error);
      } catch {
        return t("common.error");
      }
    }
    return t("common.error");
  }, [t]);

  useEffect(() => {
    if (plan !== "pro") return;
    if (isProMax) {
      setChecksRemaining(null);
      return;
    }
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
  }, [profileId, plan, isProMax]);

  useEffect(() => {
    return () => {
      phaseTimers.current.forEach(clearTimeout);
      if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  // Smooth progress interpolation based on current phase
  const startProgressAnimation = useCallback((phaseName: string) => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    const range = PHASE_RANGES[phaseName];
    if (!range) return;
    const [start, end, duration] = range;
    const startTime = Date.now();
    setProgress(start);
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const ratio = Math.min(elapsed / duration, 1);
      // Ease-out curve
      const eased = 1 - Math.pow(1 - ratio, 2);
      setProgress(Math.round(start + (end - start) * eased));
      if (ratio >= 1 && progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }, 80);
  }, []);

  const handleCheck = async () => {
    if (plan !== "pro") { showPaywall("unfollows"); return; }
    if (checksRemaining !== null && checksRemaining <= 0) { toast.error(t("unfollow_check.limit_reached")); return; }

    setLoading(true);
    setResult(null);
    setPhase("connecting");
    startProgressAnimation("connecting");

    phaseTimers.current = [
      setTimeout(() => {
        setPhase("scanning_following");
        startProgressAnimation("scanning_following");
      }, 3000),
      setTimeout(() => {
        setPhase("evaluating");
        startProgressAnimation("evaluating");
      }, 20000),
    ];

    timeoutTimer.current = setTimeout(() => {
      setLoading(false);
      setPhase("idle");
      setProgress(0);
      toast.error(t("unfollow_check.timeout", "Scan took too long. Please try again."));
    }, TIMEOUT_MS);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/unfollow-check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey,
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ profileId }),
      });

      let data: {
        error?: string;
        unfollows_found?: number;
        new_follows_found?: number;
        baseline_backfill_count?: number;
        checks_remaining?: number;
        fetched?: number;
        expected?: number;
        baseline_repaired?: boolean;
        missing_entries_added?: number;
      } = {};
      try { data = await res.json(); } catch { /* empty body */ }

      if (!res.ok && !data.error) throw new Error(`HTTP ${res.status}`);

      if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
      phaseTimers.current.forEach(clearTimeout);
      if (progressInterval.current) clearInterval(progressInterval.current);

      if (data.error === "LIMIT_REACHED") {
        setChecksRemaining(0);
        setPhase("idle");
        setProgress(0);
        toast.error(t("unfollow_check.limit_reached"));
      } else if (data.error === "PRO_REQUIRED") {
        setPhase("idle");
        setProgress(0);
        showPaywall("unfollows");
      } else if (data.error === "PARTIAL_FETCH") {
        setPhase("idle");
        setProgress(0);
        toast.error(t("unfollow_check.partial_fetch", "Scan unvollständig – bitte erneut versuchen."));
      } else if (data.baseline_repaired) {
        setPhase("idle");
        setProgress(0);
        toast.success(t("unfollow_check.baseline_repaired", "Baseline repariert! Starte den Check erneut für genaue Ergebnisse."));
        queryClient.invalidateQueries({ queryKey: ["profile_followings"] });
        queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
      } else if (data.error === "FOLLOWING_LIMIT") {
        setPhase("idle");
        setProgress(0);
        toast.error(t("unfollow_check.following_limit", "Unfollow-Check nur bis 1.500 Followings möglich."));
      } else if (data.error) {
        setPhase("idle");
        setProgress(0);
        toast.error(normalizeErrorMessage(data.error));
      } else if (data.unfollows_found !== undefined) {
        setProgress(100);
        setPhase("done");
        setResult({
          unfollows_found: data.unfollows_found || 0,
          new_follows_found: data.new_follows_found || 0,
          baseline_backfill_count: data.baseline_backfill_count || 0,
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
      if (progressInterval.current) clearInterval(progressInterval.current);
      setPhase("idle");
      setProgress(0);
      toast.error(normalizeErrorMessage(err));
      console.error("Unfollow check error:", err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setPhase((prev) => prev === "done" ? "idle" : prev);
        setProgress((prev) => prev === 100 ? 0 : prev);
      }, 15000);
    }
  };

  const isDisabled = loading || (!isProMax && checksRemaining !== null && checksRemaining <= 0 && plan === "pro");
  const isPro = plan === "pro";

  const SCAN_STEPS = [
    { key: "connecting", label: t("unfollow_check.phase_connecting", "Verbindung herstellen") },
    { key: "scanning_following", label: t("unfollow_check.phase_following_short", "Following scannen") },
    { key: "evaluating", label: t("unfollow_check.phase_evaluating_short", "Auswerten") },
  ];

  const getStepStatus = (stepKey: string) => {
    const order = ["connecting", "scanning_following", "evaluating", "done"];
    const currentIdx = order.indexOf(phase);
    const stepIdx = order.indexOf(stepKey);
    if (stepIdx < currentIdx) return "done";
    if (stepIdx === currentIdx) return "active";
    return "pending";
  };

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {loading || (phase !== "idle" && phase !== "done" && !result) ? (
          /* ── SCANNING STATE ── */
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
                <SpyIcon size={32} glow />
              </motion.div>

              <div className="text-center">
                <p className="text-[13px] font-bold text-foreground">
                  {t("unfollow_check.scan_title", "Unfollow-Scan läuft")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {t("unfollow_check.description", "Vergleicht die Following-Liste mit dem letzten Scan")}
                </p>
              </div>

              {/* Determinate Progress Bar */}
              <div className="w-full space-y-1.5">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground">
                    {t("unfollow_check.please_wait", "Das kann bis zu 2 Minuten dauern...")}
                  </span>
                  <span className="text-[10px] font-bold text-primary tabular-nums">
                    {progress}%
                  </span>
                </div>
              </div>

              {/* Step indicators */}
              <div className="flex flex-col gap-2 w-full">
                {SCAN_STEPS.map((step) => {
                  const status = getStepStatus(step.key);
                  return (
                    <div key={step.key} className="flex items-center gap-2.5">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                        status === "done"
                          ? "bg-brand-green/20"
                          : status === "active"
                          ? "bg-primary/20"
                          : "bg-muted"
                      }`}>
                        {status === "done" ? (
                          <Check className="h-3 w-3 text-brand-green" />
                        ) : status === "active" ? (
                          <motion.div
                            className="h-2 w-2 rounded-full bg-primary"
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                        )}
                      </div>
                      <span className={`text-[11px] font-medium ${
                        status === "done"
                          ? "text-brand-green"
                          : status === "active"
                          ? "text-foreground"
                          : "text-muted-foreground/50"
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
          /* ── RESULT STATE ── */
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
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-destructive">
                      {result.unfollows_found} {t("unfollow_check.unfollows_detected")}
                    </p>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <UserMinus className="h-2.5 w-2.5" /> {result.unfollows_found} {t("unfollow_check.has_unfollowed", "entfolgt")}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const el = document.querySelector('[data-tab="gone"]');
                    if (el instanceof HTMLElement) el.click();
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-destructive py-1.5"
                >
                  <ChevronDown className="h-3 w-3" />
                  {t("unfollow_check.scroll_to_details", "Details ansehen")}
                </button>
              </div>
            ) : (
              <div className="native-card p-4 border border-brand-green/30 bg-brand-green/5">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-brand-green/15 flex items-center justify-center">
                    <Check className="h-4 w-4 text-brand-green" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-brand-green">
                      {t("unfollow_check.no_unfollows")}
                    </p>
                    {checksRemaining !== null && (
                      <span className="text-[10px] text-muted-foreground">
                        {t("unfollow_check.next_scan_info", "{{count}} Check(s) übrig heute", { count: checksRemaining })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {result.new_follows_found > 0 && (
              <div className="native-card p-3 border border-primary/20">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-3.5 w-3.5 text-primary" />
                  <p className="text-[11px] text-muted-foreground">
                    +{result.new_follows_found} {t("unfollow_check.new_follows_detected", "neue Follows erkannt")}
                  </p>
                </div>
              </div>
            )}
            {(result.baseline_backfill_count ?? 0) > 0 && result.new_follows_found === 0 && result.unfollows_found === 0 && (
              <div className="native-card p-3 border border-border/30">
                <div className="flex items-center gap-2">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground">
                    {t("unfollow_check.baseline_updated", "Baseline aktualisiert – nächster Check liefert exakte Ergebnisse")}
                  </p>
                </div>
              </div>
            )}
          </motion.div>

        ) : !isPro ? (
          /* ── FREE USER FUNNEL ── */
          <motion.div
            key="free-funnel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => showPaywall("unfollows")}
            className="native-card p-4 border border-primary/20 relative overflow-hidden cursor-pointer"
          >
            {/* Blurred fake preview */}
            <div className="relative">
              <div className="blur-sm pointer-events-none select-none">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="h-8 w-8 rounded-full bg-destructive/15 flex items-center justify-center">
                    <span className="text-sm">🚩</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-destructive">
                      3 {t("unfollow_check.unfollows_detected")}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {t("unfollow_check.teaser_subtitle", "Veränderungen in der Following-Liste erkannt")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Overlay CTA */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-xl">
                <Lock className="h-5 w-5 text-primary mb-1.5" />
                <p className="text-[12px] font-bold text-foreground">
                  {t("unfollow_check.teaser_title", "Unfollow-Erkennung")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 text-center px-4">
                  {t("unfollow_check.teaser_desc", "Erkenne sofort wenn jemand entfolgt wird")}
                </p>
                <div className="mt-2.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
                  {t("unfollow_check.teaser_unlock", "Mit Pro freischalten")}
                </div>
              </div>
            </div>
          </motion.div>

        ) : (
          /* ── IDLE STATE (PRO) ── */
          <motion.div
            key="idle-pro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <div className="native-card p-4 border border-border/50">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <SpyIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-foreground">
                    {t("unfollow_check.idle_title", "Unfollow-Scan")}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                    {t("unfollow_check.description", "Vergleicht die Following-Liste mit dem letzten Scan")}
                  </p>
                </div>
                {(checksRemaining !== null || isProMax) && (
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full tabular-nums shrink-0">
                    {isProMax ? "∞" : `${checksRemaining}/2`}
                  </span>
                )}
              </div>
            </div>

            <motion.button
              onClick={handleCheck}
              disabled={isDisabled}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl text-[13px] font-bold transition-all disabled:opacity-50 min-h-[48px] relative overflow-hidden ${
                !isDisabled
                  ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-secondary text-foreground"
              }`}
            >
              {!isDisabled && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                {checksRemaining !== null && checksRemaining <= 0 ? (
                  <><Shield className="h-4 w-4" /> {t("unfollow_check.limit_reached")}</>
                ) : (
                  <><Search className="h-4 w-4" /> {t("unfollow_check.button")}</>
                )}
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
