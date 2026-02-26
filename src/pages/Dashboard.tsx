import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import { SpyAgentCard } from "@/components/SpyAgentCard";
import { ProfileCard } from "@/components/ProfileCard";
import { MoveSpySheet } from "@/components/MoveSpySheet";
import { EventFeedItem } from "@/components/EventFeedItem";
import { DaySeparator } from "@/components/DaySeparator";
import { useTrackedProfiles, useFollowEvents } from "@/hooks/useTrackedProfiles";
import { useFollowerEvents } from "@/hooks/useFollowerEvents";
import { useMoveSpy } from "@/hooks/useSpyProfile";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { haptic } from "@/lib/native";
import logoSquare from "@/assets/logo-square.png";

// Unified event type for the feed
export interface UnifiedFeedEvent {
  id: string;
  tracked_profile_id: string;
  detected_at: string;
  is_read: boolean;
  source: "follow" | "follower";
  event_type: string;
  target_username?: string;
  target_avatar_url?: string | null;
  target_display_name?: string | null;
  target_follower_count?: number | null;
  target_is_private?: boolean | null;
  direction?: string;
  gender_tag?: string | null;
  is_mutual?: boolean | null;
  category?: string | null;
  username?: string;
  full_name?: string | null;
  profile_pic_url?: string | null;
  follower_count?: number | null;
  is_verified?: boolean;
  tracked_profiles?: { username: string; avatar_url: string | null } | null;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { plan, showPaywall } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  const [moveSpyOpen, setMoveSpyOpen] = useState(false);
  const [spyDragging, setSpyDragging] = useState(false);
  const [hoveredProfileId, setHoveredProfileId] = useState<string | null>(null);

  const { data: profiles = [], isLoading: profilesLoading } = useTrackedProfiles();
  const { data: followEventsRaw = [], isLoading: eventsLoading } = useFollowEvents();
  const { data: followerEventsRaw = [] } = useFollowerEvents();
  const moveSpy = useMoveSpy();

  const isLoading = profilesLoading || eventsLoading;
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const spyProfile = profiles.find((p) => p.has_spy === true) || null;
  const isPro = plan === "pro";

  const handleDragStateChange = useCallback((dragging: boolean) => {
    setSpyDragging(dragging);
    if (!dragging) setHoveredProfileId(null);
  }, []);

  const handleProfileTap = useCallback((profileId: string) => {
    navigate(`/profile/${profileId}`);
  }, [navigate]);

  const handleMoveSpy = useCallback((profileId: string) => {
    moveSpy.mutate(profileId);
  }, [moveSpy]);

  const handleRefresh = async () => {
    haptic.light();
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
    await queryClient.invalidateQueries({ queryKey: ["follow_events"] });
    await queryClient.invalidateQueries({ queryKey: ["follower_events"] });
    setRefreshing(false);
  };

  // Build unified feed
  const allEvents: UnifiedFeedEvent[] = useMemo(() => {
    const fromFollows: UnifiedFeedEvent[] = followEventsRaw.map((e) => ({
      id: e.id,
      tracked_profile_id: e.tracked_profile_id,
      detected_at: e.detected_at,
      is_read: e.is_read,
      source: "follow" as const,
      event_type: e.event_type,
      target_username: e.target_username,
      target_avatar_url: e.target_avatar_url,
      target_display_name: e.target_display_name,
      target_follower_count: e.target_follower_count,
      target_is_private: e.target_is_private,
      direction: e.direction,
      gender_tag: (e as Record<string, unknown>).gender_tag as string | null,
      is_mutual: (e as Record<string, unknown>).is_mutual as boolean | null,
      category: (e as Record<string, unknown>).category as string | null,
      tracked_profiles: e.tracked_profiles,
    }));

    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const fromFollowers: UnifiedFeedEvent[] = followerEventsRaw.map((e) => {
      const tp = profileMap.get(e.profile_id);
      return {
        id: e.id,
        tracked_profile_id: e.profile_id,
        detected_at: e.detected_at,
        is_read: e.is_read,
        source: "follower" as const,
        event_type: e.event_type,
        username: e.username,
        full_name: e.full_name,
        profile_pic_url: e.profile_pic_url,
        follower_count: e.follower_count,
        is_verified: e.is_verified,
        gender_tag: e.gender_tag,
        category: e.category,
        tracked_profiles: tp ? { username: tp.username, avatar_url: tp.avatar_url } : null,
      };
    });

    return [...fromFollows, ...fromFollowers]
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
      .slice(0, 100);
  }, [followEventsRaw, followerEventsRaw, profiles]);

  const groupedEvents = useMemo(() => {
    const groups: { date: string; events: UnifiedFeedEvent[] }[] = [];
    let currentDate = "";
    for (const event of allEvents) {
      const eventDate = new Date(event.detected_at).toDateString();
      if (eventDate !== currentDate) {
        currentDate = eventDate;
        groups.push({ date: event.detected_at, events: [] });
      }
      groups[groups.length - 1].events.push(event);
    }
    return groups;
  }, [allEvents]);

  // Spy of the Day
  const latestEvent = allEvents.length > 0 ? allEvents[0] : null;
  const getLatestEventInfo = () => {
    if (!latestEvent) return null;
    if (latestEvent.source === "follow") {
      const verb = latestEvent.event_type === "unfollow" ? t("events.hasUnfollowed") : t("events.newFollowing");
      return { username: latestEvent.target_username || "???", verb };
    }
    const verb = latestEvent.event_type === "lost" ? t("events.lostFollower") : t("events.newFollower");
    return { username: latestEvent.username || "???", verb };
  };
  const latestInfo = getLatestEventInfo();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <img src={logoSquare} alt="Spy-Secret" className="h-9 w-9 drop-shadow-md" />
            <span className="text-lg font-extrabold text-foreground">
              Spy<span className="text-primary">Secret</span>
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Greeting – clean, no spy icon */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-extrabold text-foreground">Hey {displayName}!</h1>
          {profiles.length > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("simple.tracking_count", { count: profiles.length })}
            </p>
          )}
        </motion.div>
      </div>

      {/* ═══════ SPY DES TAGES – Card with pink bg (Pro) ═══════ */}
      {isPro && latestEvent && latestInfo && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-4 mb-4"
        >
          <div className="gradient-pink rounded-2xl px-5 py-4 shadow-[0_4px_24px_-4px_hsl(338_100%_58%/0.35)]">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-lg">📋</span>
              <span className="text-[10px] font-extrabold text-primary-foreground/80 uppercase tracking-widest">
                {t("simple.spy_of_the_day")}
              </span>
            </div>
            <p className="text-[15px] font-bold text-primary-foreground leading-snug">
              <span className="opacity-90">@{latestInfo.username}</span> {latestInfo.verb}
            </p>
            {latestEvent.tracked_profiles?.username && (
              <p className="text-[11px] text-primary-foreground/60 mt-1">📍 {latestEvent.tracked_profiles.username}</p>
            )}
          </div>
        </motion.div>
      )}

      {isPro && !latestEvent && profiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-4 mb-4"
        >
          <div className="gradient-pink rounded-2xl px-5 py-4 shadow-[0_4px_24px_-4px_hsl(338_100%_58%/0.35)]">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-lg">📋</span>
              <span className="text-[10px] font-extrabold text-primary-foreground/80 uppercase tracking-widest">
                {t("simple.spy_of_the_day")}
              </span>
            </div>
            <p className="text-[13px] text-primary-foreground/60 font-medium flex items-center gap-2">
              <span className="text-xl">😴</span> {t("simple.no_activity_today")}
            </p>
          </div>
        </motion.div>
      )}

      {/* ═══════ SPY DES TAGES – Free users (greyed out + lock) ═══════ */}
      {!isPro && profiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mx-4 mb-4"
        >
          <button
            onClick={() => {
              haptic.light();
              showPaywall("spy_of_the_day");
            }}
            className="w-full text-start relative overflow-hidden rounded-2xl"
          >
            <div className="gradient-pink rounded-2xl px-5 py-4 opacity-40 grayscale">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-lg">📋</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest">
                  {t("simple.spy_of_the_day")}
                </span>
                <span className="ms-auto text-[9px] font-bold bg-background/20 rounded-full px-2 py-0.5">PRO</span>
              </div>
              {latestEvent && latestInfo ? (
                <p className="text-[15px] font-bold leading-snug">@{latestInfo.username} {latestInfo.verb}</p>
              ) : (
                <p className="text-[13px] font-medium">{t("simple.no_activity_today")}</p>
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-background/30 rounded-2xl">
              <span className="text-[12px] font-bold text-primary flex items-center gap-1.5">🔒 {t("paywall.unlock_spy", "Spy freischalten")}</span>
            </div>
          </button>
        </motion.div>
      )}

      {/* ═══════ SPY AGENT CARD (Pro only) ═══════ */}
      {isPro && (
        <SpyAgentCard
          spyProfile={spyProfile}
          onMoveSpy={() => setMoveSpyOpen(true)}
          onDragMoveSpy={handleMoveSpy}
          isDragging={spyDragging}
          onDragStateChange={handleDragStateChange}
          onHoverProfileChange={setHoveredProfileId}
        />
      )}

      {/* Profile Cards */}
      {profiles.length > 0 && (
        <div className="px-4 py-3 space-y-2">
          <p className="section-header px-1">{t("spy.your_profiles", "Deine Profile")}</p>
          {profiles.map((profile, i) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              profileId={profile.id}
              hasSpy={profile.has_spy === true}
              onTap={handleProfileTap}
              onAssignSpy={handleMoveSpy}
              index={i}
              isDragging={spyDragging}
              isHovered={hoveredProfileId === profile.id}
            />
          ))}
          <button
            onClick={() => navigate("/add-profile")}
            className="w-full py-3 rounded-xl border border-dashed border-muted-foreground/20 text-muted-foreground text-[13px] font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> {t("nav.add")} ({profiles.length}/{isPro ? 5 : 1})
          </button>
        </div>
      )}

      {/* Event Feed */}
      <main className="px-4 pb-28">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : allEvents.length > 0 ? (
          <div className="space-y-3">
            <p className="section-header px-1 mt-4">{t("spy.latest_activity", "Letzte Aktivität")}</p>
            {groupedEvents.map((group, gi) => (
              <div key={group.date}>
                <DaySeparator date={group.date} />
                <div className="space-y-3">
                  {group.events.map((event, ei) => (
                    <EventFeedItem key={event.id} event={event} index={gi * 10 + ei} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : profiles.length > 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">⏳</span>
            <p className="text-sm font-semibold text-foreground">{t("events.no_events")}</p>
            <p className="text-[12px] text-muted-foreground mt-1">{t("events.no_events_subtitle")}</p>
          </div>
        ) : (
          <div className="text-center py-20">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <img src={logoSquare} alt="" className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-sm font-semibold text-foreground">{t("dashboard.no_profiles")}</p>
              <p className="text-[12px] text-muted-foreground mt-1 mb-6">{t("dashboard.add_first")}</p>
              <button onClick={() => navigate("/add-profile")} className="pill-btn-primary px-6 py-3 text-[14px]">
                <Plus className="h-4 w-4" /> {t("nav.add")}
              </button>
            </motion.div>
          </div>
        )}
      </main>

      {/* Move Spy Sheet */}
      <MoveSpySheet
        open={moveSpyOpen}
        onOpenChange={setMoveSpyOpen}
        profiles={profiles}
        currentSpyId={spyProfile?.id || null}
        onMove={handleMoveSpy}
      />
    </div>
  );
};

export default Dashboard;
