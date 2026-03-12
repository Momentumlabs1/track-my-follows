import { memo } from "react";
import { motion } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Lock } from "lucide-react";
import type { UnifiedFeedEvent } from "@/pages/Dashboard";

interface EventFeedItemProps {
  event: UnifiedFeedEvent;
  index: number;
}

export const EventFeedItem = memo(function EventFeedItem({ event, index }: EventFeedItemProps) {
  const { t } = useTranslation();
  const { shouldBlur, showPaywall } = useSubscription();

  const trackedUsername = event.tracked_profiles?.username ?? "???";
  const trackedAvatar = event.tracked_profiles?.avatar_url ?? null;

  const isFollowSource = event.source === "follow";
  const otherUsername = isFollowSource ? (event.target_username || "???") : (event.username || "???");
  const otherAvatar = isFollowSource ? event.target_avatar_url : event.profile_pic_url;

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
      {/* Left: Tracked profile avatar (square, pink border) */}
      <div className={`flex-shrink-0 ${shouldBlur ? "blur-md" : ""}`}>
        <div className="rounded-xl overflow-hidden" style={{ padding: '2px', background: 'linear-gradient(135deg, hsl(var(--brand-pink)), hsl(var(--brand-rose)))' }}>
          <InstagramAvatar
            src={trackedAvatar}
            alt={trackedUsername}
            fallbackInitials={trackedUsername}
            size={52}
            className="!rounded-[10px]"
          />
        </div>
      </div>

      {/* Center: Verb only */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        <span
          className={`text-[0.875rem] font-bold ${
            verb.isPositive ? "text-brand-green" : "text-destructive"
          }`}
        >
          {verb.text}
        </span>
      </div>

      {/* Right: Username above avatar */}
      <div className={`flex-shrink-0 flex flex-col items-center gap-1 ${shouldBlur ? "blur-md" : ""}`}>
        <span className="text-[0.75rem] font-semibold text-muted-foreground truncate max-w-[90px]">
          @{otherUsername}
        </span>
        <InstagramAvatar
          src={otherAvatar}
          alt={otherUsername}
          fallbackInitials={otherUsername}
          size={50}
        />
      </div>

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
