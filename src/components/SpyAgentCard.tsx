import { useState, useCallback, useRef } from "react";
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
      <div className="mx-5 mb-4">
        <div className="native-card p-6 text-center">
          <motion.div className="flex justify-center mb-3" animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <SpyIcon size={48} glow />
          </motion.div>
          <p className="font-semibold text-foreground" style={{ fontSize: '0.875rem' }}>{t("spy.assign_your_spy")}</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: '0.8125rem' }}>{t("spy.spy_description")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-5 mb-4">
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <span className="section-header">{t("spy.spy_watching")}</span>
        <div className="ms-auto flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-green" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
          <span className="text-brand-green font-medium" style={{ fontSize: '0.6875rem' }}>{t("spy.active")}</span>
        </div>
      </div>

      <div className="flex items-stretch gap-3">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: isDragging ? 0.3 : 1, scale: isDragging ? 0.97 : 1 }}
          transition={{ duration: 0.2 }}
          className="flex-1 native-card p-4"
        >
          <AnimatePresence mode="wait">
            <motion.div key={spyProfile.id}
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
              transition={{ duration: 0.3 }}
            >
              <button onClick={() => navigate(`/profile/${spyProfile.id}`)} className="flex items-center gap-3 w-full text-start">
                <div className="avatar-ring flex-shrink-0">
                  <div className="rounded-full bg-background p-[1px]">
                    <InstagramAvatar src={spyProfile.avatar_url} alt={spyProfile.username} fallbackInitials={spyProfile.username} size={44} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground" style={{ fontSize: '0.9375rem' }}>@{spyProfile.username}</p>
                  <p className="text-muted-foreground" style={{ fontSize: '0.8125rem' }}>{t("spy.last_scan")}: {timeAgo(spyProfile.last_scanned_at)}</p>
                  <p className="text-muted-foreground" style={{ fontSize: '0.8125rem' }}>{t("spy.next_scan")}: {nextScanIn(spyProfile.last_scanned_at)}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 rtl:rotate-180" />
              </button>
            </motion.div>
          </AnimatePresence>

          {(spyProfile.pending_unfollow_hint ?? 0) > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: '0.5px solid hsl(var(--hairline))' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span>⚠️</span>
                <span className="font-semibold text-destructive" style={{ fontSize: '0.8125rem' }}>~{spyProfile.pending_unfollow_hint} {t("spy.unfollows_detected")}</span>
              </div>
              <button onClick={() => navigate(`/profile/${spyProfile.id}`)} className="w-full py-2 rounded-xl bg-destructive/10 text-destructive font-semibold" style={{ fontSize: '0.8125rem' }}>
                🔍 {t("spy.reveal_now")}
              </button>
            </div>
          )}
        </motion.div>

        {/* Spy dock */}
        <div className="flex-shrink-0 flex items-stretch">
          <div className={`relative rounded-2xl flex items-center justify-center p-2 transition-all duration-200 ${isDragging ? "bg-card" : "native-card"}`} style={{ width: 72 }}>
            {isDragging && (
              <motion.div className="absolute inset-0 flex items-center justify-center" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/30" />
              </motion.div>
            )}
            <motion.div
              ref={dragRef} drag dragSnapToOrigin dragElastic={0.15} dragMomentum={false}
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
              className="cursor-grab active:cursor-grabbing touch-none select-none z-50 flex items-center justify-center w-full h-full"
            >
              <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <SpyIcon size={48} glow />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
