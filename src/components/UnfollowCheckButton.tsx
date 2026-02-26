import { useState, useEffect, useRef } from "react";
import { Search, Lock, Shield, UserMinus, UserPlus, Users } from "lucide-react";
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

type ScanPhase = "idle" | "scanning_following" | "scanning_followers" | "evaluating" | "done";

const PHASE_TIMINGS: Record<string, number> = {
  scanning_following: 0,
  scanning_followers: 8000,
  evaluating: 25000,
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
    lost_followers: number;
    new_followers_found: number;
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

  // Cleanup timers
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

    // Simulate phase progression
    phaseTimers.current = [
      setTimeout(() => setPhase("scanning_followers"), PHASE_TIMINGS.scanning_followers),
      setTimeout(() => setPhase("evaluating"), PHASE_TIMINGS.evaluating),
    ];

    // Timeout handler
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
        lost_followers?: number;
        new_followers_found?: number;
        checks_remaining?: number;
      };

      // Clear timeout
      if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
      phaseTimers.current.forEach(clearTimeout);

      if (data.error === "LIMIT_REACHED") {
        setChecksRemaining(0);
        setPhase("idle");
        toast.error(t("unfollow_check.limit_reached"));
      } else if (data.error === "PRO_REQUIRED") {
        setPhase("idle");
        showPaywall("unfollows");
      } else if (data.unfollows_found !== undefined) {
        setPhase("done");
        const totalUnfollows = (data.unfollows_found || 0) + (data.lost_followers || 0);
        const totalNew = (data.new_follows_found || 0) + (data.new_followers_found || 0);
        setResult({
          unfollows_found: data.unfollows_found || 0,
          new_follows_found: data.new_follows_found || 0,
          lost_followers: data.lost_followers || 0,
          new_followers_found: data.new_followers_found || 0,
        });
        setChecksRemaining(data.checks_remaining ?? null);
        if (totalUnfollows > 0) {
          toast.success(`🚩 ${totalUnfollows} ${t("unfollow_check.unfollows_detected")}`);
        } else {
          toast.success(`✅ ${t("unfollow_check.no_unfollows")}`);
        }
        queryClient.invalidateQueries({ queryKey: ["follow_events"] });
        queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
        queryClient.invalidateQueries({ queryKey: ["profile_followings"] });
        queryClient.invalidateQueries({ queryKey: ["follower_events"] });
      }
    } catch (err) {
      if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
      phaseTimers.current.forEach(clearTimeout);
      setPhase("idle");
      toast.error(t("common.error"));
      console.error("Unfollow check error:", err);
    } finally {
      setLoading(false);
      // Keep phase for result display, reset after delay
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
      case "scanning_followers": return t("unfollow_check.phase_followers", "🔍 Scanning follower list...");
      case "evaluating": return t("unfollow_check.phase_evaluating", "📊 Evaluating results...");
      default: return t("unfollow_check.checking");
    }
  };

  const totalUnfollows = result ? result.unfollows_found + result.lost_followers : 0;
  const totalNew = result ? result.new_follows_found + result.new_followers_found : 0;

  return (
    <div className="space-y-2">
      <motion.button
        onClick={handleCheck}
        disabled={isDisabled}
        whileTap={{ scale: 0.97 }}
        className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl text-[13px] font-bold transition-all disabled:opacity-50 min-h-[48px] relative overflow-hidden ${
          isPro && !isDisabled
            ? "bg-gradient-to-r from-accent/80 to-secondary text-foreground border border-border/50 shadow-sm"
            : "bg-secondary text-foreground"
        }`}
      >
        {/* Shimmer effect */}
        {isPro && !isDisabled && !loading && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />
        )}

        <span className="relative flex items-center gap-2">
          {loading ? (
            <div className="flex flex-col items-center gap-1.5 w-full">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <SpyIcon size={18} glow />
                </motion.div>
                <span className="text-[12px]">{phaseLabel()}</span>
              </div>
              {/* Indeterminate progress bar */}
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ x: "-100%", width: "40%" }}
                  animate={{ x: "250%" }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          ) : !isPro ? (
            <><Lock className="h-4 w-4 text-muted-foreground" /> {t("unfollow_check.pro_only")}</>
          ) : checksRemaining !== null && checksRemaining <= 0 ? (
            <><Shield className="h-4 w-4 text-muted-foreground" /> {t("unfollow_check.limit_reached")}</>
          ) : (
            <>
              <Search className="h-4 w-4" />
              <span>{t("unfollow_check.button")}</span>
              {checksRemaining !== null && (
                <span className="text-[10px] bg-foreground/10 px-1.5 py-0.5 rounded-full tabular-nums">
                  {checksRemaining}/2
                </span>
              )}
            </>
          )}
        </span>
      </motion.button>

      {/* Result cards */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="overflow-hidden space-y-2"
          >
            {/* Unfollows card */}
            {totalUnfollows > 0 ? (
              <div className="native-card p-4 border-l-4 border-destructive">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🚩</span>
                  <p className="text-[13px] font-bold text-destructive">
                    {totalUnfollows} {t("unfollow_check.unfollows_detected")}
                  </p>
                </div>
                <div className="space-y-1 ms-7">
                  {result.unfollows_found > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <UserMinus className="h-3 w-3" />
                      <span>{result.unfollows_found} {t("unfollow_check.has_unfollowed", "has unfollowed")}</span>
                    </div>
                  )}
                  {result.lost_followers > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{result.lost_followers} {t("unfollow_check.lost_followers", "lost followers")}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="native-card p-4 border-l-4 border-brand-green">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <p className="text-[13px] font-bold text-brand-green">
                    {t("unfollow_check.no_unfollows")}
                  </p>
                </div>
              </div>
            )}

            {/* New follows card */}
            {totalNew > 0 && (
              <div className="native-card p-3 border-l-4 border-primary/50">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  <p className="text-[12px] text-muted-foreground">
                    + {totalNew} {t("unfollow_check.new_activity_found", "new activity found")}
                  </p>
                </div>
                <div className="space-y-0.5 ms-6 mt-1">
                  {result.new_follows_found > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      {result.new_follows_found} {t("unfollow_check.new_follows", "new follows")}
                    </p>
                  )}
                  {result.new_followers_found > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      {result.new_followers_found} {t("unfollow_check.new_followers", "new followers")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
