import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SpyIcon } from "@/components/SpyIcon";
import { useTranslation } from "react-i18next";
import { useFollowEvents } from "@/hooks/useTrackedProfiles";
import type { TrackedProfile } from "@/hooks/useTrackedProfiles";

function useTimeAgo() {
  const { t } = useTranslation();
  return (dateStr: string | null): string => {
    if (!dateStr) return t("dashboard.never_scanned");
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("dashboard.just_now");
    if (mins < 60) return t("dashboard.minutes_ago", { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("dashboard.hours_ago", { count: hours });
    return t("dashboard.days_ago", { count: Math.floor(hours / 24) });
  };
}

interface ProfileCardProps {
  profile: TrackedProfile;
  hasSpy: boolean;
  profileId: string;
  onTap: (profileId: string) => void;
  onAssignSpy: (profileId: string) => void;
  index: number;
  isDragging?: boolean;
  isHovered?: boolean;
}

export const ProfileCard = memo(function ProfileCard({ profile, hasSpy, profileId, onTap, index, isDragging, isHovered }: ProfileCardProps) {
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();
  const { data: followEvents = [] } = useFollowEvents(profileId);

  const isDropTarget = isHovered === true;
  const isSpyHighlighted = !isDragging && hasSpy;

  const recentFollows = useMemo(() => {
    return followEvents
      .filter(e => e.event_type === "follow" && !e.is_initial)
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
      .slice(0, 4);
  }, [followEvents]);

  return (
    <motion.div
      data-profile-id={profile.id}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      animate={{ scale: isDropTarget ? 1.03 : 1 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
      viewport={{ once: true }}
      className="relative will-change-transform"
    >
      {/* Drop target pulsing border */}
      {isDropTarget && (
        <motion.div
          className="absolute -inset-[3px] rounded-2xl border-2 border-primary pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <button
        onClick={() => onTap(profileId)}
        className="native-card p-5 w-full text-start"
      >
        {/* Header: Avatar + Username + Last Scan */}
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <motion.div
              animate={isDropTarget ? { rotate: [0, -4, 4, 0] } : { rotate: 0 }}
              transition={isDropTarget ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
            >
              <InstagramAvatar
                src={profile.avatar_url}
                alt={profile.username}
                fallbackInitials={profile.username}
                size={44}
              />
            </motion.div>
            {isSpyHighlighted && (
              <div className="absolute -top-1 -right-1 z-20">
                <SpyIcon size={16} glow />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-foreground truncate" style={{ fontSize: '1rem' }}>@{profile.username}</p>
              {profile.is_private && (
                <span className="bg-destructive/15 text-destructive font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ fontSize: '0.6875rem' }}>🔒</span>
              )}
            </div>
            <p className="text-muted-foreground" style={{ fontSize: '0.8125rem' }}>
              {profile.is_private
                ? t("private_frozen_short", "Tracking eingefroren")
                : `${t("spy.last_scan")}: ${timeAgo(profile.last_scanned_at)}`
              }
            </p>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 rtl:rotate-180" />
        </div>

        {/* Recently Followed */}
        {recentFollows.length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: '0.5px solid hsl(var(--text-tertiary) / 0.15)' }}>
            <p className="section-header mb-3" style={{ fontSize: '0.6875rem' }}>
              {t("profile_detail.tab_following", "Zuletzt gefolgt")}
            </p>
            <div className="flex gap-3">
              {recentFollows.map((event) => (
                <div key={event.id} className="flex flex-col items-center min-w-0" style={{ width: '52px' }}>
                  <InstagramAvatar
                    src={event.target_avatar_url}
                    alt={event.target_username || ""}
                    fallbackInitials={event.target_username || "?"}
                    size={44}
                  />
                  <span className="text-muted-foreground mt-1 truncate max-w-full text-center" style={{ fontSize: '0.6875rem' }}>
                    @{event.target_username}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </button>
    </motion.div>
  );
});
