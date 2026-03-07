import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ChevronRight, Lock, UserMinus, UserPlus, UserX, UserCheck } from "lucide-react";
import { EventFeedItem } from "@/components/EventFeedItem";
import { DaySeparator } from "@/components/DaySeparator";
import { SpyIcon } from "@/components/SpyIcon";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { useFollowEvents, useTrackedProfiles } from "@/hooks/useTrackedProfiles";
import { useFollowerEvents } from "@/hooks/useFollowerEvents";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { haptic } from "@/lib/native";
import type { UnifiedFeedEvent } from "@/pages/Dashboard";
import logoSquare from "@/assets/logo-square.png";

type FilterType = "all" | "follows" | "unfollows";

const FeedPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, showPaywall } = useSubscription();
  const isPro = plan === "pro";

  const [filter, setFilter] = useState<FilterType>("all");
  const [visibleCount, setVisibleCount] = useState(50);

  const { data: profiles = [] } = useTrackedProfiles();
  const { data: followEventsRaw = [], isLoading: eventsLoading } = useFollowEvents();
  const { data: followerEventsRaw = [] } = useFollowerEvents();

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
      is_initial: (e as Record<string, unknown>).is_initial as boolean | undefined,
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
        is_initial: e.is_initial,
        tracked_profiles: tp ? { username: tp.username, avatar_url: tp.avatar_url } : null,
      };
    });

    const combinedEvents = [...fromFollows, ...fromFollowers];
    const filteredByPlan = isPro
      ? combinedEvents
      : combinedEvents.filter((e) => e.source === "follower");

    return filteredByPlan
      .filter((e) => !e.is_initial)
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
  }, [followEventsRaw, followerEventsRaw, profiles, isPro]);

  // Apply filter
  const filteredEvents = useMemo(() => {
    if (filter === "all") return allEvents;
    if (filter === "follows") {
      return allEvents.filter((e) => {
        if (e.source === "follow") return e.event_type !== "unfollow";
        return e.event_type === "gained";
      });
    }
    // unfollows
    return allEvents.filter((e) => {
      if (e.source === "follow") return e.event_type === "unfollow";
      return e.event_type === "lost";
    });
  }, [allEvents, filter]);

  const visibleEvents = filteredEvents.slice(0, visibleCount);

  // Group by day
  const groupedEvents = useMemo(() => {
    const groups: { date: string; events: UnifiedFeedEvent[] }[] = [];
    let currentDate = "";
    for (const event of visibleEvents) {
      const eventDate = new Date(event.detected_at).toDateString();
      if (eventDate !== currentDate) {
        currentDate = eventDate;
        groups.push({ date: event.detected_at, events: [] });
      }
      groups[groups.length - 1].events.push(event);
    }
    return groups;
  }, [visibleEvents]);

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

  const filters: { key: FilterType; label: string; emoji: string }[] = [
    { key: "all", label: t("feed.all", "Alle"), emoji: "" },
    { key: "follows", label: t("feed.follows", "Follows"), emoji: "🟢" },
    { key: "unfollows", label: t("feed.unfollows", "Unfollows"), emoji: "🔴" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
        <div className="flex items-center gap-2.5 mb-4">
          <img src={logoSquare} alt="Spy-Secret" className="h-9 w-9 drop-shadow-md" />
          <span className="text-lg font-extrabold text-foreground">
            Spy<span className="text-primary">Secret</span>
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">{t("feed.whats_new", "What's new?")}</h1>
      </div>

      {/* Spy des Tages */}
      {isPro && latestEvent && latestInfo && (() => {
        const eventType = latestEvent.source === "follow"
          ? latestEvent.event_type === "unfollow" ? "unfollow" : "new_follow"
          : latestEvent.event_type === "lost" ? "lost_follower" : "new_follower";
        const badgeConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
          unfollow: { label: t("events.unfollowed"), icon: <UserMinus className="h-3 w-3" />, className: "bg-destructive/15 text-destructive" },
          lost_follower: { label: t("events.lost_follower"), icon: <UserX className="h-3 w-3" />, className: "bg-orange-500/15 text-orange-500" },
          new_follow: { label: t("events.now_following"), icon: <UserPlus className="h-3 w-3" />, className: "bg-green-500/15 text-green-500" },
          new_follower: { label: t("events.new_follower"), icon: <UserCheck className="h-3 w-3" />, className: "bg-blue-500/15 text-blue-500" },
        };
        const badge = badgeConfig[eventType];
        const avatarUrl = latestEvent.source === "follow" ? latestEvent.target_avatar_url : latestEvent.profile_pic_url;
        const displayUsername = latestInfo.username;
        const trackedUsername = latestEvent.tracked_profiles?.username;
        const timeAgo = (() => {
          const diff = Date.now() - new Date(latestEvent.detected_at).getTime();
          const mins = Math.floor(diff / 60000);
          if (mins < 1) return t("dashboard.just_now");
          if (mins < 60) return t("dashboard.minutes_ago", { count: mins });
          const hrs = Math.floor(mins / 60);
          if (hrs < 24) return t("dashboard.hours_ago", { count: hrs });
          return t("dashboard.days_ago", { count: Math.floor(hrs / 24) });
        })();

        return (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-4 mb-6"
          >
            <button
              onClick={() => { haptic.light(); navigate(`/profile/${latestEvent.tracked_profile_id}`); }}
              className="w-full text-start relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card p-5 active:scale-[0.98] transition-transform shadow-[0_0_32px_-8px_hsl(var(--primary)/0.25)]"
            >
              {/* Decorative glow */}
              <div className="absolute -top-12 -end-12 w-32 h-32 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <SpyIcon size={20} glow />
                    <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
                      {t("simple.spy_of_the_day")}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/70">{timeAgo}</span>
                </div>
                
                <div className="flex items-center gap-3.5">
                  <div className="relative flex-shrink-0">
                    <div className="ring-2 ring-primary/30 rounded-full p-[2px]">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover bg-muted" />
                      ) : (
                        <div className="h-12 w-12 rounded-full gradient-pink flex items-center justify-center text-primary-foreground text-sm font-bold">
                          {displayUsername.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badge.className}`}>
                        {badge.icon} {badge.label}
                      </span>
                    </div>
                    <p className="text-[15px] font-bold text-foreground truncate">
                      @{displayUsername}
                    </p>
                    {trackedUsername && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {t("simple.spy_of_the_day_subtitle_at", "bei")} @{trackedUsername}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-primary/50 flex-shrink-0 rtl:rotate-180" />
                </div>
              </div>
            </button>
          </motion.div>
        );
      })()}

      {/* Free users locked spy of the day */}
      {!isPro && profiles.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }} className="mx-4 mb-4">
          <button onClick={() => { haptic.light(); showPaywall("spy_of_the_day"); }} className="w-full text-start relative overflow-hidden rounded-2xl">
            <div className="native-card p-4 opacity-40 grayscale blur-[1px]">
              <div className="flex items-center gap-1.5 mb-2">
                <SpyIcon size={18} />
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">{t("simple.spy_of_the_day")}</span>
                <span className="ms-auto text-[9px] font-bold bg-primary/10 text-primary rounded-full px-2 py-0.5">PRO</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-3 w-20 rounded bg-muted mb-1.5" />
                  <div className="h-3 w-32 rounded bg-muted/60" />
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-background/30 rounded-2xl">
              <span className="text-[12px] font-bold text-primary flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> {t("paywall.unlock_spy", "Spy freischalten")}
              </span>
            </div>
          </button>
        </motion.div>
      )}

      {/* Filter Pills */}
      <div className="px-4 mb-4">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setVisibleCount(50); }}
              className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-colors ${
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {f.emoji && <span className="mr-1">{f.emoji}</span>}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event Feed */}
      <main className="px-4">
        {eventsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : visibleEvents.length > 0 ? (
          <div className="space-y-3">
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
            {filteredEvents.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((c) => c + 50)}
                className="w-full py-3 rounded-xl bg-secondary text-muted-foreground text-[13px] font-semibold hover:bg-secondary/80 transition-colors"
              >
                {t("feed.load_more", "Mehr laden")}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">🕵️</span>
            <p className="text-sm font-semibold text-foreground">{t("feed.empty_title", "Noch keine Aktivitäten")}</p>
            <p className="text-[12px] text-muted-foreground mt-1 max-w-[260px] mx-auto">
              {t("feed.empty_subtitle", "Dein Spion ist auf der Lauer... Neue Follows und Unfollows erscheinen hier.")}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default FeedPage;
