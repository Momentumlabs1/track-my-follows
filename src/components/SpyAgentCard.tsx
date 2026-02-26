import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SpyIcon } from "@/components/SpyIcon";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { TrackedProfile } from "@/hooks/useTrackedProfiles";

type SpyPhase = "idle" | "flying" | "returning";

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
  onHoverProfileChange: (profileId: string | null) => void;
}

export function SpyAgentCard({
  spyProfile,
  onMoveSpy,
  onDragMoveSpy,
  isDragging,
  onDragStateChange,
  onHoverProfileChange,
}: SpyAgentCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const timeAgo = useTimeAgo();
  const [spyPhase, setSpyPhase] = useState<SpyPhase>("idle");
  const dragRef = useRef<HTMLDivElement>(null);
  const lastHitCheck = useRef(0);
  const lastHoveredId = useRef<string | null>(null);

  // Reset phase when spy profile changes (data arrived)
  useEffect(() => {
    if (spyPhase === "flying") {
      // Profile data updated → transition to returning
      const timer = setTimeout(() => setSpyPhase("returning"), 200);
      return () => clearTimeout(timer);
    }
    if (spyPhase === "returning") {
      const timer = setTimeout(() => setSpyPhase("idle"), 500);
      return () => clearTimeout(timer);
    }
  }, [spyProfile?.id, spyPhase]);

  const findProfileUnderPoint = useCallback((x: number, y: number): string | null => {
    const el = dragRef.current;
    if (!el) return null;
    const prev = el.style.pointerEvents;
    el.style.pointerEvents = "none";
    const els = document.elementsFromPoint(x, y);
    el.style.pointerEvents = prev;
    const target = els.map((e) => e.closest("[data-profile-id]")).find(Boolean);
    return target?.getAttribute("data-profile-id") || null;
  }, []);

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

  const spyIconVariants = {
    idle: { scale: 1, y: 0, opacity: 1 },
    flying: { scale: 0.3, y: -80, opacity: 0 },
    returning: { scale: 1, y: 0, opacity: 1 },
  };

  return (
    <div className="mx-4 mb-4">
      <div className="flex items-start gap-3">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: isDragging ? 0.45 : 1,
            scale: isDragging ? 0.96 : 1,
          }}
          transition={{ duration: 0.25 }}
          className="flex-1 rounded-2xl border border-primary/15 bg-gradient-to-br from-secondary/80 to-card p-4 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.12)]"
        >
          {/* Header */}
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
              {t("spy.spy_watching")}
            </span>
            <div className="ms-auto flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-green-400">{t("spy.active")}</span>
            </div>
          </div>

          {/* Profile info with refined transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={spyProfile.id}
              initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-center gap-3 mb-3"
            >
              <div className="ring-2 ring-primary/25 rounded-full p-[2px]">
                <InstagramAvatar
                  src={spyProfile.avatar_url}
                  alt={spyProfile.username}
                  fallbackInitials={spyProfile.username}
                  size={48}
                />
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

          {/* Move Spy button */}
          <button
            onClick={onMoveSpy}
            className="w-full py-2.5 rounded-xl border border-primary/20 text-primary text-[12px] font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
          >
            <SpyIcon size={16} /> {t("spy.move_spy")}
          </button>

          {/* Unfollow Hint */}
          {(spyProfile.pending_unfollow_hint ?? 0) > 0 && (
            <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm">⚠️</span>
                <span className="text-[12px] font-bold text-destructive">
                  ~{spyProfile.pending_unfollow_hint} {t("spy.unfollows_detected")}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">
                {t("spy.tap_to_reveal_hint")}
              </p>
              <button
                onClick={() => navigate(`/profile/${spyProfile.id}`)}
                className="w-full py-2 rounded-lg bg-destructive/20 text-destructive text-[11px] font-bold"
              >
                🔍 {t("spy.reveal_now")}
              </button>
            </div>
          )}
        </motion.div>

        {/* Draggable Spy */}
        <div className="flex-shrink-0 flex flex-col items-center pt-6">
          <motion.div
            ref={dragRef}
            drag={spyPhase === "idle"}
            dragSnapToOrigin
            dragElastic={0.15}
            dragMomentum={false}
            whileDrag={{
              scale: 1.12,
              zIndex: 9999,
              filter: "drop-shadow(0 0 18px hsl(var(--primary) / 0.5))",
            }}
            whileHover={spyPhase === "idle" ? { scale: 1.08 } : undefined}
            onDragStart={() => onDragStateChange(true)}
            onDrag={() => {
              const now = Date.now();
              if (now - lastHitCheck.current < 80) return;
              lastHitCheck.current = now;
              const rect = dragRef.current?.getBoundingClientRect();
              if (!rect) return;
              const hovered = findProfileUnderPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
              if (hovered !== lastHoveredId.current) {
                lastHoveredId.current = hovered;
                onHoverProfileChange(hovered);
              }
            }}
            onDragEnd={() => {
              onDragStateChange(false);
              const rect = dragRef.current?.getBoundingClientRect();
              const profileId = rect ? findProfileUnderPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) : null;
              if (profileId && profileId !== spyProfile.id) {
                setSpyPhase("flying");
                onDragMoveSpy(profileId);
              }
              onHoverProfileChange(null);
            }}
            className="cursor-grab active:cursor-grabbing touch-none select-none z-50"
          >
            <motion.div
              animate={spyPhase}
              variants={spyIconVariants}
              transition={
                spyPhase === "flying"
                  ? { duration: 0.4, ease: [0.6, 0, 0.4, 1] }
                  : spyPhase === "returning"
                  ? { duration: 0.45, ease: [0, 0.6, 0.4, 1], delay: 0.15 }
                  : { duration: 0.3 }
              }
            >
              <SpyIcon size={96} glow />
            </motion.div>
          </motion.div>
          <p className="text-[9px] text-muted-foreground/60 mt-1 select-none text-center">
            {t("spy.drag_hint", "Ziehen")}
          </p>
        </div>
      </div>
    </div>
  );
}
