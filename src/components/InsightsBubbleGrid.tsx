import { useMemo } from "react";
import { motion } from "framer-motion";
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
    const recentNewFollowers = followerEvents.filter(
      (e) => e.event_type === "gained" && !e.is_initial && new Date(e.detected_at).getTime() >= sevenDaysAgo
    );
    const recentLostFollowers = followerEvents.filter(
      (e) => e.event_type === "lost" && new Date(e.detected_at).getTime() >= sevenDaysAgo
    );

    const recentFollowUsernames = new Set(recentFollows.map((e) => e.target_username));
    const recentFollowingsWithGender = profileFollowings.filter((f) =>
      recentFollowUsernames.has(f.following_username) ||
      new Date(f.first_seen_at).getTime() >= sevenDaysAgo
    );

    const femaleFollows: Array<{ username: string; avatar?: string | null }> = [];
    const maleFollows: Array<{ username: string; avatar?: string | null }> = [];
    let unknownCount = 0;

    for (const ev of recentFollows) {
      const evGender = (ev as any).gender_tag as string | undefined;
      const matching = recentFollowingsWithGender.find((f) => f.following_username === ev.target_username);
      const gender = matching?.gender_tag || evGender || "unknown";
      const entry = { username: ev.target_username, avatar: matching?.following_avatar_url || ev.target_avatar_url };
      if (gender === "female") femaleFollows.push(entry);
      else if (gender === "male") maleFollows.push(entry);
      else unknownCount++;
    }

    return { newFollows: recentFollows.length, newUnfollows: recentUnfollows.length, newFollowers: recentNewFollowers.length, lostFollowers: recentLostFollowers.length, femaleFollows, maleFollows, unknownCount };
  }, [followEvents, followerEvents, profileFollowings, sevenDaysAgo]);

  const trackingDays = Math.floor((now - new Date(profileCreatedAt).getTime()) / (24 * 60 * 60 * 1000));
  const isNew = trackingDays < 7;
  const totalActivity = stats.newFollows + stats.newUnfollows + stats.newFollowers + stats.lostFollowers;

  // Empty states
  if (totalActivity === 0) {
    return (
      <div className="native-card p-6 text-center">
        <p className="section-header mb-2">
          {isNew ? t("insights_7d.since_days", { days: trackingDays }) : t("insights_7d.title")}
        </p>
        <p className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>
          {isNew ? t("insights_7d.building_data", { days: 7 - trackingDays }) : t("insights_7d.no_activity")}
        </p>
        {!isNew && (
          <p className="text-muted-foreground mt-1" style={{ fontSize: '0.875rem' }}>{t("insights_7d.spy_watching")}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section header */}
      <p className="section-header">{t("insights_7d.title")}</p>

      {/* ─── Story Cards ─── */}

      {/* Gender story: "Folgt X neuen Frauen / Männern" */}
      {(stats.femaleFollows.length > 0 || stats.maleFollows.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="native-card overflow-hidden"
        >
          {stats.femaleFollows.length > 0 && (
            <StoryRow
              number={stats.femaleFollows.length}
              label={t("insights_7d.new_women_followed")}
              symbol="♀"
              accentClass="text-primary"
              avatars={stats.femaleFollows}
            />
          )}
          {stats.maleFollows.length > 0 && (
            <StoryRow
              number={stats.maleFollows.length}
              label={t("insights_7d.new_men_followed")}
              symbol="♂"
              accentClass="text-brand-blue"
              avatars={stats.maleFollows}
            />
          )}
        </motion.div>
      )}

      {/* Follow/Unfollow activity */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="native-card overflow-hidden"
      >
        <StatRow
          value={stats.newFollows}
          prefix="+"
          label={t("insights_7d.new_follows_total")}
          accentClass="text-brand-green"
        />
        {stats.newUnfollows > 0 && (
          <StatRow
            value={stats.newUnfollows}
            prefix="-"
            label={t("insights_7d.unfollows")}
            accentClass="text-destructive"
          />
        )}
      </motion.div>

      {/* Follower changes */}
      {(stats.newFollowers > 0 || stats.lostFollowers > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="native-card overflow-hidden"
        >
          {stats.newFollowers > 0 && (
            <StatRow
              value={stats.newFollowers}
              prefix="+"
              label={t("insights_7d.new_followers")}
              accentClass="text-brand-green"
            />
          )}
          {stats.lostFollowers > 0 && (
            <StatRow
              value={stats.lostFollowers}
              prefix="-"
              label={t("insights_7d.lost_followers")}
              accentClass="text-destructive"
            />
          )}
        </motion.div>
      )}

      {/* Unknown accounts note */}
      {stats.unknownCount > 0 && (
        <p className="text-muted-foreground px-1" style={{ fontSize: '0.8125rem' }}>
          {t("insights_7d.not_analyzed", { count: stats.unknownCount })}
        </p>
      )}
    </div>
  );
}

/* ─── Story row with avatars ─── */
function StoryRow({
  number, label, symbol, accentClass, avatars,
}: {
  number: number;
  label: string;
  symbol: string;
  accentClass: string;
  avatars: Array<{ username: string; avatar?: string | null }>;
}) {
  const maxVisible = 5;
  const visible = avatars.slice(0, maxVisible);
  const remaining = number - maxVisible;

  return (
    <div className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: '0.5px solid hsl(var(--hairline))' }}>
      {/* Big number + symbol */}
      <div className="flex items-baseline gap-1 flex-shrink-0" style={{ minWidth: '48px' }}>
        <span className={`font-bold font-mono-num ${accentClass}`} style={{ fontSize: '1.75rem', lineHeight: 1 }}>{number}</span>
        <span className={`font-semibold ${accentClass}`} style={{ fontSize: '1rem' }}>{symbol}</span>
      </div>

      {/* Label + avatars */}
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-medium mb-2" style={{ fontSize: '0.875rem' }}>{label}</p>
        <div className="flex items-center gap-1">
          {visible.map((a) => (
            <a
              key={a.username}
              href={`https://instagram.com/${a.username}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`@${a.username}`}
              className="flex-shrink-0"
            >
              <InstagramAvatar src={a.avatar} alt={a.username} fallbackInitials={a.username} size={28} />
            </a>
          ))}
          {remaining > 0 && (
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-muted-foreground font-bold" style={{ fontSize: '0.625rem' }}>+{remaining}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Simple stat row ─── */
function StatRow({
  value, prefix, label, accentClass,
}: {
  value: number;
  prefix: string;
  label: string;
  accentClass: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: '0.5px solid hsl(var(--hairline))' }}>
      <span className={`font-bold font-mono-num flex-shrink-0 ${accentClass}`} style={{ fontSize: '1.75rem', lineHeight: 1, minWidth: '48px' }}>
        {value > 0 ? `${prefix}${value}` : "0"}
      </span>
      <p className="text-foreground font-medium" style={{ fontSize: '0.875rem' }}>{label}</p>
    </div>
  );
}
