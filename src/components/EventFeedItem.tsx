import { motion } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/contexts/SubscriptionContext";
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

  const label = event.direction === "follower"
    ? (isFollow ? t("events.new_follower") : t("events.lost_follower"))
    : (isFollow ? t("events.now_following") : t("events.unfollowed"));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="ios-card"
    >
      <div className="flex items-center gap-2 mb-2">
        <InstagramAvatar src={event.tracked_profiles?.avatar_url} alt={profileUsername} fallbackInitials={profileUsername} size={24} />
        <span className="text-[12px] font-semibold text-foreground">@{profileUsername}</span>
        <span className="text-[10px] text-muted-foreground ms-auto">{timeAgo(event.detected_at)}</span>
      </div>

      <p className="text-[13px] text-muted-foreground mb-3">{label}</p>

      <div className="flex items-center gap-3 relative">
        <div className={shouldBlur ? "blur-sm" : ""}>
          <InstagramAvatar src={event.target_avatar_url} alt={event.target_username} fallbackInitials={event.target_username} size={48} className="ring-2 ring-border" />
        </div>
        <div className={`flex-1 min-w-0 ${shouldBlur ? "blur-sm" : ""}`}>
          <p className="text-sm font-bold text-foreground">@{event.target_username}</p>
          {event.target_display_name && (
            <p className="text-[11px] text-muted-foreground truncate">{event.target_display_name}</p>
          )}
        </div>
        {shouldBlur && (
          <button
            onClick={() => showPaywall("blur")}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="gradient-bg text-primary-foreground text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg">
              {t("events.upgrade_to_reveal")}
            </span>
          </button>
        )}
        {!shouldBlur && !event.is_read && (
          <span className="tag-pink text-[10px]">{t("events.new_badge")}</span>
        )}
      </div>
    </motion.div>
  );
}
