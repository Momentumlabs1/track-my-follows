import { motion } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import type { FollowEvent } from "@/hooks/useTrackedProfiles";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface EventFeedItemProps {
  event: FollowEvent;
  index: number;
}

export function EventFeedItem({ event, index }: EventFeedItemProps) {
  const isFollow = event.event_type === "follow";
  const profileUsername = event.tracked_profiles?.username ?? "???";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="ios-card"
    >
      <div className="flex items-center gap-2 mb-2">
        <InstagramAvatar
          src={event.tracked_profiles?.avatar_url}
          alt={profileUsername}
          fallbackInitials={profileUsername}
          size={24}
        />
        <span className="text-[12px] font-semibold text-foreground">@{profileUsername}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(event.detected_at)}</span>
      </div>

      <p className="text-[13px] text-muted-foreground mb-3">
        {isFollow ? "Got followed by" : "Unfollowed"}
      </p>

      <div className="flex items-center gap-3">
        <InstagramAvatar
          src={event.target_avatar_url}
          alt={event.target_username}
          fallbackInitials={event.target_username}
          size={48}
          className="ring-2 ring-border"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">@{event.target_username}</p>
          {event.target_display_name && (
            <p className="text-[11px] text-muted-foreground truncate">{event.target_display_name}</p>
          )}
        </div>
        {!event.is_read && (
          <span className="tag-pink text-[10px]">NEW</span>
        )}
      </div>
    </motion.div>
  );
}
