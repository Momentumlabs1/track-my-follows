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

type EventStyle = { emoji: string; borderColor: string; label: string; badgeBg: string };

function getEventStyle(event: UnifiedFeedEvent, t: (k: string, d?: string) => string): EventStyle {
  if (event.source === "follow") {
    if (event.event_type === "unfollow" || event.event_type === "unfollowed") {
      return { emoji: "💔", borderColor: "hsl(4 90% 58%)", label: t("events.hasUnfollowed", "Entfolgt"), badgeBg: "hsl(4 90% 58% / 0.15)" };
    }
    return { emoji: "✅", borderColor: "hsl(142 71% 45%)", label: t("events.follows_now", "Neuer Follow"), badgeBg: "hsl(142 71% 45% / 0.15)" };
  }
  if (event.event_type === "lost") {
    return { emoji: "😢", borderColor: "hsl(25 95% 53%)", label: t("events.lostFollower", "Verloren"), badgeBg: "hsl(25 95% 53% / 0.15)" };
  }
  return { emoji: "👋", borderColor: "hsl(210 100% 56%)", label: t("events.newFollower", "Neuer Follower"), badgeBg: "hsl(210 100% 56% / 0.15)" };
}

export const EventFeedItem = memo(function EventFeedItem({ event, index }: EventFeedItemProps) {
  const { t } = useTranslation();
  const { shouldBlur, showPaywall } = useSubscription();
  const navigate = useNavigate();
  const timeAgo = useTimeAgoShort();

  const trackedUsername = event.tracked_profiles?.username ?? "???";
  const isFollowSource = event.source === "follow";

  // Actor = who did the action, target = who was affected
  const actorUsername = isFollowSource ? trackedUsername : (event.username || "???");
  const actorAvatar = isFollowSource ? (event.tracked_profiles?.avatar_url ?? null) : (event.profile_pic_url ?? null);
  const targetUsername = isFollowSource ? (event.target_username || "???") : trackedUsername;

  const style = getEventStyle(event, t);

  const handleTap = () => {
    if (shouldBlur) { showPaywall("blur"); return; }
    haptic.light();
    navigate(`/profile/${event.tracked_profile_id}`);
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.02, 0.12), duration: 0.2 }}
      className="relative w-full text-start rounded-xl overflow-hidden active:scale-[0.98] transition-transform"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.2)" }}
      onClick={handleTap}
    >
      {/* Colored left border */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: style.borderColor }} />

      <div className={`flex items-center gap-3 py-3 pl-4 pr-3 ${shouldBlur ? "blur-md" : ""}`}>
        {/* Emoji */}
        <span className="text-lg flex-shrink-0" style={{ width: 28, textAlign: "center" }}>{style.emoji}</span>

        {/* Avatar */}
        <div className="flex-shrink-0">
          <InstagramAvatar src={actorAvatar} alt={actorUsername} fallbackInitials={actorUsername} size={36} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold truncate" style={{ fontSize: "0.8125rem" }}>
            @{actorUsername}
          </p>
          <p className="text-muted-foreground truncate" style={{ fontSize: "0.6875rem" }}>
            {style.label} · @{targetUsername}
          </p>
        </div>

        {/* Time */}
        <span className="text-muted-foreground flex-shrink-0" style={{ fontSize: "0.625rem" }}>
          {timeAgo(event.detected_at)}
        </span>
      </div>

      {/* Paywall overlay */}
      {shouldBlur && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl">
          <span className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 text-[0.8125rem]">
            <Lock className="h-3.5 w-3.5" /> {t("events.upgrade_to_reveal")}
          </span>
        </div>
      )}
    </motion.button>
  );
});
