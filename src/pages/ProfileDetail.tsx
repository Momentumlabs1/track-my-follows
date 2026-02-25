import { useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trash2, Loader2, RefreshCw, TrendingUp, TrendingDown, Lock, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logoSquare from "@/assets/logo-square.png";
import { ScanStatus } from "@/components/ScanStatus";
import { useTrackedProfiles, useFollowEvents, useDeleteTrackedProfile } from "@/hooks/useTrackedProfiles";
import { useFollowerEvents } from "@/hooks/useFollowerEvents";
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

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

type TabId = "new_follows" | "new_followers" | "unfollowed" | "insights";

function GenderCard({ genderStats }: { genderStats: { female: number; male: number; unknown: number; total: number; femalePercent: number } }) {
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
  const { plan, canUseUnfollows, shouldBlur, showPaywall, canUseStats } = useSubscription();
  const { user } = useAuth();
  const tabsRef = useRef<HTMLDivElement>(null);

  const { data: profiles = [], isLoading: profilesLoading } = useTrackedProfiles();
  const { data: followEvents = [], isLoading: eventsLoading } = useFollowEvents(id);
  const { data: followerEvents = [] } = useFollowerEvents(id);
  const { data: followings = [] } = useProfileFollowings(id);
  const deleteProfile = useDeleteTrackedProfile();

  const profile = profiles.find((p) => p.id === id);
  const isLoading = profilesLoading || eventsLoading;

  const suspicionAnalysis = analyzeSuspicion(
    followEvents, followings, profile?.follower_count ?? 0, profile?.following_count ?? 0, t,
  );

  const weeklyScores = useMemo(() => Array.from({ length: 4 }, (_, i) => {
    const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekEvents = followEvents.filter((e) => {
      const d = new Date(e.detected_at);
      return d >= weekStart && d < weekEnd;
    });
    return analyzeSuspicion(weekEvents, [], profile?.follower_count ?? 0, profile?.following_count ?? 0).overallScore;
  }).reverse(), [followEvents, profile]);

  const isFreeAndScanned = plan === "free" && profile?.initial_scan_done === true;

  // Event lists
  const newFollowEvents = useMemo(() =>
    followEvents
      .filter((e) => e.event_type === "follow" || e.event_type === "new_following")
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()),
    [followEvents]);

  const newFollowerEventsList = useMemo(() =>
    followerEvents
      .filter((e) => e.event_type === "gained")
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()),
    [followerEvents]);

  const unfollowedByThem = useMemo(() =>
    followEvents
      .filter((e) => e.event_type === "unfollow" || e.event_type === "unfollowed")
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

  // Follower/following deltas
  const followerDelta = profile?.previous_follower_count != null
    ? (profile.follower_count ?? 0) - profile.previous_follower_count : null;
  const followingDelta = profile?.previous_following_count != null
    ? (profile.following_count ?? 0) - profile.previous_following_count : null;

  const tabs = [
    { id: "new_follows" as TabId, label: t("profile.follows_new", "Folgt neu"), count: newFollowEvents.length, icon: "💘", locked: false },
    { id: "new_followers" as TabId, label: t("profile.new_followers", "Neue Follower"), count: newFollowerEventsList.length, icon: "👥", locked: false },
    { id: "unfollowed" as TabId, label: t("profile.unfollowed_tab", "Entfolgt"), count: unfollowedByThem.length + lostFollowerEvents.length, icon: "💔", locked: plan !== "pro" },
    { id: "insights" as TabId, label: t("profile.insights_tab", "Insights"), count: null, icon: "📊", locked: plan !== "pro" },
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
          <img src={logoSquare} alt="" className="h-5 w-5 opacity-60" />
          <span className="text-[13px] font-bold text-muted-foreground">@{profile.username}</span>
        </div>
        <div className="flex items-center gap-0">
          <button
            onClick={handleScan}
            disabled={isScanning}
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
          {/* Avatar centered */}
          <div className="flex flex-col items-center mb-4">
            <div className="avatar-ring p-[2.5px]">
              <div className="rounded-full bg-background p-[2px]">
                <InstagramAvatar src={profile.avatar_url} alt={profile.username} fallbackInitials={profile.username} size={72} />
              </div>
            </div>
            <p className="text-[15px] font-bold text-foreground mt-2">@{profile.username}</p>
            {profile.display_name && (
              <p className="text-[12px] text-muted-foreground">{profile.display_name}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <ScanStatus lastScannedAt={profile.last_scanned_at} />
              <span className="text-[10px] text-muted-foreground">
                · {t("profile_detail.tracking_since", { date: new Date(profile.created_at).toLocaleDateString() })}
              </span>
            </div>
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

      {/* Gender Breakdown */}
      {suspicionAnalysis.genderStats.total > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="px-4 mb-4">
          <GenderCard genderStats={suspicionAnalysis.genderStats} />
        </motion.div>
      )}

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

      {/* Scrollable Tab Chips */}
      <div ref={tabsRef} className="px-4 mb-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.locked) { showPaywall(tab.id === "unfollowed" ? "unfollows" : "stats"); return; }
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
              {tab.locked && <Lock className="h-3 w-3" />}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div className="px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={activeTab}>
        {activeTab === "new_follows" && (
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
          />
        )}

        {activeTab === "new_followers" && (
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
          />
        )}

        {activeTab === "unfollowed" && (
          <div className="space-y-4">
            {/* Auto-detection info banner */}
            <div className="native-card p-3 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t("profile.unfollows_detected_automatically", "Entfolgungen werden automatisch alle 4 Stunden geprüft. Tracking aktiv seit")} {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Section: Unfollowed by them */}
            {unfollowedByThem.length > 0 && (
              <div>
                <p className="section-header px-1 mb-2">{t("profile.unfollowed_by_them", "Hat entfolgt")}</p>
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

            {/* Section: Lost followers */}
            {lostFollowerEvents.length > 0 && (
              <div>
                <p className="section-header px-1 mb-2">{t("profile.lost_followers_title", "Follower verloren")}</p>
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
                      badge={<span className="text-[8px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full font-bold">↓</span>}
                    />
                  ))}
                </div>
              </div>
            )}

            {unfollowedByThem.length === 0 && lostFollowerEvents.length === 0 && (
              <div className="native-card p-5 text-center">
                <span className="text-4xl block mb-3">✨</span>
                <p className="text-[13px] font-bold text-foreground mb-1">{t("profile.no_unfollows_yet", "Noch keine Entfolgungen erkannt")}</p>
                <p className="text-[11px] text-muted-foreground">{t("profile.unfollows_auto_detected", "Entfolgungen werden automatisch erkannt")}</p>
              </div>
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

// ── Event List (for new follows / new followers tabs) ──
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
  events, shouldBlur, showPaywall, timeAgo, emptyIcon, emptyText, emptySubText,
}: {
  events: EventItem[];
  shouldBlur: boolean;
  showPaywall: (t: string) => void;
  timeAgo: (d: string | null) => string;
  emptyIcon: string;
  emptyText: string;
  emptySubText: string;
}) {
  const { t } = useTranslation();

  if (events.length === 0) {
    return (
      <div className="native-card p-5 text-center">
        <span className="text-4xl block mb-3">{emptyIcon}</span>
        <p className="text-[13px] text-muted-foreground">{emptyText}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{emptySubText}</p>
      </div>
    );
  }

  return (
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
  );
}

export default ProfileDetail;
