import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  // Get last 3 new follows (non-initial)
  const recentFollows = useMemo(() => {
    return followEvents
      .filter(e => e.event_type === "follow" && !e.is_initial)
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
      .slice(0, 3);
  }, [followEvents]);




  return (
    <motion.div
      data-profile-id={profile.id}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      animate={{
        scale: isDropTarget ? 1.03 : 1,
      }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
      viewport={{ once: true }}
      className="relative will-change-transform"
    >
      {/* Spy highlight: gradient border + glow */}
      {isSpyHighlighted && (
        <>
          <div
            className="absolute -inset-[2px] rounded-2xl pointer-events-none z-10"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              WebkitMaskComposite: "xor",
              padding: "2px",
              borderRadius: "1rem",
            }}
          />
          <div className="absolute -inset-[2px] rounded-2xl pointer-events-none z-[9] blur-md opacity-40"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
          />
        </>
      )}

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
        className={`native-card p-4 w-full text-start ${isSpyHighlighted ? "!bg-primary/[0.08] shadow-[0_0_28px_-4px_hsl(var(--primary)/0.35)]" : ""}`}
      >
        {/* Header: Avatar + Username + Last Scan */}
        <div className="flex items-center gap-3 mb-3">
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
              <div className="absolute -top-1 -right-1 z-20 bg-card rounded-full p-[2px] shadow-sm">
                <SpyIcon size={16} glow />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-foreground truncate">@{profile.username}</p>
            <p className="text-[11px] text-muted-foreground">
              {t("spy.last_scan")}: {timeAgo(profile.last_scanned_at)}
            </p>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 rtl:rotate-180" />
        </div>

        {/* Recently Followed Section */}
        <div className="rounded-xl bg-primary/[0.06] border border-primary/10 p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-foreground/80">
              {t("profile_detail.tab_following", "Zuletzt gefolgt")}
            </span>
            <span className="text-[10px] text-primary">🔍</span>
          </div>

          {recentFollows.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {recentFollows.map((event) => {
                const isRecent = Date.now() - new Date(event.detected_at).getTime() < 24 * 60 * 60 * 1000;
                return (
                  <div key={event.id} className="flex flex-col items-center min-w-[60px]">
                    <div className="relative">
                      <div className="w-[52px] h-[52px] rounded-xl overflow-hidden bg-muted">
                        {event.target_avatar_url ? (
                          <img
                            src={event.target_avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[14px] font-bold">
                            {(event.target_username || "?").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {isRecent && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[7px] font-bold px-1 py-[1px] rounded-md">
                          {t("events.new_badge", "NEU")}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-1 truncate max-w-[60px] text-center">
                      @{event.target_username}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              {t("profile_card.no_new_follows", "Keine neuen Follows seit dem letzten Scan")}
            </p>
          )}
        </div>

      </button>
    </motion.div>
  );
});
