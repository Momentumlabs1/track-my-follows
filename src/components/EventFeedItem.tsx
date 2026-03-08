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

  const trackedUsername = event.tracked_profiles?.username ?? "???";
  const trackedAvatar = event.tracked_profiles?.avatar_url ?? null;

  const isFollowSource = event.source === "follow";
  const otherUsername = isFollowSource ? (event.target_username || "???") : (event.username || "???");
  const otherAvatar = isFollowSource ? event.target_avatar_url : event.profile_pic_url;

  // Determine direction: who is the actor?
  // "follow" source: tracked user follows/unfollows someone → tracked is actor (left)
  // "follower" source gained: someone follows tracked → other is actor (left)
  // "follower" source lost: someone unfollowed tracked → other is actor (left)
  const trackedIsActor = isFollowSource;

  const leftUsername = trackedIsActor ? trackedUsername : otherUsername;
  const leftAvatar = trackedIsActor ? trackedAvatar : otherAvatar;
  const rightUsername = trackedIsActor ? otherUsername : trackedUsername;
  const rightAvatar = trackedIsActor ? otherAvatar : trackedAvatar;

  const getVerb = () => {
    if (isFollowSource) {
      if (event.event_type === "unfollow" || event.event_type === "unfollowed") {
        return { text: t("events.hasUnfollowed"), color: "text-destructive", isNegative: true };
      }
      return { text: t("events.follows_now"), color: "text-brand-green", isNegative: false };
    }
    if (event.event_type === "lost") {
      return { text: t("events.lostFollower"), color: "text-destructive", isNegative: true };
    }
    return { text: t("events.new_follower_of"), color: "text-brand-green", isNegative: false };
  };

  const verb = getVerb();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.02, 0.15), duration: 0.2 }}
      className="feed-row relative"
    >
      {/* Left avatar (actor) – highlighted ring if it's our tracked account */}
      <div className={`flex-shrink-0 ${shouldBlur && !trackedIsActor ? "blur-md" : ""}`}>
        <div className={trackedIsActor ? "avatar-ring" : ""}>
          <InstagramAvatar
            src={leftAvatar}
            alt={leftUsername}
            fallbackInitials={leftUsername}
            size={trackedIsActor ? 44 : 40}
            className={trackedIsActor ? "ring-1 ring-background" : ""}
          />
        </div>
      </div>

      {/* Center: text */}
      <div className={`flex-1 min-w-0 ${shouldBlur ? "blur-md" : ""}`}>
        <p style={{ fontSize: '0.8125rem', lineHeight: 1.4 }}>
          <span className="font-bold text-foreground">@{leftUsername}</span>
          {" "}
          <span className={`font-medium ${verb.color}`}>{verb.text}</span>
        </p>
        <a
          href={`https://instagram.com/${rightUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-muted-foreground hover:text-foreground transition-colors"
          style={{ fontSize: '0.75rem' }}
        >
          @{rightUsername}
        </a>
      </div>

      {/* Right avatar (target) – highlighted ring if it's our tracked account */}
      <div className={`flex-shrink-0 ${shouldBlur && trackedIsActor ? "blur-md" : ""}`}>
        <div className={!trackedIsActor ? "avatar-ring" : ""}>
          <InstagramAvatar
            src={rightAvatar}
            alt={rightUsername}
            fallbackInitials={rightUsername}
            size={!trackedIsActor ? 44 : 36}
            className={!trackedIsActor ? "ring-1 ring-background" : "opacity-80"}
          />
        </div>
      </div>

      {/* Time + unread dot */}
      <div className="flex flex-col items-end flex-shrink-0 gap-1">
        <span className="text-muted-foreground" style={{ fontSize: '0.6875rem' }}>
          {event.is_initial ? t("initial_scan_label") : timeAgo(event.detected_at)}
        </span>
        {!event.is_read && !shouldBlur && (
          <span className="h-2 w-2 rounded-full bg-primary" />
        )}
      </div>

      {shouldBlur && (
        <button onClick={() => showPaywall("blur")} className="absolute inset-0 flex items-center justify-center">
          <span className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5" style={{ fontSize: '0.8125rem' }}>
            <Lock className="h-3.5 w-3.5" /> {t("events.upgrade_to_reveal")}
          </span>
        </button>
      )}
    </motion.div>
  );
});
