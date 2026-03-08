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
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(150deg, hsl(var(--primary) / 0.18), hsl(var(--primary) / 0.30))',
          border: '1.5px solid hsl(var(--primary) / 0.35)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px hsl(var(--primary) / 0.15), inset 0 1px 0 hsl(var(--primary-foreground) / 0.08)',
        }}
      >
        {/* ─── Title bar ─── */}
        <div className="flex items-center gap-2 px-6 pt-5 pb-1">
          <SpyIcon size={14} />
          <span
            className="font-bold tracking-widest text-primary-foreground/80"
            style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}
          >
            Spy Command Center
          </span>
        </div>

        {/* ─── Main content: Account LEFT ←→ Spy RIGHT ─── */}
        <div className="px-6 py-5 flex items-center">
          {/* LEFT: Monitored account */}
          <button
            onClick={() => navigate(`/profile/${spyProfile.id}`)}
            className="flex flex-col items-center gap-2 text-center min-w-0"
          >
            {/* Avatar with thick gradient ring */}
            <div
              className="rounded-full p-[3px]"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--brand-rose)), hsl(var(--primary)))' }}
            >
              <div className="rounded-full overflow-hidden ring-[3px] ring-background">
                <InstagramAvatar
                  src={spyProfile.avatar_url}
                  alt={spyProfile.username}
                  fallbackInitials={spyProfile.username}
                  size={76}
                />
              </div>
            </div>
            <div>
              <p className="font-bold text-primary-foreground truncate" style={{ fontSize: '0.9375rem', maxWidth: '120px' }}>
                @{spyProfile.username}
              </p>
              {(followerCount != null || followingCount != null) && (
                <div className="flex items-center gap-2 mt-0.5 justify-center">
                  {followerCount != null && (
                    <span className="text-primary-foreground/60" style={{ fontSize: '0.6875rem' }}>
                      <span className="font-semibold text-primary-foreground/90">{formatCount(followerCount)}</span> Follower
                    </span>
                  )}
                  {followingCount != null && (
                    <span className="text-primary-foreground/60" style={{ fontSize: '0.6875rem' }}>
                      <span className="font-semibold text-primary-foreground/90">{formatCount(followingCount)}</span> Fol.
                    </span>
                  )}
                </div>
              )}
            </div>
          </button>

          {/* CENTER: Animated connection line */}
          <div className="flex-1 flex items-center justify-center gap-1.5 px-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: i === 2 ? 6 : 4,
                  height: i === 2 ? 6 : 4,
                  background: 'hsl(var(--primary-foreground))',
                }}
                animate={{ opacity: [0.15, 0.9, 0.15], scale: i === 2 ? [1, 1.3, 1] : 1 }}
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
            <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
              {/* Outer glow */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 100, height: 100,
                  background: 'radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, transparent 70%)',
                  filter: 'blur(16px)',
                }}
              />
              {/* Mid glow */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 80, height: 80,
                  background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
                  filter: 'blur(8px)',
                }}
              />
              {/* Pulsing spy icon */}
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <SpyIcon size={88} glow />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* ─── Footer: Status ─── */}
        <button
          onClick={() => navigate(`/profile/${spyProfile.id}`)}
          className="w-full flex items-center gap-2.5 px-6 py-3.5"
          style={{ borderTop: '1px solid hsl(var(--primary-foreground) / 0.1)' }}
        >
          <motion.span
            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ background: 'hsl(var(--brand-green))', boxShadow: '0 0 8px hsl(var(--brand-green) / 0.7)' }}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="flex-1 text-start font-semibold" style={{ fontSize: '0.75rem', color: 'hsl(var(--brand-green))' }}>
            {t("spy.hourly_monitoring", "Stündliche Überwachung aktiv")}
          </span>
          <ChevronRight className="h-4 w-4 text-primary-foreground/40 flex-shrink-0 rtl:rotate-180" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export { SpyWidget as SpyAgentCard };
