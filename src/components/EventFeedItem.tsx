import { memo } from "react";
import { motion } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Lock } from "lucide-react";
import type { UnifiedFeedEvent } from "@/pages/Dashboard";

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
  event: UnifiedFeedEvent;
  index: number;
}

export const EventFeedItem = memo(function EventFeedItem({ event, index }: EventFeedItemProps) {
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();
  const { shouldBlur, showPaywall } = useSubscription();
  const profileUsername = event.tracked_profiles?.username ?? "???";

  const isFollowSource = event.source === "follow";
  const targetUsername = isFollowSource ? (event.target_username || "???") : (event.username || "???");
  const targetAvatar = isFollowSource ? event.target_avatar_url : event.profile_pic_url;
  const targetDisplayName = isFollowSource ? event.target_display_name : event.full_name;
  const genderTag = event.gender_tag;
  const isMutual = event.is_mutual;
  const category = event.category;
  const followerCount = isFollowSource ? event.target_follower_count : event.follower_count;
  const isPrivate = event.target_is_private;

  const getEventInfo = () => {
    if (isFollowSource) {
      if (event.event_type === "unfollow" || event.event_type === "unfollowed") {
        return { verb: t("events.hasUnfollowed"), color: "text-destructive", icon: "🚩", accent: "border-s-destructive" };
      }
      return { verb: t("events.follows_now"), color: "text-primary", icon: "→", accent: "border-s-primary" };
    }
    if (event.event_type === "lost") {
      return { verb: t("events.lostFollower"), color: "text-destructive", icon: "↓", accent: "border-s-destructive" };
    }
    return { verb: t("events.new_follower_of"), color: "text-blue-400", icon: "←", accent: "border-s-blue-400" };
  };

  const eventInfo = getEventInfo();

  const getGenderColor = () => {
    if (genderTag === "female") return "gradient-pink";
    if (genderTag === "male") return "bg-blue-500";
    return "bg-muted-foreground";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.3 }}
      className={`native-card p-4 border-s-2 ${eventInfo.accent}`}
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
        <span className={`text-[12px] font-medium ${eventInfo.color}`}>
          {eventInfo.verb}
        </span>
        <span className="text-[11px] text-muted-foreground ms-auto">
          {timeAgo(event.detected_at)}
        </span>
      </div>

      {/* Main: Target profile */}
      <div className="flex items-center gap-3 relative">
        <div className="relative flex-shrink-0">
          <div className={shouldBlur ? "blur-md" : ""}>
            <InstagramAvatar
              src={targetAvatar}
              alt={targetUsername}
              fallbackInitials={targetUsername}
              size={50}
            />
          </div>
          {genderTag && genderTag !== "unknown" && (
            <div className={`absolute -bottom-0.5 -end-0.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] text-white ${getGenderColor()}`}>
              {genderTag === "female" ? "♀" : "♂"}
            </div>
          )}
        </div>

        <div className={`flex-1 min-w-0 ${shouldBlur ? "blur-md" : ""}`}>
          <a
            href={`https://instagram.com/${targetUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] font-bold text-foreground hover:text-primary transition-colors block"
          >
            @{targetUsername}
          </a>
          {targetDisplayName && (
            <p className="text-[12px] text-muted-foreground truncate">{targetDisplayName}</p>
          )}

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
});
