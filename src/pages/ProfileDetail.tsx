import { useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trash2, Loader2, RefreshCw, TrendingUp, TrendingDown, Lock, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UnfollowCheckButton } from "@/components/UnfollowCheckButton";
import { useAuth } from "@/contexts/AuthContext";
import logoSquare from "@/assets/logo-square.png";
import { SpyIcon } from "@/components/SpyIcon";
import { ScanStatus } from "@/components/ScanStatus";
import { useTrackedProfiles, useFollowEvents, useDeleteTrackedProfile } from "@/hooks/useTrackedProfiles";
import { useFollowerEvents } from "@/hooks/useFollowerEvents";
import { useProfileFollowings } from "@/hooks/useProfileFollowings";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SuspicionMeter } from "@/components/SuspicionMeter";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { GenderBreakdownChart } from "@/components/GenderBreakdownChart";
import { WeeklyActivityChart } from "@/components/WeeklyActivityChart";
import { SpyRequiredOverlay } from "@/components/SpyRequiredOverlay";
import { MoveSpySheet } from "@/components/MoveSpySheet";
import { analyzeSuspicion } from "@/lib/suspicionAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useMoveSpy } from "@/hooks/useSpyProfile";
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

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

type TabId = "new_follows" | "new_followers" | "unfollowed" | "insights";

function GenderCard({ genderStats, profile }: { genderStats: { female: number; male: number; unknown: number; total: number; femalePercent: number }; profile?: Record<string, unknown> }) {
  const { t } = useTranslation();
  const malePercent = genderStats.total > 0 ? 100 - genderStats.femalePercent : 0;
  const getVerdict = () => {
    if (genderStats.femalePercent > 70) return t("simple.mostly_women");
    if (genderStats.femalePercent < 40) return t("simple.mostly_men");
    return t("simple.balanced");
  };
  return (
    <div className="native-card p-4">
      <p className="section-header mb-3">{t("simple.who_they_follow")}</p>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xl font-extrabold text-primary">♀ {genderStats.femalePercent}%</span>
          <span className="text-[11px] text-muted-foreground">{genderStats.female}</span>
        </div>
        <div className="flex-1 flex items-center justify-end gap-2">
          <span className="text-[11px] text-muted-foreground">{genderStats.male}</span>
          <span className="text-xl font-extrabold text-blue-400">♂ {malePercent}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden flex bg-muted">
        <motion.div className="h-full gradient-pink" initial={{ width: 0 }} animate={{ width: `${genderStats.femalePercent}%` }} transition={{ duration: 0.8, delay: 0.3 }} />
        <motion.div className="h-full bg-blue-400" initial={{ width: 0 }} animate={{ width: `${malePercent}%` }} transition={{ duration: 0.8, delay: 0.4 }} />
      </div>
      <p className="text-[12px] font-medium text-muted-foreground mt-2.5 text-center">{getVerdict()}</p>
      {genderStats.unknown > 0 && (
        <p className="text-[10px] text-muted-foreground/60 mt-0.5 text-center">{t("suspicion.not_detected", { count: genderStats.unknown })}</p>
      )}
      {/* Confidence Badge */}
      {(() => {
        const confidence = profile?.gender_confidence as string | undefined;
        const sampleSize = (profile?.gender_sample_size as number) || 0;
        const totalFollowing = (profile?.following_count as number) || 0;
        if (!confidence || confidence === "unknown") return null;
        const config: Record<string, { emoji: string; color: string; bg: string; label: string }> = {
          high: { emoji: "🕵️", color: "text-green-400", bg: "bg-green-400/10", label: t("gender.confidence_high") },
          medium: { emoji: "🕵️", color: "text-yellow-400", bg: "bg-yellow-400/10", label: t("gender.confidence_medium") },
          low: { emoji: "🕵️😵‍💫", color: "text-destructive", bg: "bg-destructive/10", label: t("gender.confidence_low") },
        };
        const c = config[confidence];
        if (!c) return null;
        return (
          <div className={`mt-3 flex items-center gap-2 rounded-lg ${c.bg} px-3 py-2`}>
            <span className="text-sm">{c.emoji}</span>
            <div>
              <p className={`text-[11px] font-bold ${c.color}`}>{c.label}</p>
              <p className="text-[9px] text-muted-foreground">
                {t("gender.based_on_sample", { count: sampleSize, total: totalFollowing })}
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

const ProfileDetail = () => {
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("new_follows");
  const [isScanning, setIsScanning] = useState(false);
  const [moveSpyOpen, setMoveSpyOpen] = useState(false);
  const { plan, canUseUnfollows, shouldBlur, showPaywall, canUseStats } = useSubscription();
  const { user } = useAuth();
  const tabsRef = useRef<HTMLDivElement>(null);
  const moveSpy = useMoveSpy();

  const { data: profiles = [], isLoading: profilesLoading } = useTrackedProfiles();
  const { data: followEvents = [], isLoading: eventsLoading } = useFollowEvents(id);
  const { data: followerEvents = [] } = useFollowerEvents(id);
  const { data: followings = [] } = useProfileFollowings(id);
  const deleteProfile = useDeleteTrackedProfile();

  const profile = profiles.find((p) => p.id === id);
  const hasSpy = profile?.has_spy === true;
  const isLoading = profilesLoading || eventsLoading;
  const isPro = plan === "pro";

  const followingDirectionEvents = useMemo(() =>
    followEvents.filter((e) => (e as Record<string, unknown>).direction === "following"),
    [followEvents]);

  const suspicionAnalysis = analyzeSuspicion(
    followingDirectionEvents, followings, profile?.follower_count ?? 0, profile?.following_count ?? 0, t,
  );

  const weeklyScores = useMemo(() => Array.from({ length: 4 }, (_, i) => {
    const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekEvents = followingDirectionEvents.filter((e) => {
      const d = new Date(e.detected_at);
      return d >= weekStart && d < weekEnd;
    });
    return analyzeSuspicion(weekEvents, [], profile?.follower_count ?? 0, profile?.following_count ?? 0).overallScore;
  }).reverse(), [followingDirectionEvents, profile]);

  const isFreeAndScanned = plan === "free" && profile?.initial_scan_done === true;

  // Event lists
  const newFollowEvents = useMemo(() =>
    followEvents
      .filter((e) => (e.event_type === "follow" || e.event_type === "new_following") && !(e as Record<string, unknown>).is_initial && (e as Record<string, unknown>).direction === "following")
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()),
    [followEvents]);

  const initialFollowEvents = useMemo(() =>
    followEvents
      .filter((e) => (e.event_type === "follow" || e.event_type === "new_following") && (e as Record<string, unknown>).is_initial === true && (e as Record<string, unknown>).direction === "following")
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()),
    [followEvents]);

  const newFollowerEventsList = useMemo(() =>
    followerEvents
      .filter((e) => e.event_type === "gained" && !e.is_initial)
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()),
    [followerEvents]);

  const initialFollowerEventsList = useMemo(() =>
    followerEvents
      .filter((e) => e.event_type === "gained" && e.is_initial === true)
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()),
    [followerEvents]);

  const unfollowedByThem = useMemo(() =>
    followEvents
      .filter((e) => (e.event_type === "unfollow" || e.event_type === "unfollowed") && (e as Record<string, unknown>).direction === "following")
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()),
    [followEvents]);

  const lostFollowerEvents = useMemo(() =>
    followerEvents
      .filter((e) => e.event_type === "lost")
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()),
    [followerEvents]);

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
      queryClient.invalidateQueries({ queryKey: ["follower_events"] });
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

  const handleAssignSpy = () => {
    if (!id) return;
    moveSpy.mutate(id);
  };

  // Follower/following deltas
  const followerDelta = (profile?.previous_follower_count != null && profile.previous_follower_count > 0)
    ? (profile.follower_count ?? 0) - profile.previous_follower_count : null;
  const followingDelta = (profile?.previous_following_count != null && profile.previous_following_count > 0)
    ? (profile.following_count ?? 0) - profile.previous_following_count : null;

  // Tab lock logic: Free = paywall, Pro without spy = spy required
  const getTabLock = (tabId: TabId): { locked: boolean; lockType: "paywall" | "spy" | null } => {
    if (tabId === "new_follows") {
      return { locked: plan === "free", lockType: plan === "free" ? "paywall" : null };
    }
    if (plan === "free") return { locked: true, lockType: "paywall" };
    if (!hasSpy) return { locked: true, lockType: "spy" };
    return { locked: false, lockType: null };
  };

  const tabs = [
    { id: "new_follows" as TabId, label: t("profile.follows_new", "Folgt neu"), count: newFollowEvents.length, icon: "💘", ...getTabLock("new_follows") },
    { id: "new_followers" as TabId, label: t("profile.new_followers", "Neue Follower"), count: newFollowerEventsList.length, icon: "👥", ...getTabLock("new_followers") },
    { id: "unfollowed" as TabId, label: t("profile.unfollowed_tab", "Entfolgt"), count: unfollowedByThem.length + lostFollowerEvents.length, icon: "💔", ...getTabLock("unfollowed") },
    { id: "insights" as TabId, label: t("profile.insights_tab", "Insights"), count: null, icon: "📊", ...getTabLock("insights") },
  ];

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

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-2">
        <button onClick={() => navigate("/dashboard")} className="p-2 -ms-2 text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </button>
        <div className="flex items-center gap-2">
          {hasSpy && <SpyIcon size={22} glow />}
          <span className="text-[13px] font-bold text-muted-foreground">@{profile.username}</span>
        </div>
        <div className="flex items-center gap-0">
          <button
            onClick={handleScan}
            disabled={isScanning || profile.is_private}
            className="p-2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
          >
            {isScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          </button>
          <button onClick={handleDelete} className="p-2 -me-2 text-muted-foreground hover:text-destructive min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 pt-2 pb-4">
        <div className="native-card p-5">
          {/* Avatar centered with spy badge */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative">
              <div className="avatar-ring p-[2.5px]">
                <div className="rounded-full bg-background p-[2px]">
                  <InstagramAvatar src={profile.avatar_url} alt={profile.username} fallbackInitials={profile.username} size={72} />
                </div>
              </div>
              {hasSpy && (
                <div className="absolute -top-2 -end-2"><SpyIcon size={32} glow /></div>
              )}
            </div>
            <p className="text-[15px] font-bold text-foreground mt-2">@{profile.username}</p>
            {profile.display_name && (
              <p className="text-[12px] text-muted-foreground">{profile.display_name}</p>
            )}
            {/* Status label */}
            {hasSpy ? (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-semibold text-green-400">{t("spy.spy_active")} · {t("spy.every_hour")}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-1">
                <ScanStatus lastScannedAt={profile.last_scanned_at} />
                <span className="text-[10px] text-muted-foreground">
                  · {t("profile_detail.tracking_since", { date: new Date(profile.created_at).toLocaleDateString() })}
                </span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="native-card p-3 text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-xl font-extrabold tabular-nums">{formatCount(profile.follower_count ?? 0)}</span>
                {followerDelta !== null && followerDelta !== 0 && (
                  <span className={`text-[10px] font-bold flex items-center ${followerDelta > 0 ? "text-brand-green" : "text-destructive"}`}>
                    {followerDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {followerDelta > 0 ? "+" : ""}{followerDelta}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">{t("dashboard.followers")}</p>
            </div>
            <div className="native-card p-3 text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-xl font-extrabold tabular-nums">{formatCount(profile.following_count ?? 0)}</span>
                {followingDelta !== null && followingDelta !== 0 && (
                  <span className={`text-[10px] font-bold flex items-center ${followingDelta > 0 ? "text-brand-green" : "text-destructive"}`}>
                    {followingDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {followingDelta > 0 ? "+" : ""}{followingDelta}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">{t("dashboard.following")}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Assign Spy CTA (Pro without Spy) */}
      {isPro && !hasSpy && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="px-4 mb-4">
          <button
            onClick={() => setMoveSpyOpen(true)}
            className="w-full native-card p-4 border border-dashed border-primary/30 flex items-center gap-3"
          >
            <SpyIcon size={40} glow />
            <div className="flex-1 text-start">
              <p className="text-[13px] font-bold text-foreground">{t("spy.assign_spy_here")}</p>
              <p className="text-[11px] text-muted-foreground">{t("spy.spy_required_description")}</p>
            </div>
          </button>
        </motion.div>
      )}

      {/* Private account banner */}
      {profile.is_private && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="px-4 mb-4">
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <Lock className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-destructive">
                {profile.initial_scan_done ? t("private_frozen") : t("private_cannot_track")}
              </p>
              {profile.initial_scan_done && (
                <p className="text-[11px] text-muted-foreground mt-0.5">{t("private_frozen_subtitle")}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Baseline running indicator */}
      {!profile.baseline_complete && !profile.is_private && (profile.gender_sample_size === 0 || profile.gender_sample_size === null) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="px-4 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
            <Loader2 className="w-3 h-3 animate-spin text-accent" />
            <span className="text-accent text-xs">{t("gender_analysis_running")}</span>
          </div>
        </motion.div>
      )}

      {/* Gender Breakdown - only show for profiles that follow others */}
      {(profile.following_count ?? 0) > 0 && suspicionAnalysis.genderStats.total > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="px-4 mb-4">
          <GenderCard genderStats={suspicionAnalysis.genderStats} profile={profile as unknown as Record<string, unknown>} />
        </motion.div>
      )}

      {/* Suspicion Meter - only show for profiles that follow others */}
      {(profile.following_count ?? 0) > 0 && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="px-4 mb-4 relative">
        {(!canUseStats || (!hasSpy && isPro)) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl">
            {!isPro ? (
              <button onClick={() => showPaywall("stats")} className="gradient-pink text-primary-foreground text-[12px] font-bold px-5 py-2.5 rounded-full shadow-lg flex items-center gap-1.5 z-10">
                <Lock className="h-3.5 w-3.5" /> {t("profile_detail.pro_required")}
              </button>
            ) : (
              <button onClick={() => setMoveSpyOpen(true)} className="bg-primary/90 text-primary-foreground text-[12px] font-bold px-5 py-2.5 rounded-full shadow-lg flex items-center gap-1.5 z-10">
                <SpyIcon size={14} /> {t("spy.spy_required")}
              </button>
            )}
          </div>
        )}
        <div className={(!canUseStats || (!hasSpy && isPro)) ? "blur-md pointer-events-none" : ""}>
          <SuspicionMeter analysis={suspicionAnalysis} weeklyScores={weeklyScores} />
        </div>
      </motion.div>}

      {/* Scrollable Tab Chips */}
      <div ref={tabsRef} className="px-4 mb-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.locked) {
                  if (tab.lockType === "paywall") showPaywall(tab.id === "unfollowed" ? "unfollows" : "stats");
                  else if (tab.lockType === "spy") setMoveSpyOpen(true);
                  return;
                }
                setActiveTab(tab.id);
              }}
              className={`flex-shrink-0 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 flex items-center gap-1.5 min-h-[40px] ${
                activeTab === tab.id
                  ? "gradient-pink text-primary-foreground shadow-lg"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
                  activeTab === tab.id ? "bg-primary-foreground/20" : "bg-foreground/10"
                }`}>
                  {tab.count}
                </span>
              )}
              {tab.locked && (
                <span className="text-[10px]">
                  {tab.lockType === "paywall" ? "🔒" : <SpyIcon size={12} />}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div className="px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={activeTab}>
        {activeTab === "new_follows" && (
          <div className="space-y-4">
            {/* Real new events */}
            <EventList
              events={newFollowEvents.map((e) => ({
                id: e.id,
                username: e.target_username,
                displayName: e.target_display_name,
                avatarUrl: e.target_avatar_url,
                detectedAt: e.detected_at,
                isRead: e.is_read,
                genderTag: (e as Record<string, unknown>).gender_tag as string | undefined,
                isMutual: (e as Record<string, unknown>).is_mutual as boolean | undefined,
                category: (e as Record<string, unknown>).category as string | undefined,
                followerCount: (e as Record<string, unknown>).target_follower_count as number | undefined,
              }))}
              shouldBlur={shouldBlur}
              showPaywall={showPaywall}
              timeAgo={timeAgo}
              emptyIcon="✨"
              emptyText={t("profile_detail.no_new_events")}
              emptySubText={profile.last_scanned_at ? t("profile_detail.will_update") : t("profile_detail.start_scan")}
              sectionTitle={initialFollowEvents.length > 0 && newFollowEvents.length > 0 ? t("recently_detected") : undefined}
            />
            {/* Initial snapshot events */}
            {initialFollowEvents.length > 0 && (
              <div>
                <p className="section-header px-1 mb-2 text-muted-foreground">{t("existing_at_first_scan")}</p>
                <EventList
                  events={initialFollowEvents.map((e) => ({
                    id: e.id,
                    username: e.target_username,
                    displayName: e.target_display_name,
                    avatarUrl: e.target_avatar_url,
                    detectedAt: e.detected_at,
                    isRead: true,
                    genderTag: (e as Record<string, unknown>).gender_tag as string | undefined,
                    category: (e as Record<string, unknown>).category as string | undefined,
                    followerCount: (e as Record<string, unknown>).target_follower_count as number | undefined,
                  }))}
                  shouldBlur={shouldBlur}
                  showPaywall={showPaywall}
                  timeAgo={() => t("initial_scan_label")}
                  emptyIcon="✨"
                  emptyText=""
                  emptySubText=""
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "new_followers" && (
          <div className="space-y-4">
            <EventList
              events={newFollowerEventsList.map((e) => ({
                id: e.id,
                username: e.username,
                displayName: e.full_name,
                avatarUrl: e.profile_pic_url,
                detectedAt: e.detected_at,
                isRead: e.is_read,
                genderTag: e.gender_tag || undefined,
                category: e.category || undefined,
                followerCount: e.follower_count || undefined,
              }))}
              shouldBlur={shouldBlur}
              showPaywall={showPaywall}
              timeAgo={timeAgo}
              emptyIcon="👥"
              emptyText={t("profile_detail.no_new_followers", "Noch keine neuen Follower erkannt")}
              emptySubText={profile.last_scanned_at ? t("profile_detail.will_update") : t("profile_detail.start_scan")}
              sectionTitle={initialFollowerEventsList.length > 0 && newFollowerEventsList.length > 0 ? t("recently_detected") : undefined}
            />
            {initialFollowerEventsList.length > 0 && (
              <div>
                <p className="section-header px-1 mb-2 text-muted-foreground">{t("existing_at_first_scan")}</p>
                <EventList
                  events={initialFollowerEventsList.map((e) => ({
                    id: e.id,
                    username: e.username,
                    displayName: e.full_name,
                    avatarUrl: e.profile_pic_url,
                    detectedAt: e.detected_at,
                    isRead: true,
                    genderTag: e.gender_tag || undefined,
                    category: e.category || undefined,
                    followerCount: e.follower_count || undefined,
                  }))}
                  shouldBlur={shouldBlur}
                  showPaywall={showPaywall}
                  timeAgo={() => t("initial_scan_label")}
                  emptyIcon="👥"
                  emptyText=""
                  emptySubText=""
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "unfollowed" && (
          <div className="space-y-3">
            {/* Unfollow Hint Banner */}
            {(profile.pending_unfollow_hint ?? 0) > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 6 }} 
                animate={{ opacity: 1, y: 0 }}
                className="native-card p-3.5 border border-destructive/25 bg-destructive/5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-destructive/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">⚠️</span>
                  </div>
                  <div>
                    <span className="text-[12px] font-bold text-destructive">
                      ~{profile.pending_unfollow_hint} {t("spy.unfollows_detected")}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {t("spy.unfollow_hint_explanation")}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Spy Scan CTA */}
            {hasSpy && (
              <UnfollowCheckButton profileId={profile.id} />
            )}

            {/* Info banner - compact */}
            <div className="flex items-center gap-2 px-1">
              <Info className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                {t("profile.unfollows_detected_automatically")} {new Date(profile.created_at).toLocaleDateString()}
                {hasSpy && <> · 🕵️ {t("unfollow_check.spy_hint", "2× täglich manueller Scan")}</>}
              </p>
            </div>

            {/* Unfollowed by them */}
            {unfollowedByThem.length > 0 && (
              <div>
                <p className="section-header px-1 mb-2 flex items-center gap-1.5">
                  <span className="text-destructive">🚩</span> {t("profile.unfollowed_by_them")}
                  <span className="text-[10px] bg-destructive/15 text-destructive px-1.5 py-0.5 rounded-full font-bold tabular-nums">{unfollowedByThem.length}</span>
                </p>
                <div className="native-card overflow-hidden">
                  {unfollowedByThem.map((e, i) => (
                    <EventRow
                      key={e.id}
                      username={e.target_username}
                      displayName={e.target_display_name}
                      avatarUrl={e.target_avatar_url}
                      detectedAt={e.detected_at}
                      timeAgo={timeAgo}
                      index={i}
                      badge={<span className="text-[8px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full font-bold">✕</span>}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Lost followers */}
            {lostFollowerEvents.length > 0 && (
              <div>
                <p className="section-header px-1 mb-2 flex items-center gap-1.5">
                  <span className="text-orange-400">↓</span> {t("profile.lost_followers_title")}
                  <span className="text-[10px] bg-orange-400/15 text-orange-400 px-1.5 py-0.5 rounded-full font-bold tabular-nums">{lostFollowerEvents.length}</span>
                </p>
                <div className="native-card overflow-hidden">
                  {lostFollowerEvents.map((e, i) => (
                    <EventRow
                      key={e.id}
                      username={e.username}
                      displayName={e.full_name}
                      avatarUrl={e.profile_pic_url}
                      detectedAt={e.detected_at}
                      timeAgo={timeAgo}
                      index={i}
                      badge={<span className="text-[8px] bg-orange-400/20 text-orange-400 px-1.5 py-0.5 rounded-full font-bold">↓</span>}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {unfollowedByThem.length === 0 && lostFollowerEvents.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="native-card p-6 text-center"
              >
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-muted mb-3">
                  <span className="text-2xl">✨</span>
                </div>
                <p className="text-[14px] font-bold text-foreground mb-1">{t("profile.no_unfollows_yet")}</p>
                <p className="text-[11px] text-muted-foreground max-w-[200px] mx-auto">{t("profile.unfollows_auto_detected")}</p>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === "insights" && (
          <div className="space-y-3">
            <ActivityHeatmap events={followEvents} />
            <GenderBreakdownChart events={followEvents} />
            <WeeklyActivityChart events={followEvents} />
            {profile.created_at && (Date.now() - new Date(profile.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000 && (
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
          </div>
        )}
      </motion.div>

      {/* Move Spy Sheet */}
      <MoveSpySheet
        open={moveSpyOpen}
        onOpenChange={setMoveSpyOpen}
        profiles={profiles}
        currentSpyId={profiles.find((p) => p.has_spy)?.id || null}
        onMove={(profileId) => moveSpy.mutate(profileId)}
      />
    </div>
  );
};

// ── Reusable Event Row ──
function EventRow({
  username, displayName, avatarUrl, detectedAt, timeAgo, index, badge,
}: {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  detectedAt: string;
  timeAgo: (d: string | null) => string;
  index: number;
  badge?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className="native-cell"
    >
      <div className="relative flex-shrink-0">
        <InstagramAvatar src={avatarUrl} alt={username} fallbackInitials={username} size={42} />
        {badge && <div className="absolute -bottom-0.5 -end-0.5">{badge}</div>}
      </div>
      <div className="flex-1 min-w-0">
        <a
          href={`https://instagram.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-bold text-foreground hover:text-primary transition-colors"
        >
          @{username}
        </a>
        {displayName && <p className="text-[11px] text-muted-foreground truncate">{displayName}</p>}
      </div>
      <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo(detectedAt)}</span>
    </motion.div>
  );
}

// ── Event List ──
interface EventItem {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  detectedAt: string;
  isRead?: boolean;
  genderTag?: string;
  isMutual?: boolean;
  category?: string;
  followerCount?: number;
}

function EventList({
  events, shouldBlur, showPaywall, timeAgo, emptyIcon, emptyText, emptySubText, sectionTitle,
}: {
  events: EventItem[];
  shouldBlur: boolean;
  showPaywall: (t: string) => void;
  timeAgo: (d: string | null) => string;
  emptyIcon: string;
  emptyText: string;
  emptySubText: string;
  sectionTitle?: string;
}) {
  const { t } = useTranslation();

  if (events.length === 0 && !sectionTitle) {
    return emptyText ? (
      <div className="native-card p-5 text-center">
        <span className="text-4xl block mb-3">{emptyIcon}</span>
        <p className="text-[13px] text-muted-foreground">{emptyText}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{emptySubText}</p>
      </div>
    ) : null;
  }

  if (events.length === 0) return null;

  return (
    <div>
      {sectionTitle && <p className="section-header px-1 mb-2">{sectionTitle}</p>}
      <div className="native-card overflow-hidden">
      {events.map((event, i) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.02 }}
          className="native-cell relative"
        >
          <div className={`relative flex-shrink-0 ${shouldBlur ? "blur-md" : ""}`}>
            <InstagramAvatar src={event.avatarUrl} alt={event.username} fallbackInitials={event.username} size={42} />
            {event.genderTag && event.genderTag !== "unknown" && (
              <div className={`absolute -bottom-0.5 -end-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[8px] text-white ${event.genderTag === "female" ? "gradient-pink" : "bg-blue-400"}`}>
                {event.genderTag === "female" ? "♀" : "♂"}
              </div>
            )}
          </div>
          <div className={`flex-1 min-w-0 ${shouldBlur ? "blur-md" : ""}`}>
            <div className="flex items-baseline gap-1.5">
              <a
                href={`https://instagram.com/${event.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-bold text-foreground hover:text-primary transition-colors"
              >
                @{event.username}
              </a>
              {!event.isRead && !shouldBlur && (
                <span className="h-1.5 w-1.5 rounded-full gradient-pink flex-shrink-0" />
              )}
            </div>
            {event.displayName && (
              <p className="text-[11px] text-muted-foreground truncate">{event.displayName}</p>
            )}
            <div className="flex flex-wrap gap-1 mt-1">
              {event.isMutual && <span className="tag-red text-[8px]">🔄 {t("events.mutual")}</span>}
              {event.category === "influencer" && <span className="tag-yellow text-[8px]">⭐ {event.followerCount ? formatCount(event.followerCount) : ""}</span>}
              {event.category === "celebrity" && <span className="tag-yellow text-[8px]">👑</span>}
              {event.category === "private" && <span className="tag-muted text-[8px]">🔒</span>}
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo(event.detectedAt)}</span>
          {shouldBlur && (
            <button
              onClick={() => showPaywall("blur")}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="gradient-pink text-primary-foreground text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                <Lock className="h-3 w-3 inline me-1" />{t("events.upgrade_to_reveal")}
              </span>
            </button>
          )}
        </motion.div>
      ))}
      </div>
    </div>
  );
}

export default ProfileDetail;
