import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import type { FollowEvent } from "@/hooks/useTrackedProfiles";
import type { FollowerEvent } from "@/hooks/useFollowerEvents";

interface InsightsBubbleGridProps {
  followEvents: FollowEvent[];
  followerEvents: FollowerEvent[];
  profileFollowings: Array<{
    following_display_name?: string | null;
    following_username: string;
    following_avatar_url?: string | null;
    gender_tag?: string | null;
    first_seen_at: string;
  }>;
  profileCreatedAt: string;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function InsightsBubbleGrid({
  followEvents,
  followerEvents,
  profileFollowings,
  profileCreatedAt,
}: InsightsBubbleGridProps) {
  const { t } = useTranslation();
  const now = Date.now();
  const sevenDaysAgo = now - SEVEN_DAYS;

  const stats = useMemo(() => {
    // 7-day follow events (direction=following, not initial)
    const recentFollows = followEvents.filter(
      (e) =>
        (e as any).direction === "following" &&
        (e.event_type === "follow" || e.event_type === "new_following") &&
        !(e as any).is_initial &&
        new Date(e.detected_at).getTime() >= sevenDaysAgo
    );
    const recentUnfollows = followEvents.filter(
      (e) =>
        (e as any).direction === "following" &&
        (e.event_type === "unfollow" || e.event_type === "unfollowed") &&
        new Date(e.detected_at).getTime() >= sevenDaysAgo
    );

    // 7-day follower events (not initial)
    const recentNewFollowers = followerEvents.filter(
      (e) =>
        e.event_type === "gained" &&
        !e.is_initial &&
        new Date(e.detected_at).getTime() >= sevenDaysAgo
    );
    const recentLostFollowers = followerEvents.filter(
      (e) =>
        e.event_type === "lost" &&
        new Date(e.detected_at).getTime() >= sevenDaysAgo
    );

    // Gender of new follows - match by username from recent follow events to profile_followings
    const recentFollowUsernames = new Set(recentFollows.map((e) => e.target_username));
    const recentFollowingsWithGender = profileFollowings.filter((f) =>
      recentFollowUsernames.has(f.following_username) ||
      new Date(f.first_seen_at).getTime() >= sevenDaysAgo
    );

    // Also use gender_tag from follow_events directly
    const femaleFollows: Array<{ username: string; avatar?: string | null; displayName?: string | null }> = [];
    const maleFollows: Array<{ username: string; avatar?: string | null; displayName?: string | null }> = [];
    let unknownCount = 0;

    for (const ev of recentFollows) {
      const evGender = (ev as any).gender_tag as string | undefined;
      const matching = recentFollowingsWithGender.find(
        (f) => f.following_username === ev.target_username
      );
      const gender = matching?.gender_tag || evGender || "unknown";

      const entry = {
        username: ev.target_username,
        avatar: matching?.following_avatar_url || ev.target_avatar_url,
        displayName: matching?.following_display_name || ev.target_display_name,
      };

      if (gender === "female") femaleFollows.push(entry);
      else if (gender === "male") maleFollows.push(entry);
      else unknownCount++;
    }

    return {
      newFollows: recentFollows.length,
      newUnfollows: recentUnfollows.length,
      newFollowers: recentNewFollowers.length,
      lostFollowers: recentLostFollowers.length,
      femaleFollows,
      maleFollows,
      unknownCount,
    };
  }, [followEvents, followerEvents, profileFollowings, sevenDaysAgo]);

  // Summary lines
  const summaryLines = useMemo(() => {
    const lines: string[] = [];

    // Follower/Following ratio
    const totalFollows = stats.newFollows;
    const totalUnfollows = stats.newUnfollows;
    if (totalFollows > 0 || totalUnfollows > 0) {
      const femPct =
        stats.femaleFollows.length + stats.maleFollows.length > 0
          ? Math.round(
              (stats.femaleFollows.length /
                (stats.femaleFollows.length + stats.maleFollows.length)) *
                100
            )
          : 0;
      if (femPct > 0) {
        lines.push(
          t("insights_7d.gender_distribution", {
            percent: femPct,
          })
        );
      }
    }

    return lines;
  }, [stats, t]);

  // Check tracking age
  const trackingDays = Math.floor((now - new Date(profileCreatedAt).getTime()) / (24 * 60 * 60 * 1000));
  const isNew = trackingDays < 7;
  const totalActivity = stats.newFollows + stats.newUnfollows + stats.newFollowers + stats.lostFollowers;

  // Empty state
  if (totalActivity === 0) {
    if (isNew) {
      return (
        <div className="native-card p-5 text-center">
          <p className="section-header mb-2">📊 {t("insights_7d.since_days", { days: trackingDays })}</p>
          <p className="text-[12px] text-muted-foreground">
            {t("insights_7d.building_data", { days: 7 - trackingDays })}
          </p>
        </div>
      );
    }
    return (
      <div className="native-card p-5 text-center">
        <p className="section-header mb-2">📊 {t("insights_7d.title")}</p>
        <p className="text-[12px] text-muted-foreground">{t("insights_7d.no_activity")}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{t("insights_7d.spy_watching")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="native-card p-4">
        <p className="section-header">📊 {t("insights_7d.title")}</p>
        {stats.unknownCount > 0 && (
          <p className="text-[10px] text-muted-foreground mt-1">
            {t("insights_7d.not_analyzed", { count: stats.unknownCount })}
          </p>
        )}
      </div>

      {/* Bubble Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Female follows */}
        <GenderBubble
          count={stats.femaleFollows.length}
          label={t("insights_7d.new_women_followed")}
          symbol="♀"
          colorClass="bg-pink-500/10 border-pink-500/20"
          textColorClass="text-pink-500"
          avatars={stats.femaleFollows}
          delay={0}
        />

        {/* Male follows */}
        <GenderBubble
          count={stats.maleFollows.length}
          label={t("insights_7d.new_men_followed")}
          symbol="♂"
          colorClass="bg-blue-400/10 border-blue-400/20"
          textColorClass="text-blue-400"
          avatars={stats.maleFollows}
          delay={0.05}
        />

        {/* Total new follows */}
        <StatBubble
          value={stats.newFollows}
          prefix="+"
          label={t("insights_7d.new_follows_total")}
          colorClass="bg-emerald-500/10 border-emerald-500/20"
          textColorClass="text-emerald-500"
          icon={<TrendingUp className="h-4 w-4" />}
          delay={0.1}
        />

        {/* Unfollows */}
        <StatBubble
          value={stats.newUnfollows}
          prefix="-"
          label={t("insights_7d.unfollows")}
          colorClass="bg-red-500/10 border-red-500/20"
          textColorClass="text-red-500"
          icon={<TrendingDown className="h-4 w-4" />}
          delay={0.15}
        />

        {/* New followers */}
        <StatBubble
          value={stats.newFollowers}
          prefix="+"
          label={t("insights_7d.new_followers")}
          colorClass="bg-emerald-500/10 border-emerald-500/20"
          textColorClass="text-emerald-500"
          icon={<TrendingUp className="h-4 w-4" />}
          delay={0.2}
        />

        {/* Lost followers */}
        <StatBubble
          value={stats.lostFollowers}
          prefix="-"
          label={t("insights_7d.lost_followers")}
          colorClass="bg-red-500/10 border-red-500/20"
          textColorClass="text-red-500"
          icon={<TrendingDown className="h-4 w-4" />}
          delay={0.25}
        />
      </div>

      {/* Summary */}
      {summaryLines.length > 0 && (
        <div className="native-card p-4">
          <p className="section-header mb-2">📝 {t("insights_7d.summary")}</p>
          <ul className="space-y-1.5">
            {summaryLines.map((line, i) => (
              <li key={i} className="text-[12px] text-muted-foreground flex items-start gap-2">
                <span className="text-muted-foreground/60">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Gender Bubble with avatars ──
function GenderBubble({
  count,
  label,
  symbol,
  colorClass,
  textColorClass,
  avatars,
  delay,
}: {
  count: number;
  label: string;
  symbol: string;
  colorClass: string;
  textColorClass: string;
  avatars: Array<{ username: string; avatar?: string | null; displayName?: string | null }>;
  delay: number;
}) {
  const maxVisible = 6;
  const visible = avatars.slice(0, maxVisible);
  const remaining = count - maxVisible;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className={`rounded-2xl border p-4 backdrop-blur-sm ${colorClass} flex flex-col items-center justify-center min-h-[140px]`}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`text-lg font-bold ${textColorClass}`}>{symbol}</span>
        <span className={`text-3xl font-extrabold tabular-nums ${textColorClass}`}>{count}</span>
      </div>

      {visible.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 mb-2">
          {visible.map((a) => (
            <a
              key={a.username}
              href={`https://instagram.com/${a.username}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`@${a.username}`}
            >
              <InstagramAvatar
                src={a.avatar}
                alt={a.username}
                fallbackInitials={a.username}
                size={28}
              />
            </a>
          ))}
          {remaining > 0 && (
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
              <span className="text-[9px] font-bold text-muted-foreground">+{remaining}</span>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center leading-tight">{label}</p>
    </motion.div>
  );
}

// ── Stat Bubble (number only) ──
function StatBubble({
  value,
  prefix,
  label,
  colorClass,
  textColorClass,
  icon,
  delay,
}: {
  value: number;
  prefix: string;
  label: string;
  colorClass: string;
  textColorClass: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className={`rounded-2xl border p-4 backdrop-blur-sm ${colorClass} flex flex-col items-center justify-center min-h-[100px]`}
    >
      <div className={`mb-1 ${textColorClass}`}>{icon}</div>
      <span className={`text-3xl font-extrabold tabular-nums ${textColorClass}`}>
        {value > 0 ? `${prefix}${value}` : "0"}
      </span>
      <p className="text-[10px] text-muted-foreground text-center leading-tight mt-1">{label}</p>
    </motion.div>
  );
}
