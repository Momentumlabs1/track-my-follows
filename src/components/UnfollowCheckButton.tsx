import { useState, useEffect } from "react";
import { Search, Loader2, Lock, Shield } from "lucide-react";
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

  // Load today's check count on mount
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
    if (plan !== "pro") {
      showPaywall("unfollows");
      return;
    }
    if (checksRemaining !== null && checksRemaining <= 0) {
      toast.error(t("unfollow_check.limit_reached"));
      return;
    }

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

  return (
    <div className="space-y-2">
      <button
        onClick={handleCheck}
        disabled={loading || (checksRemaining !== null && checksRemaining <= 0 && plan === "pro")}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[13px] font-bold transition-all disabled:opacity-50 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> {t("unfollow_check.checking")}</>
        ) : plan !== "pro" ? (
          <><Lock className="h-4 w-4" /> {t("unfollow_check.pro_only")}</>
        ) : checksRemaining !== null && checksRemaining <= 0 ? (
          <><Shield className="h-4 w-4" /> {t("unfollow_check.limit_reached")}</>
        ) : (
          <><Search className="h-4 w-4" /> {t("unfollow_check.button")} {checksRemaining !== null ? `(${checksRemaining}/2)` : ""}</>
        )}
      </button>

      {result && result.unfollows_found > 0 && (
        <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-3 text-center">
          <p className="text-[12px] font-bold text-orange-700 dark:text-orange-400">
            🚩 {result.unfollows_found} {t("unfollow_check.unfollows_detected")}
          </p>
        </div>
      )}
      {result && result.unfollows_found === 0 && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center">
          <p className="text-[12px] font-bold text-emerald-700 dark:text-emerald-400">
            ✅ {t("unfollow_check.no_unfollows")}
          </p>
        </div>
      )}
    </div>
  );
}
