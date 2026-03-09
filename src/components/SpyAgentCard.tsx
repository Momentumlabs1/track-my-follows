import { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpyIcon } from "@/components/SpyIcon";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { TrackedProfile } from "@/hooks/useTrackedProfiles";
import spyGif from "@/assets/spy-logo-animated.gif";

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
    if (hovered !== lastHoveredId.current) {
      lastHoveredId.current = hovered;
      onHoverProfileChange(hovered);
    }
  }, [findProfileUnderPoint, onHoverProfileChange]);

  // ── Floating spy icon on the curve — draggable ──
  return (
    <motion.div
      ref={dragRef}
      drag
      dragSnapToOrigin
      dragElastic={0.15}
      dragMomentum={false}
      whileDrag={{ scale: 1.18, zIndex: 9999 }}
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
      onDragEnd={() => {
        onDragStateChange(false);
        const rect = dragRef.current?.getBoundingClientRect();
        const profileId = rect ? findProfileUnderPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) : null;
        if (profileId && spyProfile && profileId !== spyProfile.id) {
          onDragMoveSpy(profileId);
          try { navigator.vibrate?.(50); } catch {}
        }
        onHoverProfileChange(null);
      }}
      onPointerUp={() => {
        if (!didDrag.current && Date.now() - tapStartTime.current < 300) navigate("/spy");
      }}
      className="flex flex-col items-center cursor-grab active:cursor-grabbing touch-none select-none"
    >
      {/* Circular frame with glow */}
      <div className="rounded-full p-1 bg-background shadow-lg animate-pulse-glow" style={{ border: '2.5px solid hsl(var(--primary) / 0.4)' }}>
        <div className="rounded-full overflow-hidden" style={{ width: 60, height: 60 }}>
          <img
            src={spyGif}
            alt="Spy Agent"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>
      </div>
      <span className="text-muted-foreground mt-0.5" style={{ fontSize: '0.5625rem', fontWeight: 700 }}>
        ↕ {t("spy.drag_hint", "Ziehen")}
      </span>
    </motion.div>
  );
}

export { SpyWidget as SpyAgentCard };
