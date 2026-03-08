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

  const getVerb = () => {
    if (isFollowSource) {
      if (event.event_type === "unfollow" || event.event_type === "unfollowed") {
        return { text: t("events.hasUnfollowed"), color: "text-destructive" };
      }
      return { text: t("events.follows_now"), color: "text-foreground" };
    }
    if (event.event_type === "lost") {
      return { text: t("events.lostFollower"), color: "text-destructive" };
    }
    return { text: t("events.new_follower_of"), color: "text-foreground" };
  };

  const verb = getVerb();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ delay: Math.min(index * 0.03, 0.2), duration: 0.2 }}
      className="feed-row relative"
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 ${shouldBlur ? "blur-md" : ""}`}>
        <InstagramAvatar
          src={targetAvatar}
          alt={targetUsername}
          fallbackInitials={targetUsername}
          size={40}
        />
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${shouldBlur ? "blur-md" : ""}`}>
        <p style={{ fontSize: '1rem' }}>
          <span className="font-semibold text-foreground">@{profileUsername}</span>
          {" "}
          <span className={`${verb.color}`}>{verb.text}</span>
          {" "}
          <a
            href={`https://instagram.com/${targetUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground hover:text-primary transition-colors"
          >
            @{targetUsername}
          </a>
        </p>
      </div>

      {/* Timestamp */}
      <span className="text-muted-foreground flex-shrink-0" style={{ fontSize: '0.8125rem' }}>
        {event.is_initial ? t("initial_scan_label") : timeAgo(event.detected_at)}
      </span>

      {/* New dot */}
      {!event.is_read && !shouldBlur && (
        <span className="absolute top-4 end-5 h-2 w-2 rounded-full bg-primary" />
      )}

      {/* Blur paywall overlay */}
      {shouldBlur && (
        <button
          onClick={() => showPaywall("blur")}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5" style={{ fontSize: '0.8125rem' }}>
            <Lock className="h-3.5 w-3.5" /> {t("events.upgrade_to_reveal")}
          </span>
        </button>
      )}
    </motion.div>
  );
});
