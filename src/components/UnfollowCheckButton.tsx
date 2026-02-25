import { useState, useEffect } from "react";
import { Search, Loader2, Lock, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface UnfollowCheckButtonProps {
  profileId: string;
}

export function UnfollowCheckButton({ profileId }: UnfollowCheckButtonProps) {
  const { t } = useTranslation();
  const { plan, showPaywall } = useSubscription();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [checksRemaining, setChecksRemaining] = useState<number | null>(null);
  const [result, setResult] = useState<{ unfollows_found: number; new_follows_found: number } | null>(null);

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

  const handleCheck = async () => {
    if (plan !== "pro") { showPaywall("unfollows"); return; }
    if (checksRemaining !== null && checksRemaining <= 0) { toast.error(t("unfollow_check.limit_reached")); return; }

    setLoading(true);
    setResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("unfollow-check", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: { profileId },
      });
      if (res.error) throw res.error;
      const data = res.data as { error?: string; unfollows_found?: number; new_follows_found?: number; checks_remaining?: number };

      if (data.error === "LIMIT_REACHED") {
        setChecksRemaining(0);
        toast.error(t("unfollow_check.limit_reached"));
      } else if (data.error === "PRO_REQUIRED") {
        showPaywall("unfollows");
      } else if (data.unfollows_found !== undefined) {
        setResult({ unfollows_found: data.unfollows_found, new_follows_found: data.new_follows_found || 0 });
        setChecksRemaining(data.checks_remaining ?? null);
        if (data.unfollows_found > 0) {
          toast.success(`🚩 ${data.unfollows_found} ${t("unfollow_check.unfollows_detected")}`);
        } else {
          toast.success(`✅ ${t("unfollow_check.no_unfollows")}`);
        }
        queryClient.invalidateQueries({ queryKey: ["follow_events"] });
        queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
        queryClient.invalidateQueries({ queryKey: ["profile_followings"] });
      }
    } catch (err) {
      toast.error(t("common.error"));
      console.error("Unfollow check error:", err);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || (checksRemaining !== null && checksRemaining <= 0 && plan === "pro");
  const isPro = plan === "pro";

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
        {/* Subtle shimmer effect for active pro button */}
        {isPro && !isDisabled && !loading && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />
        )}

        <span className="relative flex items-center gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("unfollow_check.checking")}</span>
              <span className="text-[10px] text-muted-foreground font-normal ml-1">
                {t("unfollow_check.full_scan_hint", "Full scan – may take a moment")}
              </span>
            </>
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
            className="overflow-hidden"
          >
            {result.unfollows_found > 0 ? (
              <div className="native-card p-4 border-l-4 border-destructive">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🚩</span>
                  <p className="text-[13px] font-bold text-destructive">
                    {result.unfollows_found} {t("unfollow_check.unfollows_detected")}
                  </p>
                </div>
                {result.new_follows_found > 0 && (
                  <p className="text-[11px] text-muted-foreground ms-7">
                    + {result.new_follows_found} {t("unfollow_check.new_follows_found", "new follows found")}
                  </p>
                )}
              </div>
            ) : (
              <div className="native-card p-4 border-l-4 border-brand-green">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <p className="text-[13px] font-bold text-brand-green">
                    {t("unfollow_check.no_unfollows")}
                  </p>
                </div>
                {result.new_follows_found > 0 && (
                  <p className="text-[11px] text-muted-foreground ms-7">
                    + {result.new_follows_found} {t("unfollow_check.new_follows_found", "new follows found")}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
