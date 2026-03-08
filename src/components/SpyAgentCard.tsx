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

  // No spy assigned
  if (!spyProfile) {
    return (
      <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'hsl(var(--card))' }}>
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
            <SpyIcon size={56} glow />
          </motion.div>
        </motion.div>
        <div>
          <p className="font-semibold text-foreground" style={{ fontSize: '0.875rem' }}>{t("spy.assign_your_spy")}</p>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.75rem' }}>{t("spy.spy_description")}</p>
        </div>
      </div>
    );
  }

  // Spy assigned – large card with full profile info
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
        style={{ background: 'hsl(var(--primary) / 0.12)', border: '1px solid hsl(var(--primary) / 0.18)' }}
      >
        {/* Top row: Spy Icon + "Dein Spion überwacht" */}
        <div className="p-5 pb-4 flex items-center gap-4">
          {/* Draggable Spy Icon */}
          <motion.div
            ref={dragRef}
            drag dragSnapToOrigin dragElastic={0.15} dragMomentum={false}
            whileDrag={{ scale: 1.1, zIndex: 9999 }}
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
            <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <SpyIcon size={56} glow />
            </motion.div>
          </motion.div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground" style={{ fontSize: '1rem' }}>
              {t("spy.your_spy_monitors", "Dein Spion überwacht")}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--brand-green))]" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
              <span className="font-medium" style={{ fontSize: '0.75rem', color: 'hsl(var(--brand-green))' }}>
                {t("spy.hourly_monitoring", "Stündliche Überwachung aktiv")}
              </span>
            </div>
          </div>
        </div>

        {/* Profile info section */}
        <button
          onClick={() => navigate(`/profile/${spyProfile.id}`)}
          className="w-full flex items-center gap-3.5 p-4 pt-0 pb-5"
        >
          <div className="rounded-full ring-2 ring-primary/30 p-[2px] flex-shrink-0">
            <InstagramAvatar src={spyProfile.avatar_url} alt={spyProfile.username} fallbackInitials={spyProfile.username} size={64} />
          </div>
          <div className="flex-1 min-w-0 text-start">
            <p className="font-bold text-foreground truncate" style={{ fontSize: '1.0625rem' }}>@{spyProfile.username}</p>
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
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 rtl:rotate-180" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export { SpyWidget as SpyAgentCard };
