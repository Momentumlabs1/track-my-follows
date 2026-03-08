import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Clock } from "lucide-react";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SpyIcon } from "@/components/SpyIcon";
import { useTranslation } from "react-i18next";
import { useFollowEvents } from "@/hooks/useTrackedProfiles";
import type { TrackedProfile } from "@/hooks/useTrackedProfiles";

function useShortTimeAgo() {
  return (dateStr: string | null): string => {
    if (!dateStr) return "—";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "jetzt";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
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
  const shortTime = useShortTimeAgo();
  const { data: followEvents = [] } = useFollowEvents(profileId);

  const isDropTarget = isHovered === true;

  const recentFollows = useMemo(() => {
    return followEvents
      .filter(e => e.event_type === "follow" && !e.is_initial)
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
      .slice(0, 4);
  }, [followEvents]);

  const followerCount = profile.follower_count ?? profile.last_follower_count;
  const followingCount = profile.following_count ?? profile.last_following_count;

  return (
    <motion.div
      data-profile-id={profile.id}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      animate={{ scale: isDropTarget ? 1.02 : 1 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 25 }}
      viewport={{ once: true }}
      className="relative"
    >
      {isDropTarget && (
        <motion.div
          className="absolute -inset-[2px] rounded-2xl border-2 border-primary pointer-events-none z-10"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}

      <button
        onClick={() => onTap(profileId)}
        className="w-full text-start overflow-hidden card-pink"
      >
        {/* ═══ Profile Header ═══ */}
        <div className="p-4 pb-3">
          <div className="flex items-center gap-3.5">
            <div className="relative flex-shrink-0">
              <InstagramAvatar src={profile.avatar_url} alt={profile.username} fallbackInitials={profile.username} size={52} />
              {hasSpy && <div className="absolute -top-1 -end-1"><SpyIcon size={16} glow /></div>}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-foreground truncate" style={{ fontSize: '1rem' }}>
                  @{profile.username}
                </p>
                {profile.is_private && <span style={{ fontSize: '0.75rem' }}>🔒</span>}
              </div>

              {/* Stats row */}
              {!profile.is_private && (followerCount != null || followingCount != null) && (
                <div className="flex items-center gap-3 mt-1">
                  {followerCount != null && (
                    <span className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>
                      <span className="font-semibold text-foreground">{followerCount.toLocaleString()}</span> Follower
                    </span>
                  )}
                  {followingCount != null && (
                    <span className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>
                      <span className="font-semibold text-foreground">{followingCount.toLocaleString()}</span> Following
                    </span>
                  )}
                </div>
              )}
              {profile.is_private && (
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.75rem' }}>
                  {t("private_frozen_short", "Tracking eingefroren")} 🔒
                </p>
              )}
            </div>

            {/* Time + chevron */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {!profile.is_private && (
                <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: '0.6875rem' }}>
                  <Clock className="h-3 w-3" />
                  {shortTime(profile.last_scanned_at)}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
            </div>
          </div>
        </div>

        {/* ═══ Zuletzt gefolgt – rectangles via InstagramAvatar ═══ */}
        {recentFollows.length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-muted-foreground mb-2" style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              {t("profile_detail.tab_following", "Zuletzt gefolgt")}
            </p>
            <div className="flex gap-1.5">
              {recentFollows.map((event) => (
                <div
                  key={event.id}
                  className="flex-1 overflow-hidden rounded-lg bg-muted"
                  style={{ aspectRatio: '3/4' }}
                >
                  <InstagramAvatar
                    src={event.target_avatar_url}
                    alt={event.target_username || ""}
                    fallbackInitials={event.target_username || "?"}
                    size={200}
                    className="!rounded-none w-full h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </button>
    </motion.div>
  );
});
