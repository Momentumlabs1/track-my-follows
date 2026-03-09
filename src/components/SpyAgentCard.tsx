import { useCallback, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
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

export function SpyWidget({ spyProfile, onDragMoveSpy, isDragging, onDragStateChange, onHoverProfileChange }: SpyWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const iconRef = useRef<HTMLDivElement>(null);
  const lastHitCheck = useRef(0);
  const lastHoveredId = useRef<string | null>(null);
  const tapStartTime = useRef(0);
  const didDrag = useRef(false);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);

  // Capture origin position when drag starts
  const captureOrigin = useCallback(() => {
    if (iconRef.current) {
      setOriginRect(iconRef.current.getBoundingClientRect());
    }
  }, []);

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
  }, [findProfileUnderPoint, onDragMoveSpy, onHoverProfileChange, spyProfile]);

  // The draggable icon element
  const draggableIcon = (
    <motion.div
      ref={iconRef}
      drag
      dragSnapToOrigin
      dragElastic={0.15}
      dragMomentum={false}
      whileDrag={{ scale: 1.2 }}
      style={isDragging ? { position: "fixed", zIndex: 99999, pointerEvents: "none" } : { position: "relative", zIndex: 50 }}
      onPointerDown={(e) => {
        e.stopPropagation();
        tapStartTime.current = Date.now();
        didDrag.current = false;
      }}
      onDragStart={() => {
        didDrag.current = true;
        captureOrigin();
        onDragStateChange(true);
      }}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onPointerUp={() => {
        if (!didDrag.current && Date.now() - tapStartTime.current < 300) navigate("/spy");
      }}
      className="cursor-grab active:cursor-grabbing touch-none select-none"
    >
      <SpyIcon size={88} glow />
    </motion.div>
  );

  return (
    <div className="relative flex w-[116px] flex-col items-center justify-center rounded-2xl border border-primary-foreground/30 bg-primary-foreground/10 px-2 py-3">
      {/* Ghost placeholder while dragging */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-primary-foreground/30 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* The actual draggable icon — rendered via portal when dragging so it escapes all overflow/stacking */}
      <div className={isDragging ? "opacity-0" : ""}>
        {draggableIcon}
      </div>
      {isDragging && createPortal(draggableIcon, document.body)}

      <span className="mt-1 text-primary-foreground/75 text-center leading-tight" style={{ fontSize: "0.5625rem", fontWeight: 700 }}>
        {t("spy.drag_hint", "Ziehen")} · {t("spy.your_spy", "Spion")}
      </span>
    </div>
  );
}

export { SpyWidget as SpyAgentCard };
