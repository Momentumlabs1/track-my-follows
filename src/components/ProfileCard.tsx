import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronRight } from "lucide-react";
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
      .filter(e => e.event_type === "new_follow" && !e.is_initial)
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
      .slice(0, 3);
  }, [followEvents]);

  // Gender stats
  const genderBar = useMemo(() => {
    const total = (profile.gender_female_count || 0) + (profile.gender_male_count || 0) + (profile.gender_unknown_count || 0);
    const baselineComplete = profile.baseline_complete !== false;
    if (total === 0 && !baselineComplete) return { loading: true };
    if (total === 0) return null;
    const fPct = Math.round(((profile.gender_female_count || 0) / total) * 100);
    const mPct = Math.round(((profile.gender_male_count || 0) / total) * 100);
    const uPct = 100 - fPct - mPct;
    return { fPct, mPct, uPct, baselineComplete };
  }, [profile]);

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
      {/* Spy highlight: subtle neon glow border */}
      {isSpyHighlighted && (
        <>
          <div
            className="absolute -inset-[1px] rounded-2xl pointer-events-none z-10"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.6), hsl(var(--accent) / 0.4), hsl(var(--primary) / 0.6))",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              WebkitMaskComposite: "xor",
              padding: "1px",
              borderRadius: "1rem",
            }}
          />
          <div className="absolute -inset-[1px] rounded-2xl pointer-events-none z-[9] blur-lg opacity-20"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
          />
        </>
      )}

      {/* Drop target pulsing border */}
      {isDropTarget && (
        <motion.div
          className="absolute -inset-[2px] rounded-2xl border border-primary/60 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <button
        onClick={() => onTap(profileId)}
        className="w-full text-start rounded-2xl p-5"
        style={{
          background: isSpyHighlighted
            ? "hsl(var(--card) / 0.7)"
            : "hsl(var(--card) / 0.5)",
          backdropFilter: "blur(24px) saturate(150%)",
          WebkitBackdropFilter: "blur(24px) saturate(150%)",
          border: isSpyHighlighted
            ? "none"
            : "1px solid hsl(0 0% 100% / 0.05)",
          boxShadow: isSpyHighlighted
            ? "0 0 24px -8px hsl(var(--primary) / 0.2), inset 0 1px 0 hsl(0 0% 100% / 0.04)"
            : "0 2px 12px hsl(0 0% 0% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.03)",
        }}
      >
        {/* Header: Avatar + Username + Last Scan */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="relative flex-shrink-0">
            <motion.div
              animate={isDropTarget ? { rotate: [0, -4, 4, 0] } : { rotate: 0 }}
              transition={isDropTarget ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
            >
              <div
                className="rounded-full p-[1.5px]"
                style={{
                  background: isSpyHighlighted
                    ? "linear-gradient(135deg, hsl(var(--primary) / 0.5), hsl(var(--accent) / 0.5))"
                    : "hsl(0 0% 100% / 0.08)",
                }}
              >
                <div className="rounded-full bg-card p-[1px]">
                  <InstagramAvatar
                    src={profile.avatar_url}
                    alt={profile.username}
                    fallbackInitials={profile.username}
                    size={44}
                  />
                </div>
              </div>
            </motion.div>
            {isSpyHighlighted && (
              <div
                className="absolute -top-1 -right-1 z-20 rounded-full p-[2px] shadow-sm"
                style={{ background: "hsl(var(--card))" }}
              >
                <SpyIcon size={16} glow />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-foreground truncate">@{profile.username}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              {t("spy.last_scan")}: {timeAgo(profile.last_scanned_at)}
            </p>
          </div>

          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0 rtl:rotate-180" />
        </div>

        {/* Recently Followed Section */}
        <div
          className="rounded-xl p-3 mb-4"
          style={{
            background: "hsl(0 0% 100% / 0.03)",
            border: "1px solid hsl(0 0% 100% / 0.05)",
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">
              {t("profile_detail.tab_following", "Zuletzt gefolgt")}
            </span>
          </div>

          {recentFollows.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {recentFollows.map((event) => {
                const isRecent = Date.now() - new Date(event.detected_at).getTime() < 24 * 60 * 60 * 1000;
                return (
                  <div key={event.id} className="flex flex-col items-center min-w-[60px]">
                    <div className="relative">
                      <div
                        className="w-[52px] h-[52px] rounded-xl overflow-hidden"
                        style={{ background: "hsl(var(--muted) / 0.6)" }}
                      >
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
                        <span
                          className="absolute -top-1 -right-1 text-[7px] font-bold px-1 py-[1px] rounded-md"
                          style={{
                            background: "hsl(var(--primary))",
                            color: "hsl(var(--primary-foreground))",
                          }}
                        >
                          {t("events.new_badge", "NEU")}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground/60 mt-1 truncate max-w-[60px] text-center">
                      @{event.target_username}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground/50">
              {t("profile_card.no_new_follows", "Keine neuen Follows seit dem letzten Scan")}
            </p>
          )}
        </div>

        {/* Gender Bar – thinner, cleaner */}
        {genderBar && (
          <div className="flex items-center gap-2.5">
            {genderBar.loading ? (
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground/50" />
                <span className="text-[9px] text-muted-foreground/50">{t("gender_analysis_running")}</span>
              </div>
            ) : (
              <>
                <div
                  className="flex h-[3px] flex-1 rounded-full overflow-hidden"
                  style={{ background: "hsl(0 0% 100% / 0.06)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${genderBar.fPct}%`,
                      background: "linear-gradient(90deg, hsl(330 60% 55%), hsl(340 70% 60%))",
                    }}
                  />
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${genderBar.mPct}%`,
                      background: "linear-gradient(90deg, hsl(200 70% 50%), hsl(185 65% 48%))",
                    }}
                  />
                </div>
                <span className="text-[8px] text-muted-foreground/50 tabular-nums flex-shrink-0 font-medium">
                  {genderBar.fPct}% · {genderBar.mPct}%
                  {genderBar.uPct > 0 && ` · ${genderBar.uPct}%`}
                </span>
                {!genderBar.baselineComplete && <span className="text-[8px] text-muted-foreground/40">~</span>}
              </>
            )}
          </div>
        )}
      </button>
    </motion.div>
  );
});
