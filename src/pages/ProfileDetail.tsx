import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Loader2, RefreshCw, TrendingUp, TrendingDown, Lock } from "lucide-react";
import { useTrackedProfiles, useFollowEvents, useDeleteTrackedProfile } from "@/hooks/useTrackedProfiles";
import { useProfileFollowings } from "@/hooks/useProfileFollowings";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SuspicionMeter } from "@/components/SuspicionMeter";
import { PeakHoursChart } from "@/components/PeakHoursChart";
import { GenderBreakdownChart } from "@/components/GenderBreakdownChart";
import { WeeklyActivityChart } from "@/components/WeeklyActivityChart";
import { analyzeSuspicion } from "@/lib/suspicionAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/contexts/SubscriptionContext";

function useTimeAgo() {
  const { t } = useTranslation();
  return (dateStr: string | null): string => {
    if (!dateStr) return t("dashboard.never_scanned");
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("dashboard.just_now");
    if (mins < 60) return t("dashboard.minutes_ago", { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("dashboard.hours_ago", { count: hours });
    return t("dashboard.days_ago", { count: Math.floor(hours / 24) });
  };
}

type DetailTab = "following" | "followers" | "weg" | "insights";

const ProfileDetail = () => {
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DetailTab>("following");
  const [isScanning, setIsScanning] = useState(false);
  const { plan, canUseUnfollows, shouldBlur, showPaywall, canUseStats } = useSubscription();

  const { data: profiles = [], isLoading: profilesLoading } = useTrackedProfiles();
  const { data: events = [], isLoading: eventsLoading } = useFollowEvents(id);
  const { data: followings = [] } = useProfileFollowings(id);
  const deleteProfile = useDeleteTrackedProfile();

  const profile = profiles.find((p) => p.id === id);
  const isLoading = profilesLoading || eventsLoading;

  const suspicionAnalysis = analyzeSuspicion(
    events, followings, profile?.follower_count ?? 0, profile?.following_count ?? 0, t,
  );

  // Calculate weekly scores for sparkline
  const weeklyScores = Array.from({ length: 4 }, (_, i) => {
    const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekEvents = events.filter((e) => {
      const d = new Date(e.detected_at);
      return d >= weekStart && d < weekEnd;
    });
    const analysis = analyzeSuspicion(weekEvents, [], profile?.follower_count ?? 0, profile?.following_count ?? 0);
    return analysis.overallScore;
  }).reverse();

  const isFreeAndScanned = plan === "free" && (profile as Record<string, unknown> | undefined)?.initial_scan_done === true;

  const handleScan = async () => {
    if (isFreeAndScanned) {
      showPaywall("scan");
      return;
    }
    setIsScanning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("trigger-scan", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: { profileId: id },
      });
      if (res.error) throw res.error;
      const resData = res.data as { error?: string; results?: Array<{ error?: string }> };
      if (resData?.error === "PAYWALL_REQUIRED") {
        showPaywall("scan");
      } else if (resData?.results?.[0]?.error) {
        toast.error(t("profile_detail.scan_error", { error: resData.results[0].error }));
      } else {
        toast.success(t("profile_detail.scan_complete"));
      }
      queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
      queryClient.invalidateQueries({ queryKey: ["follow_events"] });
      queryClient.invalidateQueries({ queryKey: ["profile_followings"] });
    } catch (err) {
      toast.error(t("profile_detail.scan_failed", { error: err instanceof Error ? err.message : String(err) }));
    } finally {
      setIsScanning(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    deleteProfile.mutate(id, { onSuccess: () => navigate("/dashboard", { replace: true }) });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <span className="text-5xl mb-4">🥲</span>
        <p className="text-muted-foreground text-sm">{t("profile_detail.not_found")}</p>
      </div>
    );
  }

  const followingEvents = events.filter((e) => e.event_type === "follow" && e.direction === "following").sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
  const followerEvents = events.filter((e) => e.event_type === "follow" && e.direction === "follower").sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
  const wegEvents = events.filter((e) => e.event_type === "unfollow").sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
  const displayEvents = activeTab === "following" ? followingEvents : activeTab === "followers" ? followerEvents : wegEvents;

  const followerDelta = (profile as Record<string, unknown>).previous_follower_count != null
    ? (profile.follower_count ?? 0) - ((profile as Record<string, unknown>).previous_follower_count as number) : null;
  const followingDelta = (profile as Record<string, unknown>).previous_following_count != null
    ? (profile.following_count ?? 0) - ((profile as Record<string, unknown>).previous_following_count as number) : null;

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <button onClick={() => navigate("/dashboard")} className="p-2 -ms-2 text-foreground">
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </button>
        <span className="text-base font-extrabold">Spy-<span className="text-primary">Secret</span></span>
        <button onClick={handleDelete} className="p-2 -me-2 text-destructive">
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5 py-4">
        <div className="ios-card flex items-center gap-4">
          <div className="avatar-ring flex-shrink-0 p-[3px]">
            <InstagramAvatar src={profile.avatar_url} alt={profile.username} fallbackInitials={profile.username} size={64} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-foreground">@{profile.username}</h2>
            {profile.display_name && <p className="text-[12px] text-muted-foreground font-medium">{profile.display_name}</p>}
            <p className="text-[11px] text-muted-foreground mt-0.5">{t("profile_detail.tracking_since", { date: new Date(profile.created_at).toLocaleDateString() })}</p>
            <p className="text-[11px] text-muted-foreground">{timeAgo(profile.last_scanned_at || profile.updated_at)}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="px-5 grid grid-cols-3 gap-2.5 mb-4">
        <div className="stat-box-blue">
          <div className="flex items-baseline justify-center gap-1">
            <p className="text-xl font-extrabold">{(profile.follower_count ?? 0).toLocaleString()}</p>
            {followerDelta !== null && followerDelta !== 0 && (
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${followerDelta > 0 ? "text-emerald-600" : "text-red-500"}`}>
                {followerDelta > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {followerDelta > 0 ? `+${followerDelta}` : followerDelta}
              </span>
            )}
          </div>
          <p className="text-[10px] font-medium opacity-70">{t("dashboard.followers")}</p>
        </div>
        <div className="stat-box-purple">
          <div className="flex items-baseline justify-center gap-1">
            <p className="text-xl font-extrabold">{(profile.following_count ?? 0).toLocaleString()}</p>
            {followingDelta !== null && followingDelta !== 0 && (
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${followingDelta > 0 ? "text-emerald-600" : "text-red-500"}`}>
                {followingDelta > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {followingDelta > 0 ? `+${followingDelta}` : followingDelta}
              </span>
            )}
          </div>
          <p className="text-[10px] font-medium opacity-70">{t("dashboard.following")}</p>
        </div>
        <div className="stat-box rounded-xl px-3 py-2 text-center bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400">
          <p className="text-xl font-extrabold">{events.length}</p>
          <p className="text-[10px] font-medium opacity-70">{t("profile_detail.events")}</p>
        </div>
      </motion.div>

      <div className="px-5 mb-4">
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="w-full pill-btn-primary py-3 justify-center text-[13px] disabled:opacity-50"
        >
          {isFreeAndScanned ? (
            <><Lock className="h-4 w-4" /> {t("paywall.scanLocked")}</>
          ) : isScanning ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> {t("profile_detail.scanning")}</>
          ) : (
            <><RefreshCw className="h-4 w-4" /> {t("profile_detail.scan_now")}</>
          )}
        </button>
      </div>

      {/* Suspicion Meter */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="px-5 mb-5 relative">
        {!canUseStats && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-card/80 backdrop-blur-sm">
            <button onClick={() => showPaywall("stats")} className="gradient-bg text-primary-foreground text-[12px] font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> {t("profile_detail.pro_required")}
            </button>
          </div>
        )}
        <div className={!canUseStats ? "blur-sm pointer-events-none" : ""}>
          <SuspicionMeter analysis={suspicionAnalysis} weeklyScores={weeklyScores} />
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="px-5">
        <div className="flex gap-0 border-b border-border mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("following")}
            className={`relative flex items-center gap-1 px-3 pb-2.5 text-[12px] font-semibold transition-colors whitespace-nowrap ${activeTab === "following" ? "text-blue-600" : "text-muted-foreground"}`}
          >
            🔵 {t("profile_detail.tab_following")} ({followingEvents.length})
            {activeTab === "following" && <motion.div layoutId="profile-tab" className="absolute bottom-0 start-0 end-0 h-[2px] bg-blue-500 rounded-full" transition={{ type: "spring", bounce: 0.15, duration: 0.4 }} />}
          </button>
          <button
            onClick={() => setActiveTab("followers")}
            className={`relative flex items-center gap-1 px-3 pb-2.5 text-[12px] font-semibold transition-colors whitespace-nowrap ${activeTab === "followers" ? "text-emerald-600" : "text-muted-foreground"}`}
          >
            🟢 {t("profile_detail.tab_followers")} ({followerEvents.length})
            {activeTab === "followers" && <motion.div layoutId="profile-tab" className="absolute bottom-0 start-0 end-0 h-[2px] bg-emerald-500 rounded-full" transition={{ type: "spring", bounce: 0.15, duration: 0.4 }} />}
          </button>
          <button
            onClick={() => {
              if (!canUseUnfollows) { showPaywall("unfollows"); return; }
              setActiveTab("weg");
            }}
            className={`relative flex items-center gap-1 px-3 pb-2.5 text-[12px] font-semibold transition-colors whitespace-nowrap ${activeTab === "weg" ? "text-red-500" : "text-muted-foreground"}`}
          >
            {!canUseUnfollows && <Lock className="h-3 w-3" />}
            🔴 {t("profile_detail.tab_gone")} ({wegEvents.length})
            {activeTab === "weg" && <motion.div layoutId="profile-tab" className="absolute bottom-0 start-0 end-0 h-[2px] bg-red-500 rounded-full" transition={{ type: "spring", bounce: 0.15, duration: 0.4 }} />}
          </button>
          <button
            onClick={() => {
              if (!canUseStats) { showPaywall("insights"); return; }
              setActiveTab("insights");
            }}
            className={`relative flex items-center gap-1 px-3 pb-2.5 text-[12px] font-semibold transition-colors whitespace-nowrap ${activeTab === "insights" ? "text-primary" : "text-muted-foreground"}`}
          >
            {!canUseStats && <Lock className="h-3 w-3" />}
            📊 {t("profile_detail.tab_insights")}
            {activeTab === "insights" && <motion.div layoutId="profile-tab" className="absolute bottom-0 start-0 end-0 h-[2px] bg-primary rounded-full" transition={{ type: "spring", bounce: 0.15, duration: 0.4 }} />}
          </button>
        </div>

        {activeTab === "insights" ? (
          <div className="space-y-4">
            <PeakHoursChart events={events} />
            <GenderBreakdownChart events={events} />
            <WeeklyActivityChart events={events} />
          </div>
        ) : (
          <div className="space-y-1">
            {displayEvents.length > 0 ? displayEvents.map((event, i) => {
              const ev = event as Record<string, unknown>;
              const genderTag = ev.gender_tag as string | undefined;
              const isMutual = ev.is_mutual as boolean | undefined;
              const category = ev.category as string | undefined;

              return (
                <motion.div key={event.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3 py-2.5 px-1 relative">
                  <div className={shouldBlur ? "blur-sm" : ""}>
                    <InstagramAvatar src={event.target_avatar_url} alt={event.target_username} fallbackInitials={event.target_username} size={40} />
                  </div>
                  <div className={`flex-1 min-w-0 ${shouldBlur ? "blur-sm" : ""}`}>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-semibold text-foreground">@{event.target_username}</p>
                      {genderTag === "female" && <span className="text-[11px]">👩</span>}
                      {genderTag === "male" && <span className="text-[11px]">👨</span>}
                    </div>
                    {event.target_display_name && <p className="text-[11px] text-muted-foreground">{event.target_display_name}</p>}
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {isMutual && <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">🔄 {t("events.mutual")}</span>}
                      {category === "influencer" && <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">⭐ {t("category.influencer")}</span>}
                      {category === "celebrity" && <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">👑 {t("category.celebrity")}</span>}
                      {category === "private" && <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">🔒 {t("category.private")}</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{timeAgo(event.detected_at)}</p>
                  </div>
                  {shouldBlur ? (
                    <button onClick={() => showPaywall("blur")} className="gradient-bg text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {t("events.upgrade_to_reveal")}
                    </button>
                  ) : (
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                      activeTab === "weg"
                        ? (event.direction === "follower" ? "bg-red-50 dark:bg-red-900/20 text-red-600" : "bg-orange-50 dark:bg-orange-900/20 text-orange-600")
                        : activeTab === "followers"
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                          : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                    }`}>
                      {activeTab === "weg"
                        ? (event.direction === "follower" ? t("profile_detail.lost_follower") : t("profile_detail.unfollowed"))
                        : activeTab === "followers"
                          ? t("profile_detail.new_follower")
                          : t("profile_detail.new_following")}
                    </span>
                  )}
                </motion.div>
              );
            }) : (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">{activeTab === "weg" ? "🔍" : "✨"}</span>
                <p className="text-[13px] text-muted-foreground">{activeTab === "weg" ? t("profile_detail.no_gone_events") : t("profile_detail.no_new_events")}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{profile.last_scanned_at ? t("profile_detail.will_update") : t("profile_detail.start_scan")}</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ProfileDetail;
