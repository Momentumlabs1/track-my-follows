import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Lock } from "lucide-react";
import { EventFeedItem } from "@/components/EventFeedItem";
import { DaySeparator } from "@/components/DaySeparator";
import { SpyIcon } from "@/components/SpyIcon";
import { useFollowEvents, useTrackedProfiles } from "@/hooks/useTrackedProfiles";
import { useFollowerEvents } from "@/hooks/useFollowerEvents";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { haptic } from "@/lib/native";
import type { UnifiedFeedEvent } from "@/pages/Dashboard";
import logoSquare from "@/assets/logo-square.png";

type FilterType = "all" | "follows";

const FeedPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { plan, showPaywall } = useSubscription();
  const isPro = plan === "pro";
  const [filter, setFilter] = useState<FilterType>("all");
  const [visibleCount, setVisibleCount] = useState(50);

  const { data: profiles = [] } = useTrackedProfiles();
  const { data: followEventsRaw = [], isLoading: eventsLoading } = useFollowEvents();
  const { data: followerEventsRaw = [] } = useFollowerEvents();

  const allEvents: UnifiedFeedEvent[] = useMemo(() => {
    const fromFollows: UnifiedFeedEvent[] = followEventsRaw.map((e) => ({
      id: e.id, tracked_profile_id: e.tracked_profile_id, detected_at: e.detected_at, is_read: e.is_read,
      source: "follow" as const, event_type: e.event_type, target_username: e.target_username,
      target_avatar_url: e.target_avatar_url, target_display_name: e.target_display_name,
      target_follower_count: e.target_follower_count, target_is_private: e.target_is_private,
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
        id: e.id, tracked_profile_id: e.profile_id, detected_at: e.detected_at, is_read: e.is_read,
        source: "follower" as const, event_type: e.event_type, username: e.username,
        full_name: e.full_name, profile_pic_url: e.profile_pic_url, follower_count: e.follower_count,
        is_verified: e.is_verified, gender_tag: e.gender_tag, category: e.category, is_initial: e.is_initial,
        tracked_profiles: tp ? { username: tp.username, avatar_url: tp.avatar_url } : null,
      };
    });
    return [...fromFollows, ...fromFollowers]
      .filter((e) => !e.is_initial && (isPro || e.source === "follower"))
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
  }, [followEventsRaw, followerEventsRaw, profiles, isPro]);

  const filteredEvents = useMemo(() => {
    if (filter === "all") return allEvents;
    return allEvents.filter((e) => e.source === "follow" ? e.event_type !== "unfollow" : e.event_type === "gained");
  }, [allEvents, filter]);

  const visibleEvents = filteredEvents.slice(0, visibleCount);
  const groupedEvents = useMemo(() => {
    const groups: { date: string; events: UnifiedFeedEvent[] }[] = [];
    let currentDate = "";
    for (const event of visibleEvents) {
      const eventDate = new Date(event.detected_at).toDateString();
      if (eventDate !== currentDate) { currentDate = eventDate; groups.push({ date: event.detected_at, events: [] }); }
      groups[groups.length - 1].events.push(event);
    }
    return groups;
  }, [visibleEvents]);

  // Spy of the Day
  const latestEvent = allEvents[0] ?? null;
  const latestInfo = latestEvent ? (() => {
    if (latestEvent.source === "follow") {
      return { username: latestEvent.target_username || "???", verb: latestEvent.event_type === "unfollow" ? t("events.hasUnfollowed") : t("events.newFollowing") };
    }
    return { username: latestEvent.username || "???", verb: latestEvent.event_type === "lost" ? t("events.lostFollower") : t("events.newFollower") };
  })() : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-4">
        <div className="flex items-center gap-2.5 mb-4">
          <img src={logoSquare} alt="Spy-Secret" className="h-8 w-8" />
          <span className="font-bold text-foreground" style={{ fontSize: '1.125rem' }}>
            Spy<span className="text-primary">Secret</span>
          </span>
        </div>
        <h1 className="font-bold text-foreground" style={{ fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{t("feed.whats_new", "What's new?")}</h1>
      </div>

      {/* Spy of the Day */}
      {isPro && latestEvent && latestInfo && (() => {
        const avatarUrl = latestEvent.source === "follow" ? latestEvent.target_avatar_url : latestEvent.profile_pic_url;
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
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mx-5 mb-6">
            <button onClick={() => { haptic.light(); navigate(`/profile/${latestEvent.tracked_profile_id}`); }} className="w-full text-start native-card p-4 active:scale-[0.98] transition-transform">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <SpyIcon size={18} glow />
                  <span className="section-header">{t("simple.spy_of_the_day")}</span>
                </div>
                <span className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>{timeAgo}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover bg-muted" />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">{latestInfo.username[0]?.toUpperCase()}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate" style={{ fontSize: '0.9375rem' }}>@{latestInfo.username}</p>
                  {trackedUsername && <p className="text-muted-foreground truncate" style={{ fontSize: '0.8125rem' }}>{t("simple.spy_of_the_day_subtitle_at", "bei")} @{trackedUsername}</p>}
                </div>
              </div>
            </button>
          </motion.div>
        );
      })()}

      {!isPro && profiles.length > 0 && (
        <div className="mx-5 mb-5">
          <button onClick={() => { haptic.light(); showPaywall("spy_of_the_day"); }} className="w-full text-start relative overflow-hidden rounded-2xl">
            <div className="native-card p-4 opacity-30 blur-[2px]">
              <div className="flex items-center gap-1.5 mb-2"><SpyIcon size={16} /><span className="section-header">{t("simple.spy_of_the_day")}</span></div>
              <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-muted" /><div className="h-3 w-24 rounded bg-muted" /></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
              <span className="font-semibold text-primary flex items-center gap-1.5" style={{ fontSize: '0.8125rem' }}><Lock className="h-4 w-4" /> {t("paywall.unlock_spy", "Spy freischalten")}</span>
            </div>
          </button>
        </div>
      )}

      {/* Filter pills */}
      <div className="px-5 mb-4">
        <div className="flex gap-2">
          {([{ key: "all" as FilterType, label: t("feed.all", "Alle") }, { key: "follows" as FilterType, label: t("feed.follows", "Follows") }]).map((f) => (
            <button key={f.key} onClick={() => { setFilter(f.key); setVisibleCount(50); }}
              className={`px-4 py-2 rounded-xl font-semibold min-h-[40px] transition-colors ${filter === f.key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
              style={{ fontSize: '0.8125rem' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <main>
        {eventsLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : visibleEvents.length > 0 ? (
          <div>
            {groupedEvents.map((group, gi) => (
              <div key={group.date}>
                <div className="px-5"><DaySeparator date={group.date} /></div>
                {group.events.map((event, ei) => <EventFeedItem key={event.id} event={event} index={gi * 10 + ei} />)}
              </div>
            ))}
            {filteredEvents.length > visibleCount && (
              <div className="px-5 pt-4">
                <button onClick={() => setVisibleCount((c) => c + 50)} className="w-full py-3 rounded-xl bg-card text-muted-foreground font-semibold min-h-[44px]" style={{ fontSize: '0.875rem' }}>
                  {t("feed.load_more", "Mehr laden")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 px-5">
            <span style={{ fontSize: '2.5rem' }} className="block mb-3">🕵️</span>
            <p className="font-semibold text-foreground" style={{ fontSize: '0.9375rem' }}>{t("feed.empty_title", "Noch keine Aktivitäten")}</p>
            <p className="text-muted-foreground mt-1 max-w-[260px] mx-auto" style={{ fontSize: '0.8125rem' }}>{t("feed.empty_subtitle")}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default FeedPage;
