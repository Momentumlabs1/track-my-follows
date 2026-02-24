import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trash2, Loader2, RefreshCw, TrendingUp, TrendingDown, Lock, BarChart3, X, Info, Flame, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logoSquare from "@/assets/logo-square.png";
import { UnfollowCheckButton } from "@/components/UnfollowCheckButton";
import { ScanStatus } from "@/components/ScanStatus";
import { useTrackedProfiles, useFollowEvents, useDeleteTrackedProfile } from "@/hooks/useTrackedProfiles";
import { useProfileFollowings } from "@/hooks/useProfileFollowings";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SuspicionMeter } from "@/components/SuspicionMeter";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
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

type MainTab = "followed" | "unfollowed";

const ProfileDetail = () => {
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState<MainTab>("followed");
  const [isScanning, setIsScanning] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const { plan, canUseUnfollows, shouldBlur, showPaywall, canUseStats } = useSubscription();
  const { user } = useAuth();

  const { data: profiles = [], isLoading: profilesLoading } = useTrackedProfiles();
  const { data: events = [], isLoading: eventsLoading } = useFollowEvents(id);
  const { data: followings = [] } = useProfileFollowings(id);
  const deleteProfile = useDeleteTrackedProfile();

  const profile = profiles.find((p) => p.id === id);
  const isLoading = profilesLoading || eventsLoading;

  const suspicionAnalysis = analyzeSuspicion(
    events, followings, profile?.follower_count ?? 0, profile?.following_count ?? 0, t,
  );

  const weeklyScores = useMemo(() => Array.from({ length: 4 }, (_, i) => {
    const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekEvents = events.filter((e) => {
      const d = new Date(e.detected_at);
      return d >= weekStart && d < weekEnd;
    });
    return analyzeSuspicion(weekEvents, [], profile?.follower_count ?? 0, profile?.following_count ?? 0).overallScore;
  }).reverse(), [events, profile]);

  const isFreeAndScanned = plan === "free" && (profile as Record<string, unknown> | undefined)?.initial_scan_done === true;

  const handleScan = async () => {
    if (isFreeAndScanned) { showPaywall("scan"); return; }
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

  // Event filtering
  const followingNewEvents = events
    .filter((e) => (e.event_type === "follow" && e.direction === "following") || e.event_type === "new_following")
    .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
  const unfollowedEvents = events
    .filter((e) => (e.event_type === "unfollow" && e.direction === "following") || e.event_type === "unfollowed")
    .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());

  const displayEvents = mainTab === "followed" ? followingNewEvents : unfollowedEvents;

  const isFirstScanPhase = unfollowedEvents.length === 0
    && profile.created_at && (Date.now() - new Date(profile.created_at).getTime()) < 24 * 60 * 60 * 1000;

  const followerDelta = (profile as Record<string, unknown>).previous_follower_count != null
    ? (profile.follower_count ?? 0) - ((profile as Record<string, unknown>).previous_follower_count as number) : null;
  const followingDelta = (profile as Record<string, unknown>).previous_following_count != null
    ? (profile.following_count ?? 0) - ((profile as Record<string, unknown>).previous_following_count as number) : null;

  const spyName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Agent";

  // Today's activity summary
  const todayFollows = events.filter((e) => {
    const isToday = new Date(e.detected_at).toDateString() === new Date().toDateString();
    return isToday && (e.event_type === "follow" || e.event_type === "new_following");
  }).length;
  const todayUnfollows = events.filter((e) => {
    const isToday = new Date(e.detected_at).toDateString() === new Date().toDateString();
    return isToday && (e.event_type === "unfollow" || e.event_type === "unfollowed");
  }).length;
  const hottestToday = events.find((e) => new Date(e.detected_at).toDateString() === new Date().toDateString()) ?? null;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-2">
        <button onClick={() => navigate("/dashboard")} className="p-2 -ms-2 text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </button>
        <div className="flex items-center gap-2">
          <img src={logoSquare} alt="Spy-Secret" className="h-6 w-6" />
          <span className="text-sm font-extrabold text-foreground">Spy<span className="text-primary">Secret</span></span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (!canUseStats) { showPaywall("stats"); return; }
              setShowInsights(!showInsights);
            }}
            className="p-2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <BarChart3 className="h-5 w-5" />
          </button>
          <button onClick={handleDelete} className="p-2 -me-2 text-destructive min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mini Dashboard – Welcome + Today's Activity */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mb-4 native-card p-4 overflow-hidden relative"
      >
        <div className="absolute top-0 end-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
            {t("profile_detail.agent_report")}
          </p>
          <h2 className="text-lg font-extrabold text-foreground mb-3">
            {t("dashboard.hello")}, {spyName} 🕵️
          </h2>

          <div className="flex gap-3 mb-3">
            <div className="flex-1 rounded-xl bg-primary/10 p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Eye className="h-3.5 w-3.5 text-primary" />
                <span className="text-lg font-extrabold text-foreground tabular-nums">{todayFollows}</span>
              </div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase">{t("profile_detail.new_today")}</p>
            </div>
            <div className="flex-1 rounded-xl bg-destructive/10 p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                <span className="text-lg font-extrabold text-foreground tabular-nums">{todayUnfollows}</span>
              </div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase">{t("profile_detail.unfollows_today")}</p>
            </div>
            <div className="flex-1 rounded-xl bg-accent/10 p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Flame className="h-3.5 w-3.5 text-accent" />
                <span className="text-lg font-extrabold text-foreground tabular-nums">{suspicionAnalysis.overallScore}</span>
              </div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase">{t("profile_detail.suspicion")}</p>
            </div>
          </div>

          {hottestToday ? (
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
              <span className="text-sm">🔥</span>
              <p className="text-[12px] text-foreground font-semibold flex-1">
                {t("profile_detail.hottest_activity")}: <span className="text-primary">@{hottestToday.target_username}</span>
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <span className="text-sm">😴</span>
              <p className="text-[12px] text-muted-foreground">{t("profile_detail.no_activity_today")}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-col items-center px-4 py-3">
        {/* Avatar with gradient ring */}
        <div className="avatar-ring p-[3px] mb-3">
          <div className="rounded-full bg-background p-[2px]">
            <InstagramAvatar src={profile.avatar_url} alt={profile.username} fallbackInitials={profile.username} size={80} />
          </div>
        </div>
        <a
          href={`https://instagram.com/${profile.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-extrabold text-foreground hover:text-primary transition-colors"
        >
          @{profile.username}
        </a>
        {profile.display_name && (
          <p className="text-[13px] text-muted-foreground mt-0.5">{profile.display_name}</p>
        )}
        <p className="text-[11px] text-muted-foreground mt-1">
          {t("profile_detail.tracking_since", { date: new Date(profile.created_at).toLocaleDateString() })}
        </p>
        <div className="mt-1">
          <ScanStatus lastScannedAt={profile.last_scanned_at} />
        </div>
      </motion.div>

      {/* Stats pills */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="px-4 flex gap-3 justify-center mb-4">
        <div className="native-card px-5 py-3 text-center flex-1">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-xl font-extrabold tabular-nums">{(profile.follower_count ?? 0).toLocaleString()}</span>
            {followerDelta !== null && followerDelta !== 0 && (
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${followerDelta > 0 ? "text-brand-green" : "text-destructive"}`}>
                {followerDelta > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {followerDelta > 0 ? `+${followerDelta}` : followerDelta}
              </span>
            )}
          </div>
          <p className="text-[10px] font-medium text-muted-foreground">{t("dashboard.followers")}</p>
        </div>
        <div className="native-card px-5 py-3 text-center flex-1">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-xl font-extrabold tabular-nums">{(profile.following_count ?? 0).toLocaleString()}</span>
            {followingDelta !== null && followingDelta !== 0 && (
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${followingDelta > 0 ? "text-brand-green" : "text-destructive"}`}>
                {followingDelta > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {followingDelta > 0 ? `+${followingDelta}` : followingDelta}
              </span>
            )}
          </div>
          <p className="text-[10px] font-medium text-muted-foreground">{t("dashboard.following")}</p>
        </div>
      </motion.div>

      {/* Suspicion Meter */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="px-4 mb-4 relative">
        {!canUseStats && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl">
            <button onClick={() => showPaywall("stats")} className="gradient-pink text-primary-foreground text-[12px] font-bold px-5 py-2.5 rounded-full shadow-lg flex items-center gap-1.5 z-10">
              <Lock className="h-3.5 w-3.5" /> {t("profile_detail.pro_required")}
            </button>
          </div>
        )}
        <div className={!canUseStats ? "blur-md pointer-events-none" : ""}>
          <SuspicionMeter analysis={suspicionAnalysis} weeklyScores={weeklyScores} />
        </div>
      </motion.div>

      {/* Insights Panel */}
      <AnimatePresence>
        {showInsights && canUseStats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 mb-4 space-y-3 overflow-hidden"
          >
            <ActivityHeatmap events={events} />
            <GenderBreakdownChart events={events} />
            <WeeklyActivityChart events={events} />

            {/* "Needs time" message */}
            {profile.created_at && (Date.now() - new Date(profile.created_at).getTime()) < 30 * 24 * 60 * 60 * 1000 && (
              <div className="native-card p-4 flex items-center gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <p className="text-[12px] font-semibold text-foreground">{t("insights.needs_time")}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t("insights.tracking_for_days", {
                      days: Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (24 * 60 * 60 * 1000)),
                    })}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan Button */}
      <div className="px-4 mb-3">
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="w-full pill-btn-primary py-3.5 justify-center text-[14px] min-h-[44px] disabled:opacity-50 active:scale-[0.98] transition-transform"
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

      {/* Unfollow Check Button */}
      <div className="px-4 mb-5">
        <UnfollowCheckButton profileId={id!} />
      </div>

      {/* Segmented Control */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="px-4">
        <div className="segmented-control mb-4">
          <button
            onClick={() => setMainTab("followed")}
            className={mainTab === "followed" ? "segmented-control-active" : "segmented-control-inactive"}
          >
            {t("profile.followed")} ({followingNewEvents.length})
          </button>
          <button
            onClick={() => {
              if (!canUseUnfollows) { showPaywall("unfollows"); return; }
              setMainTab("unfollowed");
            }}
            className={`${mainTab === "unfollowed" ? "segmented-control-active" : "segmented-control-inactive"} flex items-center justify-center gap-1`}
          >
            {!canUseUnfollows && <Lock className="h-3 w-3" />}
            {t("profile.unfollowed")} ({unfollowedEvents.length})
          </button>
        </div>

        {/* Empty state for unfollowed tab - first scan */}
        {mainTab === "unfollowed" && isFirstScanPhase && displayEvents.length === 0 ? (
          <div className="native-card p-5 text-center">
            <Info className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="text-[14px] font-bold text-foreground mb-1">{t("profile.unfollowedEmptyTitle")}</h3>
            <p className="text-[12px] text-muted-foreground">{t("profile.unfollowedEmptyDesc")}</p>
          </div>
        ) : (
          /* Event list */
          <div className="space-y-2">
            {displayEvents.length > 0 ? displayEvents.map((event, i) => {
              const ev = event as Record<string, unknown>;
              const genderTag = ev.gender_tag as string | undefined;
              const isMutual = ev.is_mutual as boolean | undefined;
              const category = ev.category as string | undefined;
              const followerCount = ev.target_follower_count as number | undefined;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="native-card p-3.5 flex items-center gap-3"
                >
                  <div className={`relative flex-shrink-0 ${shouldBlur ? "blur-md" : ""}`}>
                    <InstagramAvatar src={event.target_avatar_url} alt={event.target_username} fallbackInitials={event.target_username} size={44} />
                    {genderTag && genderTag !== "unknown" && (
                      <div className={`absolute -bottom-0.5 -end-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[8px] text-white ${genderTag === "female" ? "gradient-pink" : "bg-blue-500"}`}>
                        {genderTag === "female" ? "♀" : "♂"}
                      </div>
                    )}
                  </div>
                  <div className={`flex-1 min-w-0 ${shouldBlur ? "blur-md" : ""}`}>
                    <a
                      href={`https://instagram.com/${event.target_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-bold text-foreground hover:text-primary transition-colors"
                    >
                      @{event.target_username}
                    </a>
                    {event.target_display_name && (
                      <p className="text-[11px] text-muted-foreground truncate">{event.target_display_name}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {isMutual && <span className="tag-red text-[8px]">🔄 {t("events.mutual")}</span>}
                      {category === "influencer" && <span className="tag-yellow text-[8px]">⭐ {followerCount ? formatCount(followerCount) : ""}</span>}
                      {category === "celebrity" && <span className="tag-yellow text-[8px]">👑</span>}
                      {category === "private" && <span className="tag-muted text-[8px]">🔒</span>}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo(event.detected_at)}</span>
                  {shouldBlur && (
                    <button
                      onClick={() => showPaywall("blur")}
                      className="absolute inset-0 flex items-center justify-center rounded-2xl"
                    >
                      <span className="gradient-pink text-primary-foreground text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                        <Lock className="h-3 w-3 inline me-1" />{t("events.upgrade_to_reveal")}
                      </span>
                    </button>
                  )}
                </motion.div>
              );
            }) : (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">{mainTab === "unfollowed" ? "🔍" : "✨"}</span>
                <p className="text-[13px] text-muted-foreground">{mainTab === "unfollowed" ? t("profile_detail.no_gone_events") : t("profile_detail.no_new_events")}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{profile.last_scanned_at ? t("profile_detail.will_update") : t("profile_detail.start_scan")}</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default ProfileDetail;
