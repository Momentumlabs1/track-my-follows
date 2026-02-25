import { motion } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import type { TrackedProfile } from "@/hooks/useTrackedProfiles";

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

interface ProfileCardProps {
  profile: TrackedProfile;
  hasSpy: boolean;
  onTap: () => void;
  onAssignSpy: () => void;
  index: number;
  isDragging?: boolean;
}

export function ProfileCard({ profile, hasSpy, onTap, index, isDragging }: ProfileCardProps) {
  const { t } = useTranslation();

  // During drag: current spy card gets strong highlight, others get subtle invite
  const isDropTarget = isDragging && !hasSpy;
  const isCurrentSpy = isDragging && hasSpy;

  return (
    <motion.div
      data-profile-id={profile.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isDropTarget ? 1.02 : isCurrentSpy ? 0.97 : 1,
      }}
      transition={{ delay: isDragging ? 0 : index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
      className="relative transition-all"
    >
      {/* Drop target glow ring for non-spy cards during drag */}
      {isDropTarget && (
        <motion.div
          className="absolute -inset-[2px] rounded-2xl border-2 border-primary/50 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Current spy card dimmed during drag */}
      {isCurrentSpy && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-muted/40 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
        />
      )}

      <button
        onClick={onTap}
        className="native-card p-4 w-full text-start"
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <motion.div
              animate={isDropTarget ? { rotate: [0, -3, 3, 0] } : {}}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <InstagramAvatar
                src={profile.avatar_url}
                alt={profile.username}
                fallbackInitials={profile.username}
                size={48}
              />
            </motion.div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-bold text-foreground truncate">@{profile.username}</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {formatCount(profile.follower_count ?? 0)} {t("dashboard.followers")} · {formatCount(profile.following_count ?? 0)} {t("dashboard.following")}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {hasSpy ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  <span className="text-[10px] text-green-400 font-medium">{t("spy.active")} · {t("spy.every_hour")}</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  <span className="text-[10px] text-muted-foreground">{t("spy.basic")} · 1×/{t("spy.day")}</span>
                </>
              )}
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 rtl:rotate-180" />
        </div>
      </button>
    </motion.div>
  );
}
