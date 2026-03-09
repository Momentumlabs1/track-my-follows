import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
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
  const dragRef = useRef<HTMLDivElement>(null);
  const lastHitCheck = useRef(0);
  const lastHoveredId = useRef<string | null>(null);
  const tapStartTime = useRef(0);
  const didDrag = useRef(false);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);

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

  const spyElement = (
    <motion.div
      ref={dragRef}
      drag
      dragSnapToOrigin
      dragElastic={0.15}
      dragMomentum={false}
      whileDrag={{ scale: 1.14, zIndex: 99999 }}
      style={isDragging && originRect ? {
        position: "fixed",
        top: originRect.top,
        left: originRect.left,
        width: originRect.width,
        height: originRect.height,
        zIndex: 99999,
        pointerEvents: "auto",
      } : undefined}
      onPointerDown={(e) => {
        e.stopPropagation();
        tapStartTime.current = Date.now();
        didDrag.current = false;
        // Capture position before drag starts
        const rect = dragRef.current?.getBoundingClientRect();
        if (rect) setOriginRect(rect);
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
        if (profileId && (!spyProfile || profileId !== spyProfile.id)) {
          onDragMoveSpy(profileId);
          try { navigator.vibrate?.(50); } catch {}
        }
        onHoverProfileChange(null);
        setOriginRect(null);
      }}
      onPointerUp={() => {
        if (!didDrag.current && Date.now() - tapStartTime.current < 300) navigate("/spy");
      }}
      className="flex w-[116px] flex-col items-center justify-center rounded-2xl border border-primary-foreground/30 bg-primary-foreground/10 px-2 py-3 cursor-grab active:cursor-grabbing touch-none select-none"
      aria-label={t("spy.your_spy", "Spion öffnen")}
    >
      <div className={isDragging ? "animate-pulse-glow" : ""}>
        <SpyIcon size={88} glow />
      </div>
      <span className="mt-1 text-primary-foreground/75 text-center leading-tight" style={{ fontSize: "0.5625rem", fontWeight: 700 }}>
        {t("spy.drag_hint", "Ziehen")} · {t("spy.your_spy", "Spion")}
      </span>
    </motion.div>
  );

  // When dragging, render via portal so it escapes any overflow:hidden ancestors
  if (isDragging) {
    return (
      <>
        {/* Placeholder to keep layout stable */}
        <div className="w-[116px] flex-shrink-0" style={{ height: originRect?.height ?? 130 }} />
        {createPortal(spyElement, document.body)}
      </>
    );
  }

  return spyElement;
}

export { SpyWidget as SpyAgentCard };
