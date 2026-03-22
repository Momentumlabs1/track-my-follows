import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Loader2, Search, AlertCircle } from "lucide-react";
import { useAddTrackedProfile, useTrackedProfiles } from "@/hooks/useTrackedProfiles";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { haptic } from "@/lib/native";
import { supabase } from "@/integrations/supabase/client";

const AddProfile = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkedAvatarUrl, setCheckedAvatarUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const addProfile = useAddTrackedProfile();
  const { data: profiles = [] } = useTrackedProfiles();
  const { maxProfiles, showPaywall } = useSubscription();

  const currentCount = profiles.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setError(null);

    if (currentCount >= maxProfiles) {
      haptic.warning();
      showPaywall("profiles");
      return;
    }

    // Step 1: Pre-check username via check-username edge function
    setChecking(true);
    try {
      const { data: checkData, error: checkError } = await supabase.functions.invoke("check-username", {
        body: { username: username.trim().toLowerCase() },
      });

      if (checkError) throw checkError;

      if (!checkData?.exists) {
        haptic.error();
        setError(t("errors.profile_not_found"));
        setChecking(false);
        return;
      }

      if (checkData.is_private) {
        haptic.error();
        setError(t("errors.profile_private"));
        setChecking(false);
        return;
      }
    } catch (err) {
      console.error("[check-username] Error:", err);
      // On check failure, continue with normal flow (don't block)
    }
    setChecking(false);

    // Step 2: Profile is public and exists — add to DB
    haptic.light();
    addProfile.mutate(username, {
      onSuccess: (data) => {
        haptic.success();
        navigate(`/analyzing/${data.id}/${username.trim().toLowerCase()}`);
      },
      onError: (err) => {
        haptic.error();
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("private")) {
          setError(t("errors.profile_private"));
        } else if (msg.includes("not found") || msg.includes("404")) {
          setError(t("errors.profile_not_found"));
        } else {
          setError(t("errors.scan_failed"));
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ms-2 text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </button>
        <span className="text-[13px] font-semibold text-primary">
          {t("add_profile.plan_counter", { current: currentCount, max: maxProfiles })}
        </span>
      </div>

      <div className="flex-1 px-6 pt-8">
        <h1 className="text-2xl font-extrabold text-foreground leading-tight whitespace-pre-line">
          {t("add_profile.title")}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-2">{t("add_profile.subtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="relative">
            <span className="absolute start-4 top-1/2 -translate-y-1/2 text-primary font-bold text-base">@</span>
            <input
              type="text"
              placeholder={t("add_profile.placeholder")}
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(null); }}
              className={`w-full rounded-2xl bg-card border-2 ps-10 pe-4 py-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${
                error ? "border-destructive/50 focus:border-destructive" : "border-primary/30 focus:border-primary"
              }`}
              autoFocus
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-3 flex items-start gap-2 text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] font-medium">{error}</p>
            </div>
          )}

          <div className="mt-6 flex items-start gap-3 bg-muted rounded-2xl p-4">
            <div className="p-2 bg-card rounded-xl flex-shrink-0">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">{t("add_profile.secure_title")}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t("add_profile.secure_text")}</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!username.trim() || addProfile.isPending || checking}
            className="mt-8 w-full pill-btn-primary py-4 justify-center text-[15px] disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            {checking ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> {t("add_profile.checking")}</>
            ) : addProfile.isPending ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> {t("add_profile.adding")}</>
            ) : (
              <><Search className="h-5 w-5" /> {t("add_profile.start_search")}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProfile;
