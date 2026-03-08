import { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SpyIcon } from "@/components/SpyIcon";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
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
  return `${mins} Min.`;
}

interface SpyAgentCardProps {
  spyProfile: TrackedProfile | null;
  onDragMoveSpy: (profileId: string) => void;
  isDragging: boolean;
  onDragStateChange: (dragging: boolean) => void;
  onHoverProfileChange: (profileId: string | null) => void;
}

export function SpyAgentCard({ spyProfile, onDragMoveSpy, isDragging, onDragStateChange, onHoverProfileChange }: SpyAgentCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const timeAgo = useTimeAgo();
  const dragRef = useRef<HTMLDivElement>(null);
  const lastHitCheck = useRef(0);
  const lastHoveredId = useRef<string | null>(null);
  const tapStartTime = useRef(0);
  const didDrag = useRef(false);

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
      <div className="mt-4">
      <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(145deg, hsl(347 80% 25%), hsl(347 70% 18%))' }}>
          <motion.div className="flex justify-center mb-3" animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <SpyIcon size={80} glow />
          </motion.div>
          <p className="font-semibold text-white" style={{ fontSize: '0.875rem' }}>{t("spy.assign_your_spy")}</p>
          <p className="text-white/60 mt-1" style={{ fontSize: '0.8125rem' }}>{t("spy.spy_description")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Pink/primary-tinted unified container */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, hsl(347 100% 59% / 0.18), hsl(347 80% 50% / 0.08))',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <span className="section-header text-primary/80">{t("spy.spy_watching")}</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-green" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
            <span className="text-brand-green font-medium" style={{ fontSize: '0.6875rem' }}>{t("spy.active")}</span>
          </div>
        </div>

        {/* Main content: Profile info left, large Spy right */}
        <AnimatePresence mode="wait">
          <motion.div
            key={spyProfile.id}
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4"
          >
            {/* Left: Profile info (clickable) */}
            <button onClick={() => navigate(`/profile/${spyProfile.id}`)} className="flex items-center gap-3 flex-1 min-w-0 text-start">
              <div className="flex-shrink-0 rounded-full ring-2 ring-primary/40 p-[2px]">
                <InstagramAvatar src={spyProfile.avatar_url} alt={spyProfile.username} fallbackInitials={spyProfile.username} size={56} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate" style={{ fontSize: '0.9375rem' }}>@{spyProfile.username}</p>
                <p className="text-muted-foreground" style={{ fontSize: '0.8125rem' }}>{t("spy.last_scan")}: {timeAgo(spyProfile.last_scanned_at)}</p>
                <p className="text-muted-foreground" style={{ fontSize: '0.8125rem' }}>{t("spy.next_scan")}: {nextScanIn(spyProfile.last_scanned_at)}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 rtl:rotate-180" />
            </button>

            {/* Right: Large draggable Spy icon */}
            <motion.div
              ref={dragRef}
              drag
              dragSnapToOrigin
              dragElastic={0.15}
              dragMomentum={false}
              whileDrag={{ scale: 1.1, zIndex: 9999 }}
              onPointerDown={() => { tapStartTime.current = Date.now(); didDrag.current = false; }}
              onDragStart={() => { didDrag.current = true; onDragStateChange(true); }}
              onDrag={() => {
                const now = Date.now();
                if (now - lastHitCheck.current < 80) return;
                lastHitCheck.current = now;
                const rect = dragRef.current?.getBoundingClientRect();
                if (!rect) return;
                const hovered = findProfileUnderPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
                if (hovered !== lastHoveredId.current) { lastHoveredId.current = hovered; onHoverProfileChange(hovered); }
              }}
              onDragEnd={() => {
                onDragStateChange(false);
                const rect = dragRef.current?.getBoundingClientRect();
                const profileId = rect ? findProfileUnderPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) : null;
                if (profileId && profileId !== spyProfile.id) { onDragMoveSpy(profileId); try { navigator.vibrate?.(50); } catch {} }
                onHoverProfileChange(null);
              }}
              onPointerUp={() => { if (!didDrag.current && Date.now() - tapStartTime.current < 300) navigate("/spy"); }}
              className="cursor-grab active:cursor-grabbing touch-none select-none z-50 flex-shrink-0"
            >
              <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <SpyIcon size={80} glow />
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Unfollow hint */}
        {(spyProfile.pending_unfollow_hint ?? 0) > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: '0.5px solid hsl(var(--primary) / 0.2)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span>⚠️</span>
              <span className="font-semibold text-destructive" style={{ fontSize: '0.8125rem' }}>~{spyProfile.pending_unfollow_hint} {t("spy.unfollows_detected")}</span>
            </div>
            <button onClick={() => navigate(`/profile/${spyProfile.id}`)} className="w-full py-2 rounded-xl bg-destructive/10 text-destructive font-semibold" style={{ fontSize: '0.8125rem' }}>
              🔍 {t("spy.reveal_now")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
