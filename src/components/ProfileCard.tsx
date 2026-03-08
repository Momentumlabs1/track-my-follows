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

  const recentFollows = useMemo(() => {
    return followEvents
      .filter(e => e.event_type === "follow" && !e.is_initial)
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
      .slice(0, 4);
  }, [followEvents]);

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

      <button onClick={() => onTap(profileId)} className="native-card w-full text-start overflow-hidden">
        {/* Main profile row */}
        <div className="flex items-center gap-3 p-4">
          <div className="relative flex-shrink-0">
            <InstagramAvatar src={profile.avatar_url} alt={profile.username} fallbackInitials={profile.username} size={48} />
            {hasSpy && <div className="absolute -top-1 -end-1"><SpyIcon size={16} glow /></div>}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-foreground truncate" style={{ fontSize: '0.9375rem' }}>@{profile.username}</p>
              {profile.is_private && <span className="text-destructive" style={{ fontSize: '0.6875rem' }}>🔒</span>}
            </div>
            <p className="text-muted-foreground" style={{ fontSize: '0.8125rem' }}>
              {profile.is_private ? t("private_frozen_short", "Tracking eingefroren") : timeAgo(profile.last_scanned_at)}
            </p>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 rtl:rotate-180" />
        </div>

        {/* Pink-tinted "Zuletzt gefolgt" sub-area */}
        {recentFollows.length > 0 && (
          <div className="bg-primary/5 dark:bg-primary/10 px-4 py-3 flex items-center justify-between rounded-b-2xl">
            <p className="text-muted-foreground flex-shrink-0" style={{ fontSize: '0.8125rem' }}>{t("profile_detail.tab_following", "Zuletzt gefolgt")}</p>
            <div className="flex -space-x-2">
              {recentFollows.map((event) => (
                <div key={event.id} className="flex-shrink-0 ring-[2.5px] ring-card rounded-full">
                  <InstagramAvatar src={event.target_avatar_url} alt={event.target_username || ""} fallbackInitials={event.target_username || "?"} size={40} />
                </div>
              ))}
            </div>
          </div>
        )}
      </button>
    </motion.div>
  );
});
