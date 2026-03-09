import { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SpyIcon } from "@/components/SpyIcon";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { TrackedProfile } from "@/hooks/useTrackedProfiles";

interface SpyWidgetProps {
  spyProfile: TrackedProfile | null;
  onDragMoveSpy: (profileId: string) => void;
  isDragging: boolean;
  onDragStateChange: (dragging: boolean) => void;
  onHoverProfileChange: (profileId: string | null) => void;
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function SpyWidget({ spyProfile, onDragMoveSpy, isDragging, onDragStateChange, onHoverProfileChange }: SpyWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const handleDrag = useCallback(() => {
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
  }, [findProfileUnderPoint, onHoverProfileChange]);

  // ── No spy assigned ──
  if (!spyProfile) {
    return (
      <div className="relative rounded-2xl p-5 flex items-center gap-4 bg-card border border-border border-l-4 border-l-primary">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground mt-1" style={{ fontSize: '0.9375rem' }}>
            {t("spy.assign_your_spy")}
          </p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: '0.75rem' }}>
            {t("spy.spy_description")}
          </p>
        </div>

        <motion.div
          ref={dragRef}
          drag
          dragSnapToOrigin
          dragElastic={0.15}
          dragMomentum={false}
          whileDrag={{ scale: 1.14, zIndex: 9999 }}
          onDragStart={() => onDragStateChange(true)}
          onDrag={handleDrag}
          onDragEnd={() => {
            onDragStateChange(false);
            onHoverProfileChange(null);
          }}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none select-none z-50 flex flex-col items-center"
          aria-label={t("spy.assign_your_spy", "Spion zuweisen")}
        >
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          >
            <SpyIcon size={48} glow />
          </motion.div>
          <span className="mt-1 text-muted-foreground" style={{ fontSize: '0.625rem', fontWeight: 600 }}>
            ↕ {t("spy.drag_hint", "Ziehen")}
          </span>
        </motion.div>
      </div>
    );
  }

  // ── Spy assigned ──
  const followerCount = spyProfile.follower_count ?? spyProfile.last_follower_count;
  const followingCount = spyProfile.following_count ?? spyProfile.last_following_count;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={spyProfile.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl overflow-hidden bg-card border border-border border-l-4 border-l-primary shadow-sm"
      >
        {/* Main: Profile info + Spy icon */}
        <button
          onClick={() => navigate(`/profile/${spyProfile.id}`)}
          className="w-full p-4 flex items-center gap-3 text-start"
        >
          <InstagramAvatar
            src={spyProfile.avatar_url}
            alt={spyProfile.username}
            fallbackInitials={spyProfile.username}
            size={48}
          />
          <div className="min-w-0 flex-1">
            <span
              className="text-primary font-bold uppercase tracking-wider"
              style={{ fontSize: '0.6rem' }}
            >
              🕵️ SPY · Stündlich
            </span>
            <p className="font-bold text-foreground truncate" style={{ fontSize: '1rem' }}>
              @{spyProfile.username}
            </p>
            {(followerCount != null || followingCount != null) && (
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.75rem' }}>
                {followerCount != null && (
                  <span>
                    <span className="font-semibold text-foreground">{formatCount(followerCount)}</span> Follower
                  </span>
                )}
                {followerCount != null && followingCount != null && <span className="text-muted-foreground/40"> · </span>}
                {followingCount != null && (
                  <span>
                    <span className="font-semibold text-foreground">{formatCount(followingCount)}</span> Following
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Draggable Spy Icon */}
          <motion.div
            ref={dragRef}
            drag
            dragSnapToOrigin
            dragElastic={0.15}
            dragMomentum={false}
            whileDrag={{ scale: 1.16, zIndex: 9999 }}
            onPointerDown={(e) => {
              e.stopPropagation();
              tapStartTime.current = Date.now();
              didDrag.current = false;
            }}
            onDragStart={() => {
              didDrag.current = true;
              onDragStateChange(true);
            }}
            onDrag={handleDrag}
            onDragEnd={() => {
              onDragStateChange(false);
              const rect = dragRef.current?.getBoundingClientRect();
              const profileId = rect ? findProfileUnderPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) : null;
              if (profileId && profileId !== spyProfile.id) {
                onDragMoveSpy(profileId);
                try { navigator.vibrate?.(50); } catch {}
              }
              onHoverProfileChange(null);
            }}
            onPointerUp={() => {
              if (!didDrag.current && Date.now() - tapStartTime.current < 300) navigate("/spy");
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none select-none z-50 flex flex-col items-center"
            aria-label={t("spy.your_spy", "Spion öffnen")}
          >
            <SpyIcon size={40} glow />
            <span className="mt-1 text-muted-foreground" style={{ fontSize: '0.5625rem', fontWeight: 600 }}>
              ↕ {t("spy.drag_hint", "Ziehen")}
            </span>
          </motion.div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export { SpyWidget as SpyAgentCard };
