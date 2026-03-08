import { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SpyIcon } from "@/components/SpyIcon";
import { useNavigate } from "react-router-dom";
import type { TrackedProfile } from "@/hooks/useTrackedProfiles";

interface SpyWidgetProps {
  spyProfile: TrackedProfile | null;
  onDragMoveSpy: (profileId: string) => void;
  isDragging: boolean;
  onDragStateChange: (dragging: boolean) => void;
  onHoverProfileChange: (profileId: string | null) => void;
}

export function SpyWidget({ spyProfile, onDragMoveSpy, isDragging, onDragStateChange, onHoverProfileChange }: SpyWidgetProps) {
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

  // No spy assigned – show pulsing icon with CTA
  if (!spyProfile) {
    return (
      <div className="flex flex-col items-center py-4">
        <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <SpyIcon size={100} />
        </motion.div>
        <p className="text-white/70 mt-3 font-medium" style={{ fontSize: '0.8125rem' }}>
          Ziehe den Spion auf ein Profil
        </p>
      </div>
    );
  }

  // Spy assigned – show icon + avatar + username, minimal
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={spyProfile.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center py-2"
      >
        {/* Draggable Spy Icon */}
        <motion.div
          ref={dragRef}
          drag
          dragSnapToOrigin
          dragElastic={0.15}
          dragMomentum={false}
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
          className="cursor-grab active:cursor-grabbing touch-none select-none z-50"
        >
          <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <SpyIcon size={100} glow />
          </motion.div>
        </motion.div>

        {/* Profile info below icon */}
        <button
          onClick={() => navigate(`/profile/${spyProfile.id}`)}
          className="mt-3 flex items-center gap-2.5"
        >
          <div className="rounded-full ring-2 ring-white/30 p-[1px]">
            <InstagramAvatar src={spyProfile.avatar_url} alt={spyProfile.username} fallbackInitials={spyProfile.username} size={28} />
          </div>
          <span className="text-white font-semibold" style={{ fontSize: '0.9375rem' }}>
            @{spyProfile.username}
          </span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

// Keep backward-compatible export name
export { SpyWidget as SpyAgentCard };
