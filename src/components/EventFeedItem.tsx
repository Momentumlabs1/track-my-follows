import { motion } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Lock } from "lucide-react";
import type { FollowEvent } from "@/hooks/useTrackedProfiles";

function useTimeAgo() {
  const { t } = useTranslation();
  return (dateStr: string): string => {
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

interface EventFeedItemProps {
  event: FollowEvent;
  index: number;
}

export function EventFeedItem({ event, index }: EventFeedItemProps) {
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();
  const { shouldBlur, showPaywall } = useSubscription();
  const isFollow = event.event_type === "follow";
  const profileUsername = event.tracked_profiles?.username ?? "???";

  const ev = event as Record<string, unknown>;
  const genderTag = ev.gender_tag as string | undefined;
  const isMutual = ev.is_mutual as boolean | undefined;
  const category = ev.category as string | undefined;
  const followerCount = ev.target_follower_count as number | undefined;
  const isPrivate = ev.target_is_private as boolean | undefined;

  const getEventVerb = () => {
    if (isFollow && event.direction === "following") return t("events.newFollowing");
    if (isFollow && event.direction === "follower") return t("events.newFollower");
    if (!isFollow && event.direction === "following") return t("events.hasUnfollowed");
    return t("events.lostFollower");
  };

  const getGenderColor = () => {
    if (genderTag === "female") return "gradient-pink";
    if (genderTag === "male") return "bg-blue-500";
    return "bg-muted-foreground";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="native-card p-4"
    >
      {/* Header: Tracked profile + verb + time */}
      <div className="flex items-center gap-2 mb-3">
        <InstagramAvatar
          src={event.tracked_profiles?.avatar_url}
          alt={profileUsername}
          fallbackInitials={profileUsername}
          size={22}
        />
        <span className="text-[12px] font-semibold text-muted-foreground">
          {profileUsername}
        </span>
        <span className={`text-[12px] font-medium ${isFollow ? "text-primary" : "text-destructive"}`}>
          {getEventVerb()}
        </span>
        <span className="text-[11px] text-muted-foreground ms-auto">
          {timeAgo(event.detected_at)}
        </span>
      </div>

      {/* Main: Target profile */}
      <div className="flex items-center gap-3 relative">
        {/* Avatar with gender ring */}
        <div className="relative flex-shrink-0">
          <div className={shouldBlur ? "blur-md" : ""}>
            <InstagramAvatar
              src={event.target_avatar_url}
              alt={event.target_username}
              fallbackInitials={event.target_username}
              size={50}
            />
          </div>
          {genderTag && genderTag !== "unknown" && (
            <div className={`absolute -bottom-0.5 -end-0.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] text-white ${getGenderColor()}`}>
              {genderTag === "female" ? "♀" : "♂"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className={`flex-1 min-w-0 ${shouldBlur ? "blur-md" : ""}`}>
          <a
            href={`https://instagram.com/${event.target_username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] font-bold text-foreground hover:text-primary transition-colors block"
          >
            @{event.target_username}
          </a>
          {event.target_display_name && (
            <p className="text-[12px] text-muted-foreground truncate">{event.target_display_name}</p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {isMutual && (
              <span className="tag-red">🔄 {t("events.mutual")}</span>
            )}
            {category === "influencer" && (
              <span className="tag-yellow">⭐ {followerCount ? formatCount(followerCount) : t("category.influencer")}</span>
            )}
            {category === "celebrity" && (
              <span className="tag-yellow">👑 {followerCount ? formatCount(followerCount) : t("category.celebrity")}</span>
            )}
            {(category === "private" || isPrivate) && (
              <span className="tag-muted">🔒 {t("category.private")}</span>
            )}
            {!event.is_read && !shouldBlur && (
              <span className="tag-pink">{t("events.new_badge")}</span>
            )}
          </div>
        </div>

        {/* Blur overlay */}
        {shouldBlur && (
          <button
            onClick={() => showPaywall("blur")}
            className="absolute inset-0 flex items-center justify-center rounded-2xl"
          >
            <span className="gradient-pink text-primary-foreground text-[12px] font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> {t("events.upgrade_to_reveal")}
            </span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
