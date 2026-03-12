import { memo } from "react";
import { motion } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Lock, ArrowRight } from "lucide-react";
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

  // Determine LEFT (follower) and RIGHT (followed) accounts
  // LEFT always follows RIGHT
  let leftUsername: string;
  let leftAvatar: string | null;
  let leftIsTracked: boolean;
  let rightUsername: string;
  let rightAvatar: string | null;
  let rightIsTracked: boolean;

  if (isFollowSource) {
    // Tracked profile follows someone → tracked is LEFT, target is RIGHT
    leftUsername = trackedUsername;
    leftAvatar = trackedAvatar;
    leftIsTracked = true;
    rightUsername = event.target_username || "???";
    rightAvatar = event.target_avatar_url ?? null;
    rightIsTracked = false;
  } else {
    // Someone follows tracked profile → other person is LEFT, tracked is RIGHT
    leftUsername = event.username || "???";
    leftAvatar = event.profile_pic_url ?? null;
    leftIsTracked = false;
    rightUsername = trackedUsername;
    rightAvatar = trackedAvatar;
    rightIsTracked = true;
  }

  const AvatarWithBorder = ({ src, alt, username, isTracked, blur }: {
    src: string | null; alt: string; username: string; isTracked: boolean; blur: boolean;
  }) => (
    <div className={`flex-shrink-0 flex flex-col items-center gap-1 ${blur ? "blur-md" : ""}`}>
      <span className="text-[0.6875rem] font-semibold text-muted-foreground truncate max-w-[80px]">
        @{username}
      </span>
      {isTracked ? (
        <div className="rounded-xl overflow-hidden" style={{ padding: '2px', background: 'linear-gradient(135deg, hsl(var(--brand-pink)), hsl(var(--brand-rose)))' }}>
          <InstagramAvatar src={src} alt={alt} fallbackInitials={username} size={58} className="!rounded-[10px]" />
        </div>
      ) : (
        <InstagramAvatar src={src} alt={alt} fallbackInitials={username} size={58} />
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.02, 0.15), duration: 0.2 }}
      className="feed-row relative"
    >
      {/* LEFT: the follower */}
      <AvatarWithBorder src={leftAvatar} alt={leftUsername} username={leftUsername} isTracked={leftIsTracked} blur={shouldBlur} />

      {/* CENTER: arrow + "folgt" */}
      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0">
        <ArrowRight className="h-5 w-5 text-brand-green" />
        <span className="text-[0.6875rem] font-bold text-brand-green">{t("events.follows_now")}</span>
      </div>

      {/* RIGHT: the followed */}
      <AvatarWithBorder src={rightAvatar} alt={rightUsername} username={rightUsername} isTracked={rightIsTracked} blur={shouldBlur} />

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
