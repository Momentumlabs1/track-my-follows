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

  const getEventStyle = () => {
    if (isFollow && event.direction === "following") return { label: t("events.newFollowing"), color: "text-pink-600 dark:text-pink-400" };
    if (isFollow && event.direction === "follower") return { label: t("events.newFollower"), color: "text-emerald-600 dark:text-emerald-400" };
    if (!isFollow && event.direction === "following") return { label: t("events.hasUnfollowed"), color: "text-orange-600 dark:text-orange-400" };
    return { label: t("events.lostFollower"), color: "text-red-600 dark:text-red-400" };
  };
  const eventStyle = getEventStyle();

  const ev = event as Record<string, unknown>;
  const genderTag = ev.gender_tag as string | undefined;
  const isMutual = ev.is_mutual as boolean | undefined;
  const category = ev.category as string | undefined;

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

      <p className={`text-[13px] font-semibold ${eventStyle.color} mb-3`}>{eventStyle.label}</p>

      <div className="flex items-center gap-3 relative">
        <div className={shouldBlur ? "blur-sm" : ""}>
          <InstagramAvatar src={event.target_avatar_url} alt={event.target_username} fallbackInitials={event.target_username} size={48} className="ring-2 ring-border" />
        </div>
        <div className={`flex-1 min-w-0 ${shouldBlur ? "blur-sm" : ""}`}>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-foreground">@{event.target_username}</p>
            {genderTag === "female" && <span className="text-[11px]">👩</span>}
            {genderTag === "male" && <span className="text-[11px]">👨</span>}
          </div>
          {event.target_display_name && (
            <p className="text-[11px] text-muted-foreground truncate">{event.target_display_name}</p>
          )}
          {/* Badges */}
          <div className="flex flex-wrap gap-1 mt-1">
            {isMutual && (
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                🔄 {t("events.mutual")}
              </span>
            )}
            {category === "influencer" && (
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                ⭐ {t("category.influencer")}
              </span>
            )}
            {category === "celebrity" && (
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                👑 {t("category.celebrity")}
              </span>
            )}
            {category === "private" && (
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                🔒 {t("category.private")}
              </span>
            )}
          </div>
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
