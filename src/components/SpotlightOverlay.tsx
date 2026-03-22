import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpyIcon } from "@/components/SpyIcon";

interface SpotlightOverlayProps {
  targetId: string;
  tooltipTitle: string;
  tooltipText: string;
  buttonText: string;
  onNext: () => void;
  position?: "top" | "bottom";
  agentComment?: string;
  visible: boolean;
  hideButton?: boolean;
  stepIndex?: number;
  totalSteps?: number;
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all"
          style={{
            width: i === current ? 16 : 6,
            height: 6,
            background: i === current ? "#FF2D55" : "rgba(255,255,255,0.2)",
          }}
        />
      ))}
    </div>
  );
}

export function SpotlightOverlay({
  targetId,
  tooltipTitle,
  tooltipText,
  buttonText,
  onNext,
  position = "bottom",
  agentComment,
  visible,
  hideButton = false,
  stepIndex,
  totalSteps,
}: SpotlightOverlayProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipHeight, setTooltipHeight] = useState(200);
  const rafRef = useRef<number>(0);

  // Continuous measurement via rAF
  const measure = useCallback(() => {
    const el = document.getElementById(targetId);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect((prev) => {
        if (!prev || Math.abs(prev.top - r.top) > 0.5 || Math.abs(prev.left - r.left) > 0.5 ||
            Math.abs(prev.width - r.width) > 0.5 || Math.abs(prev.height - r.height) > 0.5) {
          return r;
        }
        return prev;
      });
    }
  }, [targetId]);

  useEffect(() => {
    if (!visible) return;
    const loop = () => {
      measure();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible, measure]);

  useEffect(() => {
    if (tooltipRef.current) setTooltipHeight(tooltipRef.current.offsetHeight);
  }, [tooltipTitle, tooltipText, rect]);

  if (!rect) return null;

  const pad = 8;
  const holeX = rect.left - pad;
  const holeY = rect.top - pad;
  const holeW = rect.width + pad * 2;
  const holeH = rect.height + pad * 2;

  // Align tooltip horizontally to target element, clamped to viewport
  const tooltipWidth = Math.min(300, window.innerWidth - 48);
  const elementCenterX = rect.left + rect.width / 2;
  const idealLeft = elementCenterX - tooltipWidth / 2;
  const edgePadding = 24;
  const tooltipLeft = Math.max(edgePadding, Math.min(idealLeft, window.innerWidth - tooltipWidth - edgePadding));
  const idealTop =
    position === "bottom"
      ? rect.bottom + 16
      : rect.top - tooltipHeight - 16;
  const tooltipTop = Math.max(
    edgePadding,
    Math.min(idealTop, window.innerHeight - tooltipHeight - edgePadding),
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="spotlight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none" }}
        >
          <svg
            style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          >
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect x={holeX} y={holeY} width={holeW} height={holeH} rx="16" fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#spotlight-mask)" />
          </svg>

          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: position === "bottom" ? 12 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            style={{
              position: "fixed",
              left: tooltipLeft,
              top: tooltipTop,
              zIndex: 9999,
              width: tooltipWidth,
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                background: "#1C1C1E",
                borderRadius: 20,
                padding: 20,
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              }}
            >
              {stepIndex != null && totalSteps != null && (
                <StepIndicator current={stepIndex} total={totalSteps} />
              )}
              <div className="flex items-center gap-2.5 mb-2">
                <SpyIcon size={24} />
                <p style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>
                  {tooltipTitle}
                </p>
              </div>
              <p style={{ fontSize: 14, color: "#8E8E93", lineHeight: 1.5 }}>
                {tooltipText}
              </p>
              {!hideButton && (
                <button
                  onClick={onNext}
                  style={{
                    width: "100%",
                    marginTop: 14,
                    padding: "13px 0",
                    background: "#FF2D55",
                    borderRadius: 12,
                    border: "none",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                    minHeight: 48,
                  }}
                >
                  {buttonText}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
