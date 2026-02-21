import { motion } from "framer-motion";
import { ArrowRight, UserPlus, UserMinus, BadgeCheck } from "lucide-react";
import type { FollowEvent } from "@/lib/mockData";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
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
  const isFollow = event.eventType === 'follow';

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className={`group flex items-center gap-3 rounded-lg surface-elevated border border-border/30 p-3 transition-all hover:border-primary/15 ${
        !event.isRead ? "border-l-2 border-l-primary" : ""
      }`}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <img
          src={event.profilePicUrl}
          alt={event.profileUsername}
          className="h-8 w-8 rounded-full object-cover flex-shrink-0 ring-1 ring-border"
        />

        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />

        <div className={`flex-shrink-0 rounded-md p-1 ${
          isFollow ? "bg-primary/10" : "bg-brand-rose/10"
        }`}>
          {isFollow ? (
            <UserPlus className="h-3 w-3 text-primary" />
          ) : (
            <UserMinus className="h-3 w-3 text-brand-rose" />
          )}
        </div>

        <img
          src={event.targetProfilePicUrl}
          alt={event.targetUsername}
          className="h-8 w-8 rounded-full object-cover flex-shrink-0 ring-1 ring-border"
        />

        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-tight">
            <span className="font-semibold">@{event.profileUsername}</span>
            <span className="text-muted-foreground">
              {isFollow ? " → " : " ✕ "}
            </span>
            <span className="font-semibold">
              @{event.targetUsername}
            </span>
            {event.targetIsVerified && (
              <BadgeCheck className="inline h-3 w-3 ml-0.5 text-primary" />
            )}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {isFollow ? "New follow" : "Unfollowed"}
          </p>
        </div>
      </div>

      <span className="text-mono text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 tabular-nums">
        {timeAgo(event.detectedAt)}
      </span>
    </motion.div>
  );
}
