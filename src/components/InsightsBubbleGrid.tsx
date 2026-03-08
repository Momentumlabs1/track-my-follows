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
      const entry = {
        username: ev.target_username,
        avatar: matching?.following_avatar_url || ev.target_avatar_url,
      };
      if (gender === "female") femaleFollows.push(entry);
      else if (gender === "male") maleFollows.push(entry);
      else unknownCount++;
    }

    return { newFollows: recentFollows.length, newUnfollows: recentUnfollows.length, newFollowers: recentNewFollowers.length, lostFollowers: recentLostFollowers.length, femaleFollows, maleFollows, unknownCount };
  }, [followEvents, followerEvents, profileFollowings, sevenDaysAgo]);

  const summaryLines = useMemo(() => {
    const lines: string[] = [];
    const totalGender = stats.femaleFollows.length + stats.maleFollows.length;
    if (totalGender > 0) {
      const femPct = Math.round((stats.femaleFollows.length / totalGender) * 100);
      if (femPct > 0) lines.push(t("insights_7d.gender_distribution", { percent: femPct }));
    }
    return lines;
  }, [stats, t]);

  const trackingDays = Math.floor((now - new Date(profileCreatedAt).getTime()) / (24 * 60 * 60 * 1000));
  const isNew = trackingDays < 7;
  const totalActivity = stats.newFollows + stats.newUnfollows + stats.newFollowers + stats.lostFollowers;

  if (totalActivity === 0) {
    if (isNew) {
      return (
        <div className="native-card p-5 text-center">
          <p className="section-header mb-3">📊 {t("insights_7d.since_days", { days: trackingDays })}</p>
          <p className="text-muted-foreground" style={{ fontSize: '0.8125rem' }}>
            {t("insights_7d.building_data", { days: 7 - trackingDays })}
          </p>
        </div>
      );
    }
    return (
      <div className="native-card p-5 text-center">
        <p className="section-header mb-3">📊 {t("insights_7d.title")}</p>
        <p className="text-muted-foreground" style={{ fontSize: '0.8125rem' }}>{t("insights_7d.no_activity")}</p>
        <p className="text-muted-foreground mt-1" style={{ fontSize: '0.8125rem' }}>{t("insights_7d.spy_watching")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="section-header">📊 {t("insights_7d.title")}</p>
        {stats.unknownCount > 0 && (
          <p className="text-muted-foreground mt-1" style={{ fontSize: '0.8125rem' }}>
            {t("insights_7d.not_analyzed", { count: stats.unknownCount })}
          </p>
        )}
      </div>

      {/* Bubble Grid */}
      <div className="grid grid-cols-2 gap-4">
        <GenderBubble
          count={stats.femaleFollows.length}
          label={t("insights_7d.new_women_followed")}
          symbol="♀"
          accentColor="text-primary"
          avatars={stats.femaleFollows}
          delay={0}
        />
        <GenderBubble
          count={stats.maleFollows.length}
          label={t("insights_7d.new_men_followed")}
          symbol="♂"
          accentColor="text-brand-blue"
          avatars={stats.maleFollows}
          delay={0.05}
        />
        <StatBubble
          value={stats.newFollows}
          prefix="+"
          label={t("insights_7d.new_follows_total")}
          accentColor="text-brand-green"
          icon={<TrendingUp className="h-5 w-5" />}
          delay={0.1}
        />
        <StatBubble
          value={stats.newUnfollows}
          prefix="-"
          label={t("insights_7d.unfollows")}
          accentColor="text-destructive"
          icon={<TrendingDown className="h-5 w-5" />}
          delay={0.15}
        />
        <StatBubble
          value={stats.newFollowers}
          prefix="+"
          label={t("insights_7d.new_followers")}
          accentColor="text-brand-green"
          icon={<TrendingUp className="h-5 w-5" />}
          delay={0.2}
        />
        <StatBubble
          value={stats.lostFollowers}
          prefix="-"
          label={t("insights_7d.lost_followers")}
          accentColor="text-destructive"
          icon={<TrendingDown className="h-5 w-5" />}
          delay={0.25}
        />
      </div>

      {/* Summary */}
      {summaryLines.length > 0 && (
        <div className="native-card p-5">
          <p className="section-header mb-3">📝 {t("insights_7d.summary")}</p>
          <ul className="space-y-2">
            {summaryLines.map((line, i) => (
              <li key={i} className="text-muted-foreground flex items-start gap-2" style={{ fontSize: '0.8125rem' }}>
                <span className="text-muted-foreground/50">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function GenderBubble({
  count, label, symbol, accentColor, avatars, delay,
}: {
  count: number;
  label: string;
  symbol: string;
  accentColor: string;
  avatars: Array<{ username: string; avatar?: string | null }>;
  delay: number;
}) {
  const maxVisible = 6;
  const visible = avatars.slice(0, maxVisible);
  const remaining = count - maxVisible;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.2 }}
      className="native-card p-5 flex flex-col items-center justify-center min-h-[160px]"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`font-bold ${accentColor}`} style={{ fontSize: '1.25rem' }}>{symbol}</span>
        <span className={`font-bold font-mono-num ${accentColor}`} style={{ fontSize: '2.5rem', lineHeight: 1 }}>{count}</span>
      </div>

      {visible.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 mb-3">
          {visible.map((a) => (
            <a
              key={a.username}
              href={`https://instagram.com/${a.username}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`@${a.username}`}
            >
              <InstagramAvatar src={a.avatar} alt={a.username} fallbackInitials={a.username} size={36} />
            </a>
          ))}
          {remaining > 0 && (
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground font-bold" style={{ fontSize: '0.6875rem' }}>+{remaining}</span>
            </div>
          )}
        </div>
      )}

      <p className="text-muted-foreground text-center leading-tight" style={{ fontSize: '0.8125rem' }}>{label}</p>
    </motion.div>
  );
}

function StatBubble({
  value, prefix, label, accentColor, icon, delay,
}: {
  value: number;
  prefix: string;
  label: string;
  accentColor: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.2 }}
      className="native-card p-5 flex flex-col items-center justify-center min-h-[120px]"
    >
      <div className={`mb-2 ${accentColor}`}>{icon}</div>
      <span className={`font-bold font-mono-num ${accentColor}`} style={{ fontSize: '2.5rem', lineHeight: 1 }}>
        {value > 0 ? `${prefix}${value}` : "0"}
      </span>
      <p className="text-muted-foreground text-center leading-tight mt-2" style={{ fontSize: '0.8125rem' }}>{label}</p>
    </motion.div>
  );
}
