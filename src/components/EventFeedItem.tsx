import { motion } from "framer-motion";
import { BadgeCheck, Heart, HeartCrack } from "lucide-react";
import type { FollowEvent } from "@/lib/mockData";

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
  const isFollow = event.eventType === 'follow';

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`group flex items-center gap-3.5 bento-card py-3.5 ${
        !event.isRead ? "border-l-2 border-l-primary" : ""
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="avatar-ring flex-shrink-0">
          <img
            src={event.profilePicUrl}
            alt={event.profileUsername}
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
          src={event.targetProfilePicUrl}
          alt={event.targetUsername}
          className="h-9 w-9 rounded-full object-cover flex-shrink-0 ring-2 ring-border/30"
        />

        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-tight">
            <span className="font-bold">@{event.profileUsername}</span>
            <span className="text-muted-foreground">
              {isFollow ? " folgt jetzt " : " hat entfolgt "}
            </span>
            <span className="font-bold">@{event.targetUsername}</span>
            {event.targetIsVerified && (
              <BadgeCheck className="inline h-3.5 w-3.5 ml-0.5 text-accent" />
            )}
          </p>
        </div>
      </div>

      <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 font-medium">
        {timeAgo(event.detectedAt)}
      </span>
    </motion.div>
  );
}
