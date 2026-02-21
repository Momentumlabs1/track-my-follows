import { motion } from "framer-motion";
import { ArrowRight, UserPlus, UserMinus, BadgeCheck } from "lucide-react";
import type { FollowEvent } from "@/lib/mockData";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  return `vor ${Math.floor(hours / 24)} Tagen`;
}

interface EventFeedItemProps {
  event: FollowEvent;
  index: number;
}

export function EventFeedItem({ event, index }: EventFeedItemProps) {
  const isFollow = event.eventType === 'follow';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`flex items-center gap-4 rounded-xl bg-card border border-border/50 p-4 transition-all hover:border-primary/20 ${
        !event.isRead ? "border-l-2 border-l-primary" : ""
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <img
          src={event.profilePicUrl}
          alt={event.profileUsername}
          className="h-10 w-10 rounded-full object-cover flex-shrink-0"
        />

        <div className="flex items-center gap-2 text-muted-foreground">
          <ArrowRight className="h-4 w-4 flex-shrink-0" />
        </div>

        <div className={`flex-shrink-0 rounded-full p-1.5 ${
          isFollow ? "bg-emerald-500/10" : "bg-destructive/10"
        }`}>
          {isFollow ? (
            <UserPlus className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <UserMinus className="h-3.5 w-3.5 text-destructive" />
          )}
        </div>

        <img
          src={event.targetProfilePicUrl}
          alt={event.targetUsername}
          className="h-10 w-10 rounded-full object-cover flex-shrink-0"
        />

        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-semibold">@{event.profileUsername}</span>
            <span className="text-muted-foreground">
              {isFollow ? " folgt jetzt " : " hat entfolgt: "}
            </span>
            <span className="font-semibold">
              @{event.targetUsername}
              {event.targetIsVerified && (
                <BadgeCheck className="inline h-3.5 w-3.5 ml-1 text-primary" />
              )}
            </span>
          </p>
        </div>
      </div>

      <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
        {timeAgo(event.detectedAt)}
      </span>
    </motion.div>
  );
}
