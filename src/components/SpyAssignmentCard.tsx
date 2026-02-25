import { motion } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SpyIcon } from "@/components/SpyIcon";
import { useTranslation } from "react-i18next";
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

function nextScanIn(lastScannedAt: string | null): string {
  if (!lastScannedAt) return "—";
  const nextScan = new Date(new Date(lastScannedAt).getTime() + 60 * 60 * 1000);
  const diff = nextScan.getTime() - Date.now();
  if (diff <= 0) return "Jetzt";
  const mins = Math.ceil(diff / 60000);
  return `${mins}min`;
}

interface SpyAssignmentCardProps {
  spyProfile: TrackedProfile | null;
  onMoveSpy: () => void;
}

export function SpyAssignmentCard({ spyProfile, onMoveSpy }: SpyAssignmentCardProps) {
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();

  if (!spyProfile) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-4 mb-4"
      >
        <div className="native-card p-5 border border-dashed border-primary/30 text-center">
          <motion.div
            className="block mb-2"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <SpyIcon size={36} />
          </motion.div>
          <p className="text-[14px] font-bold text-foreground">{t("spy.assign_your_spy")}</p>
          <p className="text-[12px] text-muted-foreground mt-1">{t("spy.spy_description")}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mx-4 mb-4"
    >
      <div className="relative overflow-hidden rounded-2xl gradient-pink p-[1px]">
        <div className="rounded-2xl bg-background/95 backdrop-blur-sm p-4">
          <div className="absolute top-0 end-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
            <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <SpyIcon size={22} />
              </motion.div>
              <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
                {t("spy.spy_watching")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-green-400">{t("spy.active")}</span>
            </div>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3 mb-3">
            <InstagramAvatar
              src={spyProfile.avatar_url}
              alt={spyProfile.username}
              fallbackInitials={spyProfile.username}
              size={44}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-foreground">@{spyProfile.username}</p>
              <p className="text-[11px] text-muted-foreground">
                {t("spy.last_scan")}: {timeAgo(spyProfile.last_scanned_at)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t("spy.next_scan")}: {nextScanIn(spyProfile.last_scanned_at)}
              </p>
            </div>
          </div>

          {/* Move Spy Button */}
          <button
            onClick={onMoveSpy}
            className="w-full py-2.5 rounded-xl border border-primary/20 text-primary text-[12px] font-semibold hover:bg-primary/5 transition-colors"
          >
            <SpyIcon size={14} className="inline" /> {t("spy.move_spy")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
