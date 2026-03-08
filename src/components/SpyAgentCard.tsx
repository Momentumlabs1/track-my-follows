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
      <div
        className="relative rounded-3xl p-6 flex items-center gap-5"
        style={{
          background: "linear-gradient(140deg, hsl(var(--primary)), hsl(var(--brand-rose)))",
          boxShadow: "0 10px 30px hsl(var(--primary) / 0.35)",
          border: "1px solid hsl(var(--primary-foreground) / 0.28)",
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="uppercase tracking-[0.14em] font-extrabold text-primary-foreground/70" style={{ fontSize: "0.625rem" }}>
            🕵️ {t("spy.your_spy", "Dein Spion")}
          </p>
          <p className="font-bold text-primary-foreground mt-2" style={{ fontSize: "0.9375rem" }}>
            {t("spy.assign_your_spy")}
          </p>
          <p className="text-primary-foreground/75 mt-1" style={{ fontSize: "0.75rem" }}>
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
            <SpyIcon size={64} glow />
          </motion.div>
          <span className="mt-1 text-primary-foreground/60" style={{ fontSize: "0.6875rem", fontWeight: 600 }}>
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
        className="rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(140deg, hsl(var(--primary)), hsl(var(--brand-rose)))",
          boxShadow: isDragging
            ? "0 14px 36px hsl(var(--primary) / 0.45)"
            : "0 10px 30px hsl(var(--primary) / 0.35)",
          border: "1px solid hsl(var(--primary-foreground) / 0.28)",
        }}
      >
        {/* Top: Label + Feature tags */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <p className="uppercase tracking-[0.14em] font-extrabold text-primary-foreground/70" style={{ fontSize: "0.625rem" }}>
            🕵️ {t("spy.your_spy", "Dein Spion")}
          </p>
          <div className="flex gap-1.5">
            {["Stündlich", "Push", "Unfollows"].map((tag) => (
              <span
                key={tag}
                className="text-primary-foreground/80 font-semibold rounded-full px-2 py-0.5"
                style={{ fontSize: "0.5625rem", background: "hsl(var(--primary-foreground) / 0.12)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Main: Profile info + Spy icon */}
        <button
          onClick={() => navigate(`/profile/${spyProfile.id}`)}
          className="w-full px-6 pb-4 flex items-center gap-4 text-start"
        >
          <div
            className="rounded-full p-[2px] flex-shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary-foreground) / 0.5), hsl(var(--primary-foreground) / 0.2))" }}
          >
            <InstagramAvatar
              src={spyProfile.avatar_url}
              alt={spyProfile.username}
              fallbackInitials={spyProfile.username}
              size={56}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-primary-foreground truncate" style={{ fontSize: "1.0625rem" }}>
              @{spyProfile.username}
            </p>
            {(followerCount != null || followingCount != null) && (
              <p className="text-primary-foreground/70 mt-0.5" style={{ fontSize: "0.8125rem" }}>
                {followerCount != null && (
                  <span>
                    <span className="font-semibold text-primary-foreground">{formatCount(followerCount)}</span> Follower
                  </span>
                )}
                {followerCount != null && followingCount != null && <span className="text-primary-foreground/40"> · </span>}
                {followingCount != null && (
                  <span>
                    <span className="font-semibold text-primary-foreground">{formatCount(followingCount)}</span> Following
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Draggable Spy Icon – no bubble */}
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
            <SpyIcon size={64} glow />
            <span className="mt-1 text-primary-foreground/55" style={{ fontSize: "0.625rem", fontWeight: 600 }}>
              ↕ {t("spy.drag_hint", "Ziehen")}
            </span>
          </motion.div>
        </button>

        {/* Bottom: feature line */}
        <div
          className="px-6 py-2.5 text-primary-foreground/50 text-center"
          style={{ fontSize: "0.6875rem", borderTop: "1px solid hsl(var(--primary-foreground) / 0.12)" }}
        >
          Stündlich · Push-Scans · Unfollow-Erkennung
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export { SpyWidget as SpyAgentCard };
