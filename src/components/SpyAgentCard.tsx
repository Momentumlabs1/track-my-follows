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
    if (hovered !== lastHoveredId.current) { lastHoveredId.current = hovered; onHoverProfileChange(hovered); }
  }, [findProfileUnderPoint, onHoverProfileChange]);

  // ═══ No spy assigned ═══
  if (!spyProfile) {
    return (
      <div
        className="rounded-3xl p-6 flex flex-col items-center text-center"
        style={{
          background: 'linear-gradient(160deg, hsl(347 60% 18%), hsl(347 50% 12%))',
          border: '2px solid hsl(347 100% 59% / 0.3)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 80px hsl(347 100% 50% / 0.1)',
        }}
      >
        <span
          className="uppercase tracking-[0.15em] font-black mb-4"
          style={{ fontSize: '0.6875rem', color: 'hsl(347 100% 75% / 0.5)' }}
        >
          🕵️ {t("spy.your_spy", "Dein Spion")}
        </span>

        <motion.div
          ref={dragRef}
          drag dragSnapToOrigin dragElastic={0.15} dragMomentum={false}
          whileDrag={{ scale: 1.1, zIndex: 9999 }}
          onDragStart={() => onDragStateChange(true)}
          onDrag={handleDrag}
          onDragEnd={() => { onDragStateChange(false); onHoverProfileChange(null); }}
          className="cursor-grab active:cursor-grabbing touch-none select-none z-50 relative"
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="rounded-full" style={{
              width: 140, height: 140,
              background: 'radial-gradient(circle, hsl(347 100% 59% / 0.3) 0%, transparent 60%)',
              filter: 'blur(24px)',
            }} />
          </div>
          <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
            <SpyIcon size={96} glow />
          </motion.div>
        </motion.div>

        <p className="font-bold text-white mt-4" style={{ fontSize: '0.875rem' }}>
          {t("spy.assign_your_spy")}
        </p>
        <p className="text-white/40 mt-1" style={{ fontSize: '0.75rem' }}>
          {t("spy.spy_description")}
        </p>
        <span className="mt-3 select-none" style={{ fontSize: '0.5625rem', color: 'hsl(347 100% 75% / 0.4)', fontWeight: 500 }}>
          ↕ {t("spy.drag_hint", "Ziehe mich auf ein Profil")}
        </span>
      </div>
    );
  }

  // ═══ Spy assigned — vertical command center ═══
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
        className="rounded-3xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(160deg, hsl(347 60% 18%), hsl(347 50% 12%))',
          border: '2px solid hsl(347 100% 59% / 0.3)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 80px hsl(347 100% 50% / 0.1)',
        }}
      >
        {/* ─── Top: Label ─── */}
        <div className="pt-5 pb-1 text-center relative z-10">
          <span
            className="uppercase tracking-[0.15em] font-black"
            style={{ fontSize: '0.6875rem', color: 'hsl(347 100% 75% / 0.5)' }}
          >
            🕵️ {t("spy.your_spy", "Dein Spion")}
          </span>
        </div>

        {/* ─── Center: SpyIcon with glow ─── */}
        <div className="flex flex-col items-center py-3 relative z-10">
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
            className="cursor-grab active:cursor-grabbing touch-none select-none z-50 relative flex flex-col items-center"
          >
            {/* Multi-layer glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: -12 }}>
              <div className="rounded-full" style={{
                width: 160, height: 160,
                background: 'radial-gradient(circle, hsl(347 100% 59% / 0.35) 0%, hsl(347 100% 50% / 0.1) 40%, transparent 65%)',
                filter: 'blur(24px)',
              }} />
            </div>
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <SpyIcon size={96} glow />
            </motion.div>
            <span className="mt-1 select-none pointer-events-none"
              style={{ fontSize: '0.5625rem', color: 'hsl(347 100% 75% / 0.4)', fontWeight: 500 }}>
              ↕ {t("spy.drag_hint", "Ziehe mich")}
            </span>
          </motion.div>
        </div>

        {/* ─── Bottom: Monitored account sub-row ─── */}
        <button
          onClick={() => navigate(`/profile/${spyProfile.id}`)}
          className="w-full flex items-center gap-3 px-5 py-3.5 text-start relative z-10"
          style={{
            background: 'hsl(0 0% 100% / 0.08)',
            borderTop: '1px solid hsl(347 100% 59% / 0.15)',
          }}
        >
          <div
            className="rounded-full p-[2px] flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(347 100% 65%), hsl(347 100% 45%))' }}
          >
            <div className="rounded-full overflow-hidden" style={{ border: '2px solid hsl(347 50% 15%)' }}>
              <InstagramAvatar
                src={spyProfile.avatar_url}
                alt={spyProfile.username}
                fallbackInitials={spyProfile.username}
                size={40}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate" style={{ fontSize: '0.8125rem' }}>
              @{spyProfile.username}
            </p>
            {(followerCount != null || followingCount != null) && (
              <p style={{ fontSize: '0.625rem', color: 'hsl(0 0% 100% / 0.4)' }}>
                {followerCount != null && (
                  <span><span className="font-semibold" style={{ color: 'hsl(0 0% 100% / 0.7)' }}>{formatCount(followerCount)}</span> Follower</span>
                )}
                {followerCount != null && followingCount != null && (
                  <span style={{ margin: '0 4px', color: 'hsl(347 100% 70% / 0.3)' }}>·</span>
                )}
                {followingCount != null && (
                  <span><span className="font-semibold" style={{ color: 'hsl(0 0% 100% / 0.7)' }}>{formatCount(followingCount)}</span> Following</span>
                )}
              </p>
            )}
          </div>
          {/* Status indicator */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <motion.div
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: 'hsl(142 71% 45%)', boxShadow: '0 0 8px hsl(142 71% 45% / 0.8)' }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            <span style={{ fontSize: '0.5625rem', color: 'hsl(0 0% 100% / 0.4)', fontWeight: 500 }}>
              {t("spy.hourly_monitoring", "Aktiv")}
            </span>
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export { SpyWidget as SpyAgentCard };
