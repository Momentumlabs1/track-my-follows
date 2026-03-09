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

  // Determine which side is tracked (square pink) vs other (round)
  const renderAvatar = (
    username: string,
    avatar: string | null | undefined,
    isTracked: boolean,
    blur: boolean
  ) => {
    if (isTracked) {
      // Tracked = square, pink bg, larger
      return (
        <div className={`flex-shrink-0 ${blur ? "blur-md" : ""}`}>
          <div className="rounded-xl overflow-hidden" style={{ padding: '2px', background: 'linear-gradient(135deg, hsl(var(--brand-pink)), hsl(var(--brand-rose)))' }}>
             <InstagramAvatar
              src={avatar}
              alt={username}
              fallbackInitials={username}
              size={52}
              className="!rounded-[10px]"
            />
          </div>
        </div>
      );
    }
    // Other = round, normal
    return (
      <div className={`flex-shrink-0 ${blur ? "blur-md" : ""}`}>
         <InstagramAvatar
          src={avatar}
          alt={username}
          fallbackInitials={username}
          size={50}
        />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.02, 0.15), duration: 0.2 }}
      className="feed-row relative"
    >
      {/* Left: Actor avatar */}
      {renderAvatar(actorUsername, actorAvatar, trackedIsActor, shouldBlur && !trackedIsActor)}

      {/* Center: verb + names stacked */}
      <div className={`flex-1 min-w-0 ${shouldBlur ? "blur-md" : ""}`}>
        {/* Top line: actor username + verb */}
        <p className="text-[0.9375rem] leading-snug truncate">
          <span className="font-extrabold text-foreground">@{actorUsername}</span>
        </p>
        {/* Verb as colored badge-like text */}
        <span
          className={`inline-block text-[0.875rem] font-bold mt-0.5 ${
            verb.isPositive ? "text-brand-green" : "text-destructive"
          }`}
        >
          {verb.text}
        </span>
        {/* Target username below verb */}
        <p className="text-[0.875rem] text-muted-foreground font-semibold truncate mt-0.5">
          @{targetUsername}
        </p>
      </div>

      {/* Time + unread */}
      <div className="flex flex-col items-end flex-shrink-0 gap-1 self-start pt-0.5">
        <span className="text-muted-foreground text-[0.6875rem]">
          {event.is_initial ? t("initial_scan_label") : timeAgo(event.detected_at)}
        </span>
        {!event.is_read && !shouldBlur && (
          <span className="h-2 w-2 rounded-full bg-primary" />
        )}
      </div>

      {/* Right: Target avatar */}
      {renderAvatar(targetUsername, targetAvatar, !trackedIsActor, shouldBlur && trackedIsActor)}

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
