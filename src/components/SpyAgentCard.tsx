import { useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
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

const idleAnimate = {
  x: [0, 2, -1, 1, 0],
  y: [0, -1, 1, -2, 0],
  rotate: [0, 1, -1, 0.5, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: ["easeInOut"] as any,
  },
};

export function SpyWidget({ spyProfile, onDragMoveSpy, isDragging, onDragStateChange, onHoverProfileChange }: SpyWidgetProps) {
  const navigate = useNavigate();
  const lastHitCheck = useRef(0);
  const lastHoveredId = useRef<string | null>(null);
  const tapStartTime = useRef(0);
  const didDrag = useRef(false);

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  const findProfileUnderPoint = useCallback((x: number, y: number): string | null => {
    const els = document.elementsFromPoint(x, y);
    const target = els.map((e) => e.closest("[data-profile-id]")).find(Boolean);
    return target?.getAttribute("data-profile-id") || null;
  }, []);

  const handleDrag = useCallback((_: any, info: { point: { x: number; y: number } }) => {
    const now = Date.now();
    if (now - lastHitCheck.current < 80) return;
    lastHitCheck.current = now;
    const hovered = findProfileUnderPoint(info.point.x, info.point.y);
    if (hovered !== lastHoveredId.current) {
      lastHoveredId.current = hovered;
      onHoverProfileChange(hovered);
    }
  }, [findProfileUnderPoint, onHoverProfileChange]);

  const handleDragEnd = useCallback((_: any, info: { point: { x: number; y: number } }) => {
    onDragStateChange(false);
    const profileId = findProfileUnderPoint(info.point.x, info.point.y);
    if (profileId && (!spyProfile || profileId !== spyProfile.id)) {
      onDragMoveSpy(profileId);
      try { navigator.vibrate?.(50); } catch {}
    }
    onHoverProfileChange(null);
    lastHoveredId.current = null;

    // Animate back to origin quickly
    animate(dragX, 0, { duration: 0.2, ease: "easeOut" });
    animate(dragY, 0, { duration: 0.2, ease: "easeOut" });
  }, [findProfileUnderPoint, onDragMoveSpy, onHoverProfileChange, spyProfile, dragX, dragY]);

  return (
    <div className="relative flex flex-col items-center justify-center px-2 py-2">
      {/* Ghost placeholder while dragging */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-[100px] h-[100px] rounded-full border-2 border-dashed border-primary-foreground/40 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draggable wrapper — no animation, pure drag tracking */}
      <motion.div
        drag
        dragElastic={0}
        dragMomentum={false}
        dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
        style={{ x: dragX, y: dragY, WebkitTouchCallout: "none", pointerEvents: isDragging ? "none" : "auto" } as any}
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
        onDragEnd={handleDragEnd}
        onPointerUp={() => {
          if (!didDrag.current && Date.now() - tapStartTime.current < 300) navigate("/spy");
        }}
        className="relative z-[99999] cursor-grab active:cursor-grabbing touch-none select-none"
      >
        {/* Inner element — idle animation only, stops during drag */}
        <motion.div
          animate={isDragging ? { x: 0, y: 0, rotate: 0 } : idleAnimate}
        >
          <SpyIcon size={100} glow />
        </motion.div>
      </motion.div>
    </div>
  );
}

export { SpyWidget as SpyAgentCard };
