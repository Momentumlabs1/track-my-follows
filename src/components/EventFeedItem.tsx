import { motion } from "framer-motion";
import { BadgeCheck, Heart, HeartCrack } from "lucide-react";
import type { FollowEvent } from "@/hooks/useTrackedProfiles";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `vor ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours}h`;
  return `vor ${Math.floor(hours / 24)}d`;
}

interface EventFeedItemProps {
  event: FollowEvent;
  index: number;
}

export function EventFeedItem({ event, index }: EventFeedItemProps) {
  const isFollow = event.event_type === 'follow';
  const profileUsername = event.tracked_profiles?.username ?? '???';
  const profileAvatar = event.tracked_profiles?.avatar_url || `https://ui-avatars.com/api/?name=${profileUsername}&background=random`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`group flex items-center gap-3.5 bento-card py-3.5 ${
        !event.is_read ? "border-l-2 border-l-primary" : ""
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="avatar-ring flex-shrink-0">
          <img
            src={profileAvatar}
            alt={profileUsername}
            className="h-9 w-9 rounded-full object-cover"
          />
        </div>

        <div className={`flex-shrink-0 rounded-xl p-2 ${
          isFollow ? "bg-primary/10 border border-primary/15" : "bg-destructive/10 border border-destructive/15"
        }`}>
          {isFollow ? (
            <Heart className="h-3 w-3 text-primary fill-primary" />
          ) : (
            <HeartCrack className="h-3 w-3 text-destructive" />
          )}
        </div>

        <img
          src={event.target_avatar_url || `https://ui-avatars.com/api/?name=${event.target_username}&background=random`}
          alt={event.target_username}
          className="h-9 w-9 rounded-full object-cover flex-shrink-0 ring-2 ring-border/30"
        />

        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-tight">
            <span className="font-bold">@{profileUsername}</span>
            <span className="text-muted-foreground">
              {isFollow ? " folgt jetzt " : " hat entfolgt "}
            </span>
            <span className="font-bold">@{event.target_username}</span>
          </p>
        </div>
      </div>

      <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 font-medium">
        {timeAgo(event.detected_at)}
      </span>
    </motion.div>
  );
}
