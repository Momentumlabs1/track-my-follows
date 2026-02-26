import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SpyIcon } from "@/components/SpyIcon";
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
  profileId: string;
  onTap: (profileId: string) => void;
  onAssignSpy: (profileId: string) => void;
  index: number;
  isDragging?: boolean;
  isHovered?: boolean;
}

export const ProfileCard = memo(function ProfileCard({ profile, hasSpy, profileId, onTap, index, isDragging, isHovered }: ProfileCardProps) {
  const { t } = useTranslation();

  const isDropTarget = isHovered === true;
  const isCurrentSpy = isDragging && hasSpy;
  const isSpyHighlighted = !isDragging && hasSpy;

  return (
    <motion.div
      data-profile-id={profile.id}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      animate={{
        scale: isDropTarget ? 1.02 : isCurrentSpy ? 0.98 : 1,
      }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
      viewport={{ once: true }}
      className="relative will-change-transform"
    >
      {/* Spy highlight: gradient border + strong pink glow */}
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

      {isCurrentSpy && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-muted/40 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
        />
      )}

      <button
        onClick={() => onTap(profileId)}
        className={`native-card p-4 w-full text-start ${isSpyHighlighted ? "!bg-primary/[0.08] shadow-[0_0_28px_-4px_hsl(var(--primary)/0.35)]" : ""}`}
      >
        <div className="flex items-center gap-3">
          {/* Avatar with SpyIcon badge */}
          <div className="relative flex-shrink-0">
            <motion.div
              animate={isDropTarget ? { rotate: [0, -4, 4, 0] } : { rotate: 0 }}
              transition={isDropTarget ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
            >
              <InstagramAvatar
                src={profile.avatar_url}
                alt={profile.username}
                fallbackInitials={profile.username}
                size={48}
              />
            </motion.div>
            {/* SpyIcon overlay badge */}
            {isSpyHighlighted && (
              <div className="absolute -top-1 -right-1 z-20 bg-card rounded-full p-[2px] shadow-sm">
                <SpyIcon size={16} glow />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-bold text-foreground truncate">@{profile.username}</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {formatCount(profile.follower_count ?? 0)} {t("dashboard.followers")} · {formatCount(profile.following_count ?? 0)} {t("dashboard.following")}
            </p>
            {/* Gender Mini-Bar */}
            {(() => {
              const total = (profile.gender_female_count || 0) + (profile.gender_male_count || 0) + (profile.gender_unknown_count || 0);
              const baselineComplete = profile.baseline_complete !== false;
              if (total === 0 && !baselineComplete) {
                return (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground">{t("gender_analysis_running")}</span>
                  </div>
                );
              }
              if (total === 0) return null;
              const fPct = Math.round(((profile.gender_female_count || 0) / total) * 100);
              const mPct = Math.round(((profile.gender_male_count || 0) / total) * 100);
              return (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex h-1 flex-1 rounded-full overflow-hidden bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${fPct}%` }} />
                    <div className="h-full bg-blue-400" style={{ width: `${mPct}%` }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground tabular-nums">♀{fPct}% ♂{mPct}%</span>
                  {!baselineComplete && <span className="text-[8px] text-muted-foreground/60">~</span>}
                </div>
              );
            })()}
            {/* Spy Status with animated transition */}
            <div className="flex items-center gap-1.5 mt-0.5 h-4 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                {hasSpy ? (
                  <motion.div
                    key="spy-active"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex items-center gap-1.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    <span className="text-[10px] text-green-400 font-medium">{t("spy.active")} · {t("spy.every_hour")}</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="spy-basic"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex items-center gap-1.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    <span className="text-[10px] text-muted-foreground">{t("spy.basic")} · 1×/{t("spy.day")}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 rtl:rotate-180" />
        </div>
      </button>
    </motion.div>
  );
});
