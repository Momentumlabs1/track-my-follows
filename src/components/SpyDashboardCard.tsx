import { motion } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SpyIcon } from "@/components/SpyIcon";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { TrackedProfile } from "@/hooks/useTrackedProfiles";

function formatCount(n: number | null | undefined): string {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

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

function nextScanIn(lastScannedAt: string | null): string {
  if (!lastScannedAt) return "—";
  const nextScan = new Date(new Date(lastScannedAt).getTime() + 60 * 60 * 1000);
  const diff = nextScan.getTime() - Date.now();
  if (diff <= 0) return "Jetzt";
  const mins = Math.ceil(diff / 60000);
  return `${mins} Min.`;
}

interface SpyDashboardCardProps {
  spyProfile: TrackedProfile | null;
  onMoveSpy: () => void;
}

export function SpyDashboardCard({ spyProfile, onMoveSpy }: SpyDashboardCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const timeAgo = useTimeAgo();

  if (!spyProfile) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-4 mb-4"
      >
        <div className="rounded-2xl border border-dashed border-primary/30 bg-card/60 p-6 text-center">
          <motion.div
            className="flex justify-center mb-3"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <SpyIcon size={56} glow />
          </motion.div>
          <p className="text-[14px] font-bold text-foreground">{t("spy.assign_your_spy")}</p>
          <p className="text-[12px] text-muted-foreground mt-1">{t("spy.spy_description")}</p>
        </div>
      </motion.div>
    );
  }

  const profileAny = spyProfile as Record<string, unknown>;
  const pushRemaining = (profileAny.push_scans_today as number) ?? 4;
  const unfollowRemaining = (profileAny.unfollow_scans_today as number) ?? 1;
  const spyName = (profileAny.spy_name as string) || "Spion 🕵️";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-4 mb-4"
    >
      {/* Section header */}
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
          🕵️ {t("spy_detail.your_spy", "Dein Spion")}
        </span>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] to-card p-4 shadow-[0_0_30px_-8px_hsl(var(--primary)/0.18)]">
        {/* Two column layout */}
        <div className="flex gap-3">
          {/* LEFT: Watched profile */}
          <button
            onClick={() => navigate(`/profile/${spyProfile.id}`)}
            className="flex-1 rounded-xl bg-background/50 p-3 text-start hover:bg-background/70 transition-colors active:scale-[0.98]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="ring-2 ring-primary/40 rounded-full p-[2px] mb-2">
                <InstagramAvatar
                  src={spyProfile.avatar_url}
                  alt={spyProfile.username}
                  fallbackInitials={spyProfile.username}
                  size={52}
                />
              </div>
              <p className="text-[13px] font-bold text-foreground truncate w-full">@{spyProfile.username}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                <span>{formatCount(spyProfile.follower_count)} Follower</span>
                <span>{formatCount(spyProfile.following_count)} Folgt</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                {t("spy.last_scan")}: {timeAgo(spyProfile.last_scanned_at)}
              </p>
            </div>
          </button>

          {/* RIGHT: Spy character */}
          <button
            onClick={() => navigate("/spy")}
            className="flex-1 rounded-xl bg-background/50 p-3 text-start hover:bg-background/70 transition-colors active:scale-[0.98]"
          >
            <div className="flex flex-col items-center text-center">
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <SpyIcon size={52} glow />
              </motion.div>
              <p className="text-[13px] font-bold text-foreground mt-2 truncate w-full">{spyName}</p>
              
              {/* Scan budget badges */}
              <div className="flex flex-col gap-1 mt-2 w-full">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                  🔍 {pushRemaining}/4 Scans
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                  👁 {unfollowRemaining}/1 Unfollow
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1 mt-2">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-semibold text-green-400">{t("spy.active")}</span>
              </div>
            </div>
          </button>
        </div>

        {/* Bottom: Next scan */}
        <div className="mt-3 pt-3 border-t border-primary/10 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            {t("spy_detail.next_auto_scan", "Nächster Auto-Scan")}: {nextScanIn(spyProfile.last_scanned_at)}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveSpy();
            }}
            className="text-[11px] font-semibold text-primary flex items-center gap-1 hover:underline"
          >
            <SpyIcon size={14} /> {t("spy.move_spy")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
