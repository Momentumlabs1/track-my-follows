import { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SpyIcon } from "@/components/SpyIcon";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
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

  const dragHandlers = {
    onDrag: () => {
      const now = Date.now();
      if (now - lastHitCheck.current < 80) return;
      lastHitCheck.current = now;
      const rect = dragRef.current?.getBoundingClientRect();
      if (!rect) return;
      const hovered = findProfileUnderPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      if (hovered !== lastHoveredId.current) { lastHoveredId.current = hovered; onHoverProfileChange(hovered); }
    },
  };

  // ═══ No spy assigned ═══
  if (!spyProfile) {
    return (
      <div
        className="rounded-[2rem] p-7 flex items-center gap-5"
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
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
          onDrag={dragHandlers.onDrag}
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

  // ═══ Spy assigned – "Surveillance Command Center" ═══
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
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* ─── Title bar ─── */}
        <div className="flex items-center gap-2 px-7 pt-6 pb-1">
          <SpyIcon size={16} />
          <span
            className="font-bold tracking-widest"
            style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)' }}
          >
            Spy Command Center
          </span>
        </div>

        {/* ─── Main content: Account LEFT ←→ Spy RIGHT ─── */}
        <div className="px-7 py-6 flex items-center">
          {/* LEFT: Monitored account */}
          <button
            onClick={() => navigate(`/profile/${spyProfile.id}`)}
            className="flex flex-col items-center gap-2.5 text-center min-w-0"
          >
            {/* Avatar with thick gradient ring */}
            <div
              className="rounded-full p-[4px]"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(347 100% 75%), hsl(var(--primary)))' }}
            >
              <div className="rounded-full overflow-hidden" style={{ boxShadow: '0 0 0 3px rgba(0,0,0,0.65)' }}>
                <InstagramAvatar
                  src={spyProfile.avatar_url}
                  alt={spyProfile.username}
                  fallbackInitials={spyProfile.username}
                  size={80}
                />
              </div>
            </div>
            <div>
              <p className="font-bold text-white truncate" style={{ fontSize: '1rem', maxWidth: '130px' }}>
                @{spyProfile.username}
              </p>
              {(followerCount != null || followingCount != null) && (
                <div className="flex items-center gap-2.5 mt-1 justify-center">
                  {followerCount != null && (
                    <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>
                      <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{formatCount(followerCount)}</span> Follower
                    </span>
                  )}
                  {followingCount != null && (
                    <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>
                      <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{formatCount(followingCount)}</span> Fol.
                    </span>
                  )}
                </div>
              )}
            </div>
          </button>

          {/* CENTER: Animated connection line */}
          <div className="flex-1 flex items-center justify-center gap-2 px-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: i === 2 ? 7 : 5,
                  height: i === 2 ? 7 : 5,
                  background: 'white',
                }}
                animate={{ opacity: [0.12, 0.8, 0.12], scale: i === 2 ? [1, 1.4, 1] : 1 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.25,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* RIGHT: Spy icon – large, draggable, intense glow */}
          <motion.div
            ref={dragRef}
            drag dragSnapToOrigin dragElastic={0.15} dragMomentum={false}
            whileDrag={{ scale: 1.18, zIndex: 9999 }}
            onPointerDown={() => { tapStartTime.current = Date.now(); didDrag.current = false; }}
            onDragStart={() => { didDrag.current = true; onDragStateChange(true); }}
            onDrag={dragHandlers.onDrag}
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
            <div className="relative flex items-center justify-center" style={{ width: 112, height: 112 }}>
              {/* Outer glow */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 112, height: 112,
                  background: 'radial-gradient(circle, hsl(var(--primary) / 0.6) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                }}
              />
              {/* Mid glow */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 88, height: 88,
                  background: 'radial-gradient(circle, hsl(var(--primary) / 0.35) 0%, transparent 70%)',
                  filter: 'blur(10px)',
                }}
              />
              {/* Inner glow */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 64, height: 64,
                  background: 'radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)',
                  filter: 'blur(4px)',
                }}
              />
              {/* Pulsing spy icon */}
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <SpyIcon size={96} glow />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* ─── Footer: Status ─── */}
        <button
          onClick={() => navigate(`/profile/${spyProfile.id}`)}
          className="w-full flex items-center gap-3 px-7 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <motion.span
            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ background: 'hsl(var(--brand-green))', boxShadow: '0 0 10px hsl(var(--brand-green) / 0.8)' }}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="flex-1 text-start font-semibold" style={{ fontSize: '0.8125rem', color: 'hsl(var(--brand-green))' }}>
            {t("spy.hourly_monitoring", "Stündliche Überwachung aktiv")}
          </span>
          <ChevronRight className="h-4 w-4 flex-shrink-0 rtl:rotate-180" style={{ color: 'rgba(255,255,255,0.35)' }} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export { SpyWidget as SpyAgentCard };
