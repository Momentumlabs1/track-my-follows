import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

interface SpyAgentCardProps {
  spyProfile: TrackedProfile | null;
  onMoveSpy: () => void;
  onDragMoveSpy: (profileId: string) => void;
  isDragging: boolean;
  onDragStateChange: (dragging: boolean) => void;
}

export function SpyAgentCard({
  spyProfile,
  onMoveSpy,
  onDragMoveSpy,
  isDragging,
  onDragStateChange,
}: SpyAgentCardProps) {
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();
  const [dropSuccess, setDropSuccess] = useState(false);

  if (!spyProfile) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-4 mb-4"
      >
        <div className="native-card p-6 border border-dashed border-primary/30 text-center">
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mx-4 mb-4 relative"
    >
      <div className="native-card p-4 relative overflow-visible">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
            {t("spy.spy_watching")}
          </span>
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse ms-auto" />
          <span className="text-[10px] font-semibold text-green-400">{t("spy.active")}</span>
        </div>

        {/* Profile info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={spyProfile.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 mb-3"
          >
            <InstagramAvatar
              src={spyProfile.avatar_url}
              alt={spyProfile.username}
              fallbackInitials={spyProfile.username}
              size={48}
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
          </motion.div>
        </AnimatePresence>

        {/* Move Spy Button (fallback) */}
        <button
          onClick={onMoveSpy}
          className="w-full py-2.5 rounded-xl border border-primary/20 text-primary text-[12px] font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
        >
          <SpyIcon size={16} /> {t("spy.move_spy")}
        </button>

        {/* Draggable Spy Icon – overlapping sticker */}
        <motion.div
          drag
          dragSnapToOrigin
          dragElastic={0.2}
          dragMomentum={false}
          whileDrag={{ scale: 1.25, zIndex: 9999 }}
          onDragStart={() => onDragStateChange(true)}
          onDragEnd={(_, info) => {
            onDragStateChange(false);
            const el = document.elementFromPoint(info.point.x, info.point.y);
            const dropTarget = el?.closest("[data-profile-id]");
            if (dropTarget) {
              const profileId = dropTarget.getAttribute("data-profile-id");
              if (profileId && profileId !== spyProfile.id) {
                setDropSuccess(true);
                setTimeout(() => setDropSuccess(false), 600);
                onDragMoveSpy(profileId);
              }
            }
          }}
          className="absolute -top-4 -right-2 cursor-grab active:cursor-grabbing touch-none select-none z-50"
          style={{ pointerEvents: "auto" }}
        >
          <motion.div
            animate={dropSuccess ? { scale: [1, 1.4, 1] } : {}}
            transition={{ duration: 0.4 }}
          >
            <SpyIcon size={52} glow />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
