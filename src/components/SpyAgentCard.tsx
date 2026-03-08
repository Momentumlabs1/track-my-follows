import { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SpyIcon } from "@/components/SpyIcon";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { TrackedProfile } from "@/hooks/useTrackedProfiles";
import spyAnimated from "@/assets/spy-logo-animated.gif";

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
    if (hovered !== lastHoveredId.current) { lastHoveredId.current = hovered; onHoverProfileChange(hovered); }
  }, [findProfileUnderPoint, onHoverProfileChange]);

  // ═══ No spy assigned ═══
  if (!spyProfile) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{
          background: 'linear-gradient(145deg, hsl(347 80% 25%), hsl(347 70% 18%))',
          border: '1px solid hsl(347 100% 59% / 0.3)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white" style={{ fontSize: '0.9375rem' }}>
            {t("spy.assign_your_spy")}
          </p>
          <p className="text-white/55 mt-0.5" style={{ fontSize: '0.75rem' }}>
            {t("spy.spy_description")}
          </p>
        </div>

        <motion.div
          ref={dragRef}
          drag dragSnapToOrigin dragElastic={0.15} dragMomentum={false}
          whileDrag={{ scale: 1.1, zIndex: 9999 }}
          onDragStart={() => onDragStateChange(true)}
          onDrag={handleDrag}
          onDragEnd={() => { onDragStateChange(false); onHoverProfileChange(null); }}
          className="cursor-grab active:cursor-grabbing touch-none select-none z-50 flex-shrink-0"
        >
          <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
            <SpyIcon size={64} glow />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ═══ Spy assigned — branded command center ═══
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
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(150deg, hsl(347 75% 22%), hsl(340 70% 14%))',
          border: '1px solid hsl(347 100% 59% / 0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 hsl(347 100% 70% / 0.1)',
        }}
      >
        {/* Subtle scan line animation */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, hsl(347 100% 60% / 0.04) 50%, transparent 100%)',
            backgroundSize: '100% 200%',
          }}
          animate={{ backgroundPosition: ['0% 0%', '0% 100%', '0% 0%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        {/* ─── Main Row ─── */}
        <div className="flex items-center px-5 py-4 relative z-10">
          {/* Left: Monitored profile */}
          <button
            onClick={() => navigate(`/profile/${spyProfile.id}`)}
            className="flex items-center gap-3 flex-1 min-w-0 text-start"
          >
            <div
              className="rounded-full p-[2px] flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(347 100% 65%), hsl(347 100% 45%))' }}
            >
              <div className="rounded-full overflow-hidden" style={{ border: '2px solid hsl(340 70% 14%)' }}>
                <InstagramAvatar
                  src={spyProfile.avatar_url}
                  alt={spyProfile.username}
                  fallbackInitials={spyProfile.username}
                  size={44}
                />
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white truncate" style={{ fontSize: '0.8125rem' }}>
                @{spyProfile.username}
              </p>
              {(followerCount != null || followingCount != null) && (
                <p className="mt-0.5" style={{ fontSize: '0.625rem', color: 'hsl(0 0% 100% / 0.45)' }}>
                  {followerCount != null && (
                    <span>
                      <span className="font-semibold" style={{ color: 'hsl(0 0% 100% / 0.75)' }}>{formatCount(followerCount)}</span>
                      {' '}Follower
                    </span>
                  )}
                  {followerCount != null && followingCount != null && (
                    <span style={{ margin: '0 4px', color: 'hsl(347 100% 70% / 0.4)' }}>·</span>
                  )}
                  {followingCount != null && (
                    <span>
                      <span className="font-semibold" style={{ color: 'hsl(0 0% 100% / 0.75)' }}>{formatCount(followingCount)}</span>
                      {' '}Fol.
                    </span>
                  )}
                </p>
              )}
              {/* Status */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <motion.div
                  className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'hsl(347 100% 65%)', boxShadow: '0 0 8px hsl(347 100% 60% / 0.9)' }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
                <span style={{ fontSize: '0.5625rem', color: 'hsl(347 100% 75% / 0.6)', fontWeight: 500 }}>
                  {t("spy.hourly_monitoring", "Überwachung aktiv")}
                </span>
              </div>
            </div>
          </button>

          {/* Middle: Connection dots */}
          <div className="flex items-center gap-1.5 flex-shrink-0 px-2">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: 3,
                  height: 3,
                  background: `hsl(347 100% ${70 - i * 5}% / ${0.6 - i * 0.1})`,
                }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>

          {/* Right: Spy Agent — large & prominent */}
          <motion.div
            ref={dragRef}
            drag dragSnapToOrigin dragElastic={0.15} dragMomentum={false}
            whileDrag={{ scale: 1.15, zIndex: 9999 }}
            onPointerDown={() => { tapStartTime.current = Date.now(); didDrag.current = false; }}
            onDragStart={() => { didDrag.current = true; onDragStateChange(true); }}
            onDrag={handleDrag}
            onDragEnd={() => {
              onDragStateChange(false);
              const rect = dragRef.current?.getBoundingClientRect();
              const profileId = rect ? findProfileUnderPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) : null;
              if (profileId && profileId !== spyProfile.id) { onDragMoveSpy(profileId); try { navigator.vibrate?.(50); } catch {} }
              onHoverProfileChange(null);
            }}
            onPointerUp={() => { if (!didDrag.current && Date.now() - tapStartTime.current < 300) navigate("/spy"); }}
            className="cursor-grab active:cursor-grabbing touch-none select-none z-50 flex-shrink-0 relative flex flex-col items-center"
          >
            {/* Multi-layer glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: -12 }}>
              <div className="rounded-full" style={{
                width: 110, height: 110,
                background: 'radial-gradient(circle, hsl(347 100% 59% / 0.3) 0%, hsl(347 100% 50% / 0.1) 40%, transparent 65%)',
                filter: 'blur(16px)',
              }} />
            </div>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <img
                src={spyAnimated}
                alt="Spy Agent"
                className="object-contain drop-shadow-[0_0_16px_hsl(347_100%_59%/0.6)]"
                style={{ width: 88, height: 88 }}
                draggable={false}
              />
            </motion.div>
            {/* Drag hint */}
            <span
              className="mt-0 select-none pointer-events-none"
              style={{ fontSize: '0.5rem', color: 'hsl(347 100% 75% / 0.5)', fontWeight: 500 }}
            >
              ↕ {t("spy.drag_hint", "Ziehe mich")}
            </span>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export { SpyWidget as SpyAgentCard };
