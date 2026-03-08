import { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SpyIcon } from "@/components/SpyIcon";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Radio } from "lucide-react";
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
        className="rounded-[2rem] p-7 flex items-center gap-5"
        style={{
          background: 'linear-gradient(145deg, hsl(347 80% 25%), hsl(347 70% 18%))',
          border: '1px solid hsl(347 100% 59% / 0.3)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 hsl(347 100% 70% / 0.15)',
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white" style={{ fontSize: '1rem' }}>
            {t("spy.assign_your_spy")}
          </p>
          <p className="text-white/60 mt-1" style={{ fontSize: '0.8125rem' }}>
            {t("spy.spy_description")}
          </p>
        </div>

        <motion.div
          ref={dragRef}
          drag dragSnapToOrigin dragElastic={0.15} dragMomentum={false}
          whileDrag={{ scale: 1.1, zIndex: 9999 }}
          onDragStart={() => { onDragStateChange(true); }}
          onDrag={handleDrag}
          onDragEnd={() => { onDragStateChange(false); onHoverProfileChange(null); }}
          className="cursor-grab active:cursor-grabbing touch-none select-none z-50 flex-shrink-0"
        >
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
            <SpyIcon size={80} glow />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ═══ Spy assigned ═══
  const followerCount = spyProfile.follower_count ?? spyProfile.last_follower_count;
  const followingCount = spyProfile.following_count ?? spyProfile.last_following_count;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={spyProfile.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
        className="rounded-[2rem] overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, hsl(347 75% 22%), hsl(340 60% 14%), hsl(330 50% 10%))',
          border: '1px solid hsl(347 100% 59% / 0.25)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 hsl(347 100% 70% / 0.12)',
        }}
      >
        {/* ─── Spy Agent Hero Section ─── */}
        <div className="relative pt-6 pb-5 px-6">
          {/* Title bar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <SpyIcon size={16} />
              <span
                className="font-bold tracking-widest"
                style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'hsl(347 100% 75%)' }}
              >
                {t("spy.command_center", "Spy Command Center")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <motion.div
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: 'hsl(142 71% 45%)' }}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span style={{ fontSize: '0.625rem', color: 'hsl(142 71% 55%)', fontWeight: 600 }}>LIVE</span>
            </div>
          </div>

          {/* Agent – centered, large, draggable */}
          <div className="flex flex-col items-center">
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
              className="cursor-grab active:cursor-grabbing touch-none select-none z-50 relative"
            >
              {/* Glow layers */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="rounded-full" style={{
                  width: 120, height: 120,
                  background: 'radial-gradient(circle, hsl(347 100% 59% / 0.35) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                }} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="rounded-full" style={{
                  width: 80, height: 80,
                  background: 'radial-gradient(circle, hsl(347 100% 65% / 0.25) 0%, transparent 70%)',
                  filter: 'blur(8px)',
                }} />
              </div>
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <SpyIcon size={72} glow />
              </motion.div>
            </motion.div>

            {/* Agent name */}
            <p className="mt-3 font-bold text-white" style={{ fontSize: '0.9375rem' }}>
              {spyProfile.spy_name || t("spy.default_name", "Spion 🕵️")}
            </p>
            <p style={{ fontSize: '0.6875rem', color: 'hsl(347 100% 75% / 0.7)', marginTop: 2 }}>
              {t("spy.drag_to_reassign", "Ziehen zum Verschieben")}
            </p>
          </div>
        </div>

        {/* ─── Monitored Profile Strip ─── */}
        <button
          onClick={() => navigate(`/profile/${spyProfile.id}`)}
          className="w-full"
        >
          <div
            className="mx-4 mb-4 rounded-2xl flex items-center gap-3.5 px-4 py-3.5"
            style={{
              background: 'hsl(0 0% 100% / 0.08)',
              border: '1px solid hsl(0 0% 100% / 0.08)',
            }}
          >
            {/* Avatar with ring */}
            <div
              className="rounded-full p-[3px] flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(347 100% 65%), hsl(347 100% 50%))' }}
            >
              <div className="rounded-full overflow-hidden" style={{ border: '2px solid hsl(340 60% 14%)' }}>
                <InstagramAvatar
                  src={spyProfile.avatar_url}
                  alt={spyProfile.username}
                  fallbackInitials={spyProfile.username}
                  size={44}
                />
              </div>
            </div>

            {/* Profile info */}
            <div className="flex-1 min-w-0 text-start">
              <p className="font-bold text-white truncate" style={{ fontSize: '0.9375rem' }}>
                @{spyProfile.username}
              </p>
              {(followerCount != null || followingCount != null) && (
                <div className="flex items-center gap-2 mt-0.5">
                  {followerCount != null && (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(0 0% 100% / 0.45)' }}>
                      <span className="font-semibold" style={{ color: 'hsl(0 0% 100% / 0.8)' }}>{formatCount(followerCount)}</span> Follower
                    </span>
                  )}
                  {followingCount != null && (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(0 0% 100% / 0.45)' }}>
                      <span className="font-semibold" style={{ color: 'hsl(0 0% 100% / 0.8)' }}>{formatCount(followingCount)}</span> Fol.
                    </span>
                  )}
                </div>
              )}
            </div>

            <ChevronRight className="h-4 w-4 flex-shrink-0 rtl:rotate-180" style={{ color: 'hsl(0 0% 100% / 0.3)' }} />
          </div>
        </button>

        {/* ─── Status Footer ─── */}
        <div
          className="flex items-center gap-3 px-7 py-3.5"
          style={{ borderTop: '1px solid hsl(0 0% 100% / 0.06)' }}
        >
          <motion.div
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ background: 'hsl(142 71% 45%)', boxShadow: '0 0 8px hsl(142 71% 45% / 0.7)' }}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="flex-1 font-semibold" style={{ fontSize: '0.75rem', color: 'hsl(142 71% 55%)' }}>
            {t("spy.hourly_monitoring", "Stündliche Überwachung aktiv")}
          </span>
          <Radio className="h-3.5 w-3.5" style={{ color: 'hsl(142 71% 45% / 0.6)' }} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export { SpyWidget as SpyAgentCard };
