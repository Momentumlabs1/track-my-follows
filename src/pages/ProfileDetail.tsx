import { useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Loader2, RefreshCw, TrendingUp, TrendingDown, Lock, Info } from "lucide-react";
import { UnfollowCheckButton } from "@/components/UnfollowCheckButton";
import { useAuth } from "@/contexts/AuthContext";
import { SpyIcon } from "@/components/SpyIcon";
import { ScanStatus } from "@/components/ScanStatus";
import { useTrackedProfiles, useFollowEvents, useDeleteTrackedProfile } from "@/hooks/useTrackedProfiles";
import { useFollowerEvents } from "@/hooks/useFollowerEvents";
import { useProfileFollowings } from "@/hooks/useProfileFollowings";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { InsightsBubbleGrid } from "@/components/InsightsBubbleGrid";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { GenderBreakdownChart } from "@/components/GenderBreakdownChart";
import { WeeklyActivityChart } from "@/components/WeeklyActivityChart";
import { MoveSpySheet } from "@/components/MoveSpySheet";
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
  const isFreeAndScanned = plan === "free" && profile?.initial_scan_done === true;

  const newFollowEvents = useMemo(() =>
    followEvents.filter((e) => (e.event_type === "follow" || e.event_type === "new_following") && !(e as Record<string, unknown>).is_initial && (e as Record<string, unknown>).direction === "following")
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()),
    [followEvents]);

  const initialFollowEvents = useMemo(() =>
    followEvents.filter((e) => (e.event_type === "follow" || e.event_type === "new_following") && (e as Record<string, unknown>).is_initial === true && (e as Record<string, unknown>).direction === "following")
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()),
    [followEvents]);

  const newFollowerEventsList = useMemo(() =>
    followerEvents.filter((e) => e.event_type === "gained" && !e.is_initial)
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()),
    [followerEvents]);

  const initialFollowerEventsList = useMemo(() =>
    followerEvents.filter((e) => e.event_type === "gained" && e.is_initial === true)
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()),
    [followerEvents]);

  const unfollowedByThem = useMemo(() =>
    followEvents.filter((e) => (e.event_type === "unfollow" || e.event_type === "unfollowed") && (e as Record<string, unknown>).direction === "following")
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()),
    [followEvents]);

  const lostFollowerEvents = useMemo(() =>
    followerEvents.filter((e) => e.event_type === "lost")
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
      if (resData?.error === "PAYWALL_REQUIRED") { showPaywall("scan"); }
      else if (resData?.results?.[0]?.error) { toast.error(t("profile_detail.scan_error", { error: resData.results[0].error })); }
      else { toast.success(t("profile_detail.scan_complete")); }
      queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
      queryClient.invalidateQueries({ queryKey: ["follow_events"] });
      queryClient.invalidateQueries({ queryKey: ["follower_events"] });
      queryClient.invalidateQueries({ queryKey: ["profile_followings"] });
    } catch (err) {
      toast.error(t("profile_detail.scan_failed", { error: err instanceof Error ? err.message : String(err) }));
    } finally { setIsScanning(false); }
  };

  const handleDelete = () => {
    if (!id) return;
    deleteProfile.mutate(id, { onSuccess: () => navigate("/dashboard", { replace: true }) });
  };

  const followerDelta = (profile?.previous_follower_count != null && profile.previous_follower_count > 0)
    ? (profile.follower_count ?? 0) - profile.previous_follower_count : null;
  const followingDelta = (profile?.previous_following_count != null && profile.previous_following_count > 0)
    ? (profile.following_count ?? 0) - profile.previous_following_count : null;

  const getTabLock = (tabId: TabId): { locked: boolean; lockType: "paywall" | "spy" | null } => {
    if (tabId === "new_follows") return { locked: plan === "free", lockType: plan === "free" ? "paywall" : null };
    if (plan === "free") return { locked: true, lockType: "paywall" };
    if (!hasSpy) return { locked: true, lockType: "spy" };
    return { locked: false, lockType: null };
  };

  const tabs = [
    { id: "new_follows" as TabId, label: t("profile.follows_new", "Folgt neu"), count: newFollowEvents.length, ...getTabLock("new_follows") },
    { id: "new_followers" as TabId, label: t("profile.new_followers", "Neue Follower"), count: newFollowerEventsList.length, ...getTabLock("new_followers") },
    { id: "unfollowed" as TabId, label: t("profile.unfollowed_tab", "Entfolgt"), count: unfollowedByThem.length + lostFollowerEvents.length, ...getTabLock("unfollowed") },
    { id: "insights" as TabId, label: t("profile.insights_tab", "Insights"), count: null, ...getTabLock("insights") },
  ];

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <span style={{ fontSize: '3rem' }}>🥲</span>
        <p className="text-muted-foreground" style={{ fontSize: '1rem' }}>{t("profile_detail.not_found")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+8px)] pb-2">
        <button onClick={() => navigate("/dashboard")} className="p-2 -ms-2 text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </button>
        <span className="text-muted-foreground font-medium" style={{ fontSize: '0.875rem' }}>@{profile.username}</span>
        <div className="flex items-center">
          <button onClick={handleScan} disabled={isScanning || profile.is_private} className="p-2 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-30">
            {isScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          </button>
          <button onClick={handleDelete} className="p-2 -me-2 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ─── Hero ─── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-4 pb-6">
        <div className="flex flex-col items-center mb-5">
          <div className="relative">
            {hasSpy ? (
              <div className="avatar-ring">
                <div className="rounded-full bg-background p-[2px]">
                  <InstagramAvatar src={profile.avatar_url} alt={profile.username} fallbackInitials={profile.username} size={80} />
                </div>
              </div>
            ) : (
              <InstagramAvatar src={profile.avatar_url} alt={profile.username} fallbackInitials={profile.username} size={80} />
            )}
            {hasSpy && <div className="absolute -top-1 -end-1"><SpyIcon size={28} glow /></div>}
          </div>
          <p className="text-foreground font-bold mt-3" style={{ fontSize: '1.25rem' }}>@{profile.username}</p>
          {profile.display_name && <p className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>{profile.display_name}</p>}
          {hasSpy ? (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
              <span className="text-brand-green font-medium" style={{ fontSize: '0.75rem' }}>{t("spy.spy_active")}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-1.5">
              <ScanStatus lastScannedAt={profile.last_scanned_at} />
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-pink p-4 text-center" style={{ borderRadius: '14px' }}>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-bold font-mono-num text-foreground" style={{ fontSize: '1.5rem' }}>{formatCount(profile.follower_count ?? 0)}</span>
              {followerDelta !== null && followerDelta !== 0 && (
                <span className={`font-bold flex items-center ${followerDelta > 0 ? "text-brand-green" : "text-destructive"}`} style={{ fontSize: '0.75rem' }}>
                  {followerDelta > 0 ? "+" : ""}{followerDelta}
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.75rem' }}>{t("dashboard.followers")}</p>
          </div>
          <div className="card-pink p-4 text-center" style={{ borderRadius: '14px' }}>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-bold font-mono-num text-foreground" style={{ fontSize: '1.5rem' }}>{formatCount(profile.following_count ?? 0)}</span>
              {followingDelta !== null && followingDelta !== 0 && (
                <span className={`font-bold flex items-center ${followingDelta > 0 ? "text-brand-green" : "text-destructive"}`} style={{ fontSize: '0.75rem' }}>
                  {followingDelta > 0 ? "+" : ""}{followingDelta}
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.75rem' }}>{t("dashboard.following")}</p>
          </div>

          {/* Gender Mini-Preview */}
          {(profile.following_count ?? 0) > 0 && ((profile.gender_female_count ?? 0) > 0 || (profile.gender_male_count ?? 0) > 0) && (
            <div className="col-span-2 card-pink p-3 flex items-center gap-3" style={{ borderRadius: '14px' }}>
              <span style={{ fontSize: '1rem' }}>👫</span>
              <div className="flex-1">
                <div className="flex h-2.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                  {(() => {
                    const f = profile.gender_female_count ?? 0;
                    const m = profile.gender_male_count ?? 0;
                    const total = f + m;
                    if (total === 0) return null;
                    const fPct = Math.round((f / total) * 100);
                    return (
                      <>
                        <div style={{ width: `${fPct}%`, background: 'hsl(var(--primary))' }} />
                        <div style={{ width: `${100 - fPct}%`, background: 'hsl(var(--brand-blue))' }} />
                      </>
                    );
                  })()}
                </div>
                <div className="flex justify-between mt-1">
                  <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--primary))' }} className="font-semibold">
                    ♀ {Math.round(((profile.gender_female_count ?? 0) / ((profile.gender_female_count ?? 0) + (profile.gender_male_count ?? 0))) * 100)}%
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'hsl(var(--brand-blue))' }} className="font-semibold">
                    ♂ {Math.round(((profile.gender_male_count ?? 0) / ((profile.gender_female_count ?? 0) + (profile.gender_male_count ?? 0))) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Banners ─── */}
      {isPro && !hasSpy && (
        <div className="px-5 mb-4">
          <button onClick={() => setMoveSpyOpen(true)} className="w-full native-card p-4 flex items-center gap-3">
            <SpyIcon size={36} glow />
            <div className="flex-1 text-start">
              <p className="font-semibold text-foreground" style={{ fontSize: '0.875rem' }}>{t("spy.assign_spy_here")}</p>
              <p className="text-muted-foreground" style={{ fontSize: '0.8125rem' }}>{t("spy.spy_required_description")}</p>
            </div>
          </button>
        </div>
      )}

      {profile.is_private && (
        <div className="px-5 mb-4">
          <div className="flex items-start gap-3 native-card p-4">
            <Lock className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-destructive" style={{ fontSize: '0.875rem' }}>
                {profile.initial_scan_done ? t("private_frozen") : t("private_cannot_track")}
              </p>
              {profile.initial_scan_done && <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.8125rem' }}>{t("private_frozen_subtitle")}</p>}
            </div>
          </div>
        </div>
      )}

      {!profile.baseline_complete && !profile.is_private && (profile.following_count ?? 0) > 0 &&
        (profile.gender_female_count ?? 0) === 0 && (profile.gender_male_count ?? 0) === 0 && (profile.gender_unknown_count ?? 0) === 0 && (
        <div className="px-5 mb-4">
          <div className="flex items-center gap-2 native-card p-4">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-primary font-medium" style={{ fontSize: '0.8125rem' }}>{t("gender_analysis_running")}</span>
          </div>
        </div>
      )}

      {/* ─── 7-Day Insights (Story-based) ─── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="px-5 mb-6 relative">
        {(!canUseStats || (!hasSpy && isPro)) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl">
            {!isPro ? (
              <button onClick={() => showPaywall("stats")} className="bg-primary text-primary-foreground font-semibold px-5 py-3 rounded-xl flex items-center gap-1.5 z-10" style={{ fontSize: '0.875rem' }}>
                <Lock className="h-4 w-4" /> {t("profile_detail.pro_required")}
              </button>
            ) : (
              <button onClick={() => setMoveSpyOpen(true)} className="bg-primary text-primary-foreground font-semibold px-5 py-3 rounded-xl flex items-center gap-1.5 z-10" style={{ fontSize: '0.875rem' }}>
                <SpyIcon size={14} /> {t("spy.spy_required")}
              </button>
            )}
          </div>
        )}
        <div className={(!canUseStats || (!hasSpy && isPro)) ? "blur-md pointer-events-none" : ""}>
          <InsightsBubbleGrid followEvents={followEvents} followerEvents={followerEvents} profileFollowings={followings} profileCreatedAt={profile.created_at} />
        </div>
      </motion.div>

      {/* ─── Tabs ─── */}
      <div ref={tabsRef} className="px-5 mb-4 overflow-x-auto">
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
              className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 min-h-[40px] transition-colors ${
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
              style={{ background: activeTab === tab.id ? undefined : 'hsl(var(--card))', border: activeTab === tab.id ? undefined : '1px solid hsl(var(--border))' }}
              style={{ fontSize: '0.8125rem' }}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`px-1.5 py-0.5 rounded-full font-mono-num font-bold ${activeTab === tab.id ? "bg-primary-foreground/20" : "bg-foreground/10"}`} style={{ fontSize: '0.6875rem' }}>
                  {tab.count}
                </span>
              )}
              {tab.locked && <span style={{ fontSize: '0.6875rem' }}>{tab.lockType === "paywall" ? "🔒" : <SpyIcon size={12} />}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      <motion.div className="px-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={activeTab}>
        {activeTab === "new_follows" && (
          <div className="space-y-4">
            <EventList events={newFollowEvents.map(mapFollowEvent)} shouldBlur={shouldBlur} showPaywall={showPaywall} timeAgo={timeAgo}
              emptyIcon="✨" emptyText={t("profile_detail.no_new_events")} emptySubText={profile.last_scanned_at ? t("profile_detail.will_update") : t("profile_detail.start_scan")}
              sectionTitle={initialFollowEvents.length > 0 && newFollowEvents.length > 0 ? t("recently_detected") : undefined} />
            {initialFollowEvents.length > 0 && (
              <div>
                <p className="section-header px-1 mb-2">{t("existing_at_first_scan")}</p>
                <EventList events={initialFollowEvents.map(e => ({ ...mapFollowEvent(e), isRead: true }))} shouldBlur={shouldBlur} showPaywall={showPaywall} timeAgo={() => t("initial_scan_label")} emptyIcon="✨" emptyText="" emptySubText="" />
              </div>
            )}
          </div>
        )}

        {activeTab === "new_followers" && (
          <div className="space-y-4">
            <EventList events={newFollowerEventsList.map(mapFollowerEvent)} shouldBlur={shouldBlur} showPaywall={showPaywall} timeAgo={timeAgo}
              emptyIcon="👥" emptyText={t("profile_detail.no_new_followers", "Noch keine neuen Follower erkannt")} emptySubText={profile.last_scanned_at ? t("profile_detail.will_update") : t("profile_detail.start_scan")}
              sectionTitle={initialFollowerEventsList.length > 0 && newFollowerEventsList.length > 0 ? t("recently_detected") : undefined} />
            {initialFollowerEventsList.length > 0 && (
              <div>
                <p className="section-header px-1 mb-2">{t("existing_at_first_scan")}</p>
                <EventList events={initialFollowerEventsList.map(e => ({ ...mapFollowerEvent(e), isRead: true }))} shouldBlur={shouldBlur} showPaywall={showPaywall} timeAgo={() => t("initial_scan_label")} emptyIcon="👥" emptyText="" emptySubText="" />
              </div>
            )}
          </div>
        )}

        {activeTab === "unfollowed" && (
          <div className="space-y-4">
            {(profile.pending_unfollow_hint ?? 0) > 0 && (
              <div className="native-card p-4 flex items-center gap-3">
                <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                <div>
                  <span className="font-semibold text-destructive" style={{ fontSize: '0.875rem' }}>~{profile.pending_unfollow_hint} {t("spy.unfollows_detected")}</span>
                  <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.8125rem' }}>{t("spy.unfollow_hint_explanation")}</p>
                </div>
              </div>
            )}
            {hasSpy && <UnfollowCheckButton profileId={profile.id} />}
            <div className="flex items-center gap-2 px-1">
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-muted-foreground" style={{ fontSize: '0.8125rem' }}>
                {t("profile.unfollows_detected_automatically")} {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
            {unfollowedByThem.length > 0 && (
              <div>
                <p className="section-header px-1 mb-2 flex items-center gap-1.5">🚩 {t("profile.unfollowed_by_them")} <span className="text-destructive font-mono-num">{unfollowedByThem.length}</span></p>
                <div className="native-card overflow-hidden">
                  {unfollowedByThem.map((e, i) => <CellRow key={e.id} username={e.target_username} displayName={e.target_display_name} avatarUrl={e.target_avatar_url} detectedAt={e.detected_at} timeAgo={timeAgo} index={i} />)}
                </div>
              </div>
            )}
            {lostFollowerEvents.length > 0 && (
              <div>
                <p className="section-header px-1 mb-2 flex items-center gap-1.5">↓ {t("profile.lost_followers_title")} <span className="text-orange-500 font-mono-num">{lostFollowerEvents.length}</span></p>
                <div className="native-card overflow-hidden">
                  {lostFollowerEvents.map((e, i) => <CellRow key={e.id} username={e.username} displayName={e.full_name} avatarUrl={e.profile_pic_url} detectedAt={e.detected_at} timeAgo={timeAgo} index={i} />)}
                </div>
              </div>
            )}
            {unfollowedByThem.length === 0 && lostFollowerEvents.length === 0 && (
              <div className="native-card p-8 text-center">
                <span style={{ fontSize: '2rem' }} className="block mb-2">✨</span>
                <p className="font-semibold text-foreground" style={{ fontSize: '0.875rem' }}>{t("profile.no_unfollows_yet")}</p>
                <p className="text-muted-foreground mt-1" style={{ fontSize: '0.8125rem' }}>{t("profile.unfollows_auto_detected")}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "insights" && (
          <div className="space-y-4">
            <ActivityHeatmap events={followEvents} />
            <GenderBreakdownChart events={followEvents} />
            <WeeklyActivityChart events={followEvents} />
          </div>
        )}
      </motion.div>

      <MoveSpySheet open={moveSpyOpen} onOpenChange={setMoveSpyOpen} profiles={profiles} currentSpyId={profiles.find((p) => p.has_spy)?.id || null} onMove={(profileId) => moveSpy.mutate(profileId)} />
    </div>
  );
};

// ── Helpers ──
function mapFollowEvent(e: any) {
  return {
    id: e.id, username: e.target_username, displayName: e.target_display_name,
    avatarUrl: e.target_avatar_url, detectedAt: e.detected_at, isRead: e.is_read,
    genderTag: e.gender_tag as string | undefined, isMutual: e.is_mutual as boolean | undefined,
    category: e.category as string | undefined, followerCount: e.target_follower_count as number | undefined,
  };
}
function mapFollowerEvent(e: any) {
  return {
    id: e.id, username: e.username, displayName: e.full_name,
    avatarUrl: e.profile_pic_url, detectedAt: e.detected_at, isRead: e.is_read,
    genderTag: e.gender_tag || undefined, category: e.category || undefined,
    followerCount: e.follower_count || undefined,
  };
}

function CellRow({ username, displayName, avatarUrl, detectedAt, timeAgo, index }: {
  username: string; displayName?: string | null; avatarUrl?: string | null; detectedAt: string; timeAgo: (d: string | null) => string; index: number;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.02 }} className="native-cell">
      <InstagramAvatar src={avatarUrl} alt={username} fallbackInitials={username} size={40} />
      <div className="flex-1 min-w-0">
        <a href={`https://instagram.com/${username}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground" style={{ fontSize: '0.875rem' }}>@{username}</a>
        {displayName && <p className="text-muted-foreground truncate" style={{ fontSize: '0.8125rem' }}>{displayName}</p>}
      </div>
      <span className="text-muted-foreground flex-shrink-0" style={{ fontSize: '0.75rem' }}>{timeAgo(detectedAt)}</span>
    </motion.div>
  );
}

interface EventItem { id: string; username: string; displayName?: string | null; avatarUrl?: string | null; detectedAt: string; isRead?: boolean; genderTag?: string; isMutual?: boolean; category?: string; followerCount?: number; }

function EventList({ events, shouldBlur, showPaywall, timeAgo, emptyIcon, emptyText, emptySubText, sectionTitle }: {
  events: EventItem[]; shouldBlur: boolean; showPaywall: (t: string) => void; timeAgo: (d: string | null) => string; emptyIcon: string; emptyText: string; emptySubText: string; sectionTitle?: string;
}) {
  const { t } = useTranslation();
  if (events.length === 0 && !sectionTitle) {
    return emptyText ? (
      <div className="native-card p-8 text-center">
        <span style={{ fontSize: '2rem' }} className="block mb-2">{emptyIcon}</span>
        <p className="text-foreground font-semibold" style={{ fontSize: '0.875rem' }}>{emptyText}</p>
        <p className="text-muted-foreground mt-1" style={{ fontSize: '0.8125rem' }}>{emptySubText}</p>
      </div>
    ) : null;
  }
  if (events.length === 0) return null;
  return (
    <div>
      {sectionTitle && <p className="section-header px-1 mb-2">{sectionTitle}</p>}
      <div className="native-card overflow-hidden">
        {events.map((event, i) => (
          <motion.div key={event.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="native-cell relative">
            <div className={`relative flex-shrink-0 ${shouldBlur ? "blur-md" : ""}`}>
              <InstagramAvatar src={event.avatarUrl} alt={event.username} fallbackInitials={event.username} size={40} />
              {event.genderTag && event.genderTag !== "unknown" && (
                <div className={`absolute -bottom-0.5 -end-0.5 h-4 w-4 rounded-full flex items-center justify-center text-white ${event.genderTag === "female" ? "bg-primary" : "bg-brand-blue"}`} style={{ fontSize: '0.5rem' }}>
                  {event.genderTag === "female" ? "♀" : "♂"}
                </div>
              )}
            </div>
            <div className={`flex-1 min-w-0 ${shouldBlur ? "blur-md" : ""}`}>
              <div className="flex items-baseline gap-1.5">
                <a href={`https://instagram.com/${event.username}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground" style={{ fontSize: '0.875rem' }}>@{event.username}</a>
                {!event.isRead && !shouldBlur && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
              </div>
              {event.displayName && <p className="text-muted-foreground truncate" style={{ fontSize: '0.8125rem' }}>{event.displayName}</p>}
              {(event.isMutual || event.category) && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {event.isMutual && <span className="tag-red">🔄 {t("events.mutual")}</span>}
                  {event.category === "influencer" && <span className="tag-yellow">⭐ {event.followerCount ? formatCount(event.followerCount) : ""}</span>}
                  {event.category === "celebrity" && <span className="tag-yellow">👑</span>}
                  {event.category === "private" && <span className="tag-muted">🔒</span>}
                </div>
              )}
            </div>
            <span className="text-muted-foreground flex-shrink-0" style={{ fontSize: '0.75rem' }}>{timeAgo(event.detectedAt)}</span>
            {shouldBlur && (
              <button onClick={() => showPaywall("blur")} className="absolute inset-0 flex items-center justify-center">
                <span className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5" style={{ fontSize: '0.8125rem' }}>
                  <Lock className="h-3.5 w-3.5" />{t("events.upgrade_to_reveal")}
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
