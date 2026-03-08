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

  // Actor = who performed the action
  // Follow source: tracked user follows/unfollows someone → tracked is actor
  // Follower source gained: someone follows tracked → other is actor
  // Follower source lost: someone unfollowed tracked → other is actor
  const trackedIsActor = isFollowSource;

  const actorUsername = trackedIsActor ? trackedUsername : otherUsername;
  const actorAvatar = trackedIsActor ? trackedAvatar : otherAvatar;
  const targetUsername = trackedIsActor ? otherUsername : trackedUsername;
  const targetAvatar = trackedIsActor ? otherAvatar : trackedAvatar;

  const getVerb = () => {
    if (isFollowSource) {
      if (event.event_type === "unfollow" || event.event_type === "unfollowed") {
        return { text: t("events.hasUnfollowed"), isPositive: false };
      }
      return { text: t("events.follows_now"), isPositive: true };
    }
    if (event.event_type === "lost") {
      return { text: t("events.lostFollower"), isPositive: false };
    }
    return { text: t("events.new_follower_of"), isPositive: true };
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
      {/* Actor avatar (left, 44px) with status dot */}
      <div className={`relative flex-shrink-0 ${shouldBlur && !trackedIsActor ? "blur-md" : ""}`}>
        <div className={trackedIsActor ? "avatar-ring" : ""}>
          <InstagramAvatar
            src={actorAvatar}
            alt={actorUsername}
            fallbackInitials={actorUsername}
            size={44}
            className={trackedIsActor ? "ring-1 ring-background" : ""}
          />
        </div>
        {/* Color dot indicator */}
        <span
          className={`absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-background ${
            verb.isPositive ? "bg-brand-green" : "bg-destructive"
          }`}
        />
      </div>

      {/* Sentence: @actor verb @target */}
      <div className={`flex-1 min-w-0 ${shouldBlur ? "blur-md" : ""}`}>
        <p className="text-[0.8125rem] leading-snug">
          <span className="font-bold text-foreground">@{actorUsername}</span>
          {" "}
          <span className={`font-semibold ${verb.isPositive ? "text-brand-green" : "text-destructive"}`}>
            {verb.text}
          </span>
          {" "}
          <span className="font-bold text-foreground">@{targetUsername}</span>
        </p>
        <span className="text-muted-foreground text-[0.6875rem]">
          {event.is_initial ? t("initial_scan_label") : timeAgo(event.detected_at)}
        </span>
      </div>

      {/* Target avatar (right, 32px) */}
      <div className={`flex-shrink-0 ${shouldBlur && trackedIsActor ? "blur-md" : ""}`}>
        <div className={!trackedIsActor ? "avatar-ring-sm" : ""}>
          <InstagramAvatar
            src={targetAvatar}
            alt={targetUsername}
            fallbackInitials={targetUsername}
            size={32}
            className={!trackedIsActor ? "ring-1 ring-background" : "opacity-60"}
          />
        </div>
      </div>

      {/* Unread dot */}
      {!event.is_read && !shouldBlur && (
        <span className="absolute top-2 end-3 h-2 w-2 rounded-full bg-primary" />
      )}

      {/* Paywall overlay */}
      {shouldBlur && (
        <button onClick={() => showPaywall("blur")} className="absolute inset-0 flex items-center justify-center">
          <span className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 text-[0.8125rem]">
            <Lock className="h-3.5 w-3.5" /> {t("events.upgrade_to_reveal")}
          </span>
        </button>
      )}
    </motion.div>
  );
});
