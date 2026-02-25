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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mx-4 mb-4 relative"
    >
      {/* Card – lighter/brighter when spy is home, dims when dragging */}
      <motion.div
        animate={{
          opacity: isDragging ? 0.5 : 1,
          scale: isDragging ? 0.97 : 1,
        }}
        transition={{ duration: 0.25 }}
        className="relative overflow-visible rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-secondary/40 p-4 shadow-[0_0_30px_-8px_hsl(var(--primary)/0.15)]"
      >
        {/* Subtle glow behind card when spy is home */}
        {!isDragging && (
          <motion.div
            className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}

        {/* Header */}
        <div className="relative flex items-center gap-1.5 mb-3">
          <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
            {t("spy.spy_watching")}
          </span>
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse ms-auto" />
          <span className="text-[10px] font-semibold text-green-400">{t("spy.active")}</span>
        </div>

        {/* Profile info – animates when profile changes */}
        <AnimatePresence mode="wait">
          <motion.div
            key={spyProfile.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative flex items-center gap-3 mb-3"
          >
            <div className="relative">
              <div className="ring-2 ring-primary/30 rounded-full p-[2px]">
                <InstagramAvatar
                  src={spyProfile.avatar_url}
                  alt={spyProfile.username}
                  fallbackInitials={spyProfile.username}
                  size={48}
                />
              </div>
            </div>
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

        {/* Move Spy Button (fallback for non-drag) */}
        <button
          onClick={onMoveSpy}
          className="relative w-full py-2.5 rounded-xl border border-primary/20 text-primary text-[12px] font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
        >
          <SpyIcon size={16} /> {t("spy.move_spy")}
        </button>
      </motion.div>

      {/* Draggable Spy Icon – overlapping sticker, top-right */}
      <motion.div
        drag
        dragSnapToOrigin
        dragElastic={0.15}
        dragMomentum={false}
        whileDrag={{
          scale: 1.3,
          zIndex: 9999,
          filter: "drop-shadow(0 0 20px hsl(var(--primary) / 0.6))",
        }}
        whileHover={{ scale: 1.1 }}
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
          animate={dropSuccess ? { scale: [1, 1.5, 1], rotate: [0, 15, -15, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          <SpyIcon size={56} glow />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
