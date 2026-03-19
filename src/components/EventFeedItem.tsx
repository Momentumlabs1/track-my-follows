import { memo } from "react";
import { motion } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import { Lock, ChevronRight } from "lucide-react";
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

export const EventFeedItem = memo(function EventFeedItem({ event, index }: EventFeedItemProps) {
  const { t } = useTranslation();
  const { shouldBlur, showPaywall } = useSubscription();
  const navigate = useNavigate();
  const timeAgo = useTimeAgoShort();

  const trackedUsername = event.tracked_profiles?.username ?? "???";
  const trackedAvatar = event.tracked_profiles?.avatar_url ?? null;

  const isFollowSource = event.source === "follow";

  let leftUsername: string;
  let leftAvatar: string | null;
  let leftIsTracked: boolean;
  let rightUsername: string;
  let rightAvatar: string | null;
  let rightIsTracked: boolean;

  if (isFollowSource) {
    leftUsername = trackedUsername;
    leftAvatar = trackedAvatar;
    leftIsTracked = true;
    rightUsername = event.target_username || "???";
    rightAvatar = event.target_avatar_url ?? null;
    rightIsTracked = false;
  } else {
    leftUsername = event.username || "???";
    leftAvatar = event.profile_pic_url ?? null;
    leftIsTracked = false;
    rightUsername = trackedUsername;
    rightAvatar = trackedAvatar;
    rightIsTracked = true;
  }

  // Event type badge
  const getBadge = () => {
    if (isFollowSource) {
      if (event.event_type === "unfollow" || event.event_type === "unfollowed") {
        return { label: t("events.hasUnfollowed", "Entfolgt"), color: "hsl(4 90% 58%)" };
      }
      return { label: t("events.follows_now", "folgt jetzt"), color: "hsl(142 71% 45%)" };
    }
    if (event.event_type === "lost") {
      return { label: t("events.lostFollower", "Verloren"), color: "hsl(25 95% 53%)" };
    }
    return { label: t("events.newFollower", "Neuer Follower"), color: "hsl(210 100% 56%)" };
  };

  const badge = getBadge();

  const handleTap = () => {
    if (shouldBlur) {
      showPaywall("blur");
      return;
    }
    haptic.light();
    navigate(`/profile/${event.tracked_profile_id}`);
  };

  const AvatarBlock = ({ src, alt, username, isTracked, blur }: {
    src: string | null; alt: string; username: string; isTracked: boolean; blur: boolean;
  }) => (
    <div className={`flex flex-col items-center gap-1 ${blur ? "blur-md" : ""}`}>
      {isTracked ? (
        <div className="rounded-xl overflow-hidden" style={{ padding: '1.5px', background: 'linear-gradient(135deg, hsl(var(--brand-pink)), hsl(var(--brand-rose)))' }}>
          <InstagramAvatar src={src} alt={alt} fallbackInitials={username} size={44} className="!rounded-[10px]" />
        </div>
      ) : (
        <InstagramAvatar src={src} alt={alt} fallbackInitials={username} size={44} />
      )}
      <span className="text-[0.625rem] text-muted-foreground truncate max-w-[80px]">
        @{username}
      </span>
    </div>
  );

  return (
    <motion.button
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.02, 0.15), duration: 0.2 }}
      className="native-card p-3.5 relative w-full text-start"
      onClick={handleTap}
    >
      {/* Top row: badge + timestamp */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <span
          className="font-semibold rounded-full px-2 py-0.5"
          style={{ fontSize: '0.5625rem', background: `${badge.color}20`, color: badge.color }}
        >
          {badge.label}
        </span>
        <span className="text-[0.625rem] text-muted-foreground">
          {timeAgo(event.detected_at)}
        </span>
      </div>

      {/* Avatar row */}
      <div className="flex items-center justify-center gap-4">
        <AvatarBlock src={leftAvatar} alt={leftUsername} username={leftUsername} isTracked={leftIsTracked} blur={shouldBlur} />

        <div className="flex flex-col items-center gap-0.5">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
        </div>

        <AvatarBlock src={rightAvatar} alt={rightUsername} username={rightUsername} isTracked={rightIsTracked} blur={shouldBlur} />
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
