import { memo } from "react";
import { motion } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { haptic } from "@/lib/native";
import type { UnifiedFeedEvent } from "@/pages/Dashboard";

interface EventFeedItemProps {
  event: UnifiedFeedEvent;
  index: number;
}

function useTimeAgoShort() {
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

function getVerb(event: UnifiedFeedEvent, t: ReturnType<typeof useTranslation>["t"]) {
  if (event.source === "follow") {
    if (event.event_type === "unfollow" || event.event_type === "unfollowed") {
      return { text: t("events.hasUnfollowed", "Entfolgt"), positive: false };
    }
    return { text: t("events.follows_now", "Neuer Follow"), positive: true };
  }
  if (event.event_type === "lost") {
    return { text: t("events.lostFollower", "Verloren"), positive: false };
  }
  return { text: t("events.newFollower", "Neuer Follower"), positive: true };
}

export const EventFeedItem = memo(function EventFeedItem({ event, index }: EventFeedItemProps) {
  const { t } = useTranslation();
  const { shouldBlur, showPaywall } = useSubscription();
  const navigate = useNavigate();
  const timeAgo = useTimeAgoShort();

  const trackedUsername = event.tracked_profiles?.username ?? "???";
  const trackedAvatar = event.tracked_profiles?.avatar_url ?? null;
  const isFollowSource = event.source === "follow";

  const otherUsername = isFollowSource ? (event.target_username || "???") : (event.username || "???");
  const otherAvatar = isFollowSource ? event.target_avatar_url : event.profile_pic_url;

  // For follow events, tracked profile is the actor (left side)
  const trackedIsActor = isFollowSource;
  const actorUsername = trackedIsActor ? trackedUsername : otherUsername;
  const actorAvatar = trackedIsActor ? trackedAvatar : otherAvatar;
  const targetUsername = trackedIsActor ? otherUsername : trackedUsername;
  const targetAvatar = trackedIsActor ? otherAvatar : trackedAvatar;

  const verb = getVerb(event, t);

  const handleTap = () => {
    if (shouldBlur) { showPaywall("blur"); return; }
    haptic.light();
    navigate(`/profile/${event.tracked_profile_id}`);
  };

  const renderAvatar = (username: string, avatar: string | null | undefined, isTracked: boolean, size: number) => (
    <div className="flex-shrink-0">
      {isTracked ? (
        <div className="rounded-xl overflow-hidden" style={{ padding: '2px', background: 'linear-gradient(135deg, hsl(var(--brand-pink)), hsl(var(--brand-rose)))' }}>
          <InstagramAvatar src={avatar} alt={username} fallbackInitials={username} size={size} className="!rounded-[10px]" />
        </div>
      ) : (
        <InstagramAvatar src={avatar} alt={username} fallbackInitials={username} size={size} />
      )}
    </div>
  );

  return (
    <motion.button
      initial={{ opacity: 0, x: -6 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.02, 0.12), duration: 0.22 }}
      className="relative w-full text-start rounded-2xl overflow-hidden active:scale-[0.97] transition-transform"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.15)" }}
      onClick={handleTap}
    >
      <div className={`flex items-center gap-3 p-3 ${shouldBlur ? "blur-md" : ""}`}>
        {/* Left: Actor avatar */}
        {renderAvatar(actorUsername, actorAvatar, trackedIsActor, 44)}

        {/* Center: names + verb */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate" style={{ fontSize: "0.875rem" }}>
            @{actorUsername}
          </p>
          <span
            className={`inline-block font-semibold mt-0.5 ${verb.positive ? "text-[hsl(var(--brand-green))]" : "text-destructive"}`}
            style={{ fontSize: "0.75rem" }}
          >
            {verb.text}
          </span>
          <p className="text-muted-foreground font-medium truncate" style={{ fontSize: "0.75rem" }}>
            @{targetUsername}
          </p>
        </div>

        {/* Time */}
        <span className="text-muted-foreground flex-shrink-0 self-start mt-1" style={{ fontSize: "0.625rem" }}>
          {timeAgo(event.detected_at)}
        </span>

        {/* Right: Target avatar */}
        {renderAvatar(targetUsername, targetAvatar, !trackedIsActor, 44)}
      </div>

      {/* Paywall overlay */}
      {shouldBlur && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
          <span className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 text-[0.8125rem]">
            <Lock className="h-3.5 w-3.5" /> {t("events.upgrade_to_reveal")}
          </span>
        </div>
      )}
    </motion.button>
  );
});
