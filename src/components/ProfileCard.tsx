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
}

export function ProfileCard({ profile, hasSpy, onTap, onAssignSpy, index }: ProfileCardProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <button
        onClick={onTap}
        className="native-card p-4 w-full text-start"
      >
        <div className="flex items-center gap-3">
          {/* Avatar with Spy badge */}
          <div className="relative flex-shrink-0">
            <InstagramAvatar
              src={profile.avatar_url}
              alt={profile.username}
              fallbackInitials={profile.username}
              size={48}
            />
            {hasSpy && (
              <div className="absolute -top-1 -end-1 text-sm">🕵️</div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-bold text-foreground truncate">@{profile.username}</p>
              {hasSpy && (
                <span className="text-[9px] font-extrabold text-primary gradient-pink text-primary-foreground px-1.5 py-0.5 rounded-full">
                  SPY
                </span>
              )}
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

      {/* Assign Spy button (only when no spy) */}
      {!hasSpy && (
        <button
          onClick={(e) => { e.stopPropagation(); onAssignSpy(); }}
          className="w-full mt-1 py-2 rounded-xl border border-dashed border-primary/20 text-primary/60 text-[11px] font-medium hover:bg-primary/5 transition-colors"
        >
          🕵️ {t("spy.assign_spy_here")}
        </button>
      )}
    </motion.div>
  );
}
