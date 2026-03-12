import { memo } from "react";
import { motion } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Lock, ChevronRight } from "lucide-react";
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

  // LEFT always follows RIGHT
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

  const AvatarBlock = ({ src, alt, username, isTracked, blur }: {
    src: string | null; alt: string; username: string; isTracked: boolean; blur: boolean;
  }) => (
    <div className={`flex flex-col items-center gap-1.5 ${blur ? "blur-md" : ""}`}>
      {isTracked ? (
        <div className="rounded-xl overflow-hidden" style={{ padding: '1.5px', background: 'linear-gradient(135deg, hsl(var(--brand-pink)), hsl(var(--brand-rose)))' }}>
          <InstagramAvatar src={src} alt={alt} fallbackInitials={username} size={48} className="!rounded-[10px]" />
        </div>
      ) : (
        <InstagramAvatar src={src} alt={alt} fallbackInitials={username} size={48} />
      )}
      <span className="text-[0.6875rem] text-muted-foreground truncate max-w-[90px]">
        @{username}
      </span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.02, 0.15), duration: 0.2 }}
      className="native-card p-4 relative"
    >
      <div className="flex items-center justify-center gap-5">
        {/* LEFT: the follower */}
        <AvatarBlock src={leftAvatar} alt={leftUsername} username={leftUsername} isTracked={leftIsTracked} blur={shouldBlur} />

        {/* CENTER: arrow + "folgt" */}
        <div className="flex flex-col items-center gap-0.5">
          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
          <span className="text-[0.625rem] text-muted-foreground/60">{t("events.follows_now")}</span>
        </div>

        {/* RIGHT: the followed */}
        <AvatarBlock src={rightAvatar} alt={rightUsername} username={rightUsername} isTracked={rightIsTracked} blur={shouldBlur} />
      </div>

      {/* Paywall overlay */}
      {shouldBlur && (
        <button onClick={() => showPaywall("blur")} className="absolute inset-0 flex items-center justify-center rounded-2xl">
          <span className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 text-[0.8125rem]">
            <Lock className="h-3.5 w-3.5" /> {t("events.upgrade_to_reveal")}
          </span>
        </button>
      )}
    </motion.div>
  );
});
