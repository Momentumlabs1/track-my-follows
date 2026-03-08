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

/** Animated connection dots between account and spy */
function ConnectionDots() {
  return (
    <div className="flex items-center justify-center gap-2 py-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: 4,
            height: 4,
            background: 'hsl(var(--primary))',
          }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
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
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--primary) / 0.14))',
          border: '1px solid hsl(var(--primary) / 0.2)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground" style={{ fontSize: '0.875rem' }}>{t("spy.assign_your_spy")}</p>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.75rem' }}>{t("spy.spy_description")}</p>
        </div>

        {/* Spy icon – right side, draggable */}
        <motion.div
          ref={dragRef}
          drag dragSnapToOrigin dragElastic={0.15} dragMomentum={false}
          whileDrag={{ scale: 1.1, zIndex: 9999 }}
          onDragStart={() => { onDragStateChange(true); }}
          onDrag={dragHandlers.onDrag}
          onDragEnd={() => { onDragStateChange(false); onHoverProfileChange(null); }}
          className="cursor-grab active:cursor-grabbing touch-none select-none z-50 flex-shrink-0"
        >
          <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <SpyIcon size={64} glow />
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--primary) / 0.14))',
          border: '1px solid hsl(var(--primary) / 0.2)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* ─── Main: Account LEFT ↔ Spy RIGHT ─── */}
        <div className="p-5 pb-3 flex items-center gap-4">
          {/* LEFT: Monitored account */}
          <button
            onClick={() => navigate(`/profile/${spyProfile.id}`)}
            className="flex items-center gap-3 flex-1 min-w-0 text-start"
          >
            {/* Avatar with gradient ring */}
            <div className="flex-shrink-0 rounded-full p-[2.5px]"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--brand-rose)))' }}
            >
              <div className="rounded-full overflow-hidden ring-2 ring-background">
                <InstagramAvatar
                  src={spyProfile.avatar_url}
                  alt={spyProfile.username}
                  fallbackInitials={spyProfile.username}
                  size={68}
                />
              </div>
            </div>

            {/* Username + stats */}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground truncate" style={{ fontSize: '1.0625rem' }}>
                @{spyProfile.username}
              </p>
              {(followerCount != null || followingCount != null) && (
                <div className="flex items-center gap-3 mt-1">
                  {followerCount != null && (
                    <span className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>
                      <span className="font-semibold text-foreground">{formatCount(followerCount)}</span> Follower
                    </span>
                  )}
                  {followingCount != null && (
                    <span className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>
                      <span className="font-semibold text-foreground">{formatCount(followingCount)}</span> Following
                    </span>
                  )}
                </div>
              )}
            </div>
          </button>

          {/* Connection dots (vertical between account and spy) */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0 px-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{ width: 3, height: 3, background: 'hsl(var(--primary))' }}
                animate={{ opacity: [0.15, 0.8, 0.15] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
              />
            ))}
          </div>

          {/* RIGHT: Spy icon – draggable */}
          <motion.div
            ref={dragRef}
            drag dragSnapToOrigin dragElastic={0.15} dragMomentum={false}
            whileDrag={{ scale: 1.15, zIndex: 9999 }}
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
            <div className="relative">
              {/* Glow layers */}
              <div className="absolute inset-0 rounded-full blur-xl" style={{ background: 'hsl(var(--primary) / 0.4)' }} />
              <div className="absolute inset-0 rounded-full blur-md" style={{ background: 'hsl(var(--primary) / 0.2)' }} />
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <SpyIcon size={72} glow />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* ─── Footer: Status + Navigate ─── */}
        <button
          onClick={() => navigate(`/profile/${spyProfile.id}`)}
          className="w-full flex items-center gap-2 px-5 py-3"
          style={{ borderTop: '1px solid hsl(var(--primary) / 0.12)' }}
        >
          <span
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ background: 'hsl(var(--brand-green))', boxShadow: '0 0 6px hsl(var(--brand-green) / 0.6)', animation: 'pulse 2s ease-in-out infinite' }}
          />
          <span className="flex-1 text-start font-medium" style={{ fontSize: '0.75rem', color: 'hsl(var(--brand-green))' }}>
            {t("spy.hourly_monitoring", "Stündliche Überwachung aktiv")}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 rtl:rotate-180" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export { SpyWidget as SpyAgentCard };
