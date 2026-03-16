import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SpotlightOverlayProps {
  targetId: string;
  tooltipTitle: string;
  tooltipText: string;
  buttonText: string;
  onNext: () => void;
  position?: "top" | "bottom";
  step: number;
  totalSteps: number;
  hideButton?: boolean;
}

function DotIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-2 mt-4">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: i === current ? 20 : 6,
            background: i === current ? "#FF2D55" : "#3A3A3C",
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
  step,
  totalSteps,
  hideButton = false,
}: SpotlightOverlayProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipHeight, setTooltipHeight] = useState(200);

  useEffect(() => {
    const measure = () => {
      const el = document.getElementById(targetId);
      if (el) {
        setRect(el.getBoundingClientRect());
      }
    };
    // Initial + delayed measure for layout shifts
    measure();
    const t1 = setTimeout(measure, 100);
    const t2 = setTimeout(measure, 300);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [targetId]);

  useEffect(() => {
    if (tooltipRef.current) {
      setTooltipHeight(tooltipRef.current.offsetHeight);
    }
  }, [tooltipTitle, tooltipText, rect]);

  if (!rect) return null;

  const pad = 8;
  const holeX = rect.left - pad;
  const holeY = rect.top - pad;
  const holeW = rect.width + pad * 2;
  const holeH = rect.height + pad * 2;

  const tooltipLeft = Math.max(16, Math.min(rect.left, window.innerWidth - 316));
  const tooltipTop =
    position === "bottom"
      ? rect.bottom + 16
      : rect.top - tooltipHeight - 16;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none" }}
      >
        {/* SVG mask overlay */}
        <svg
          style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 9998, pointerEvents: "none" }}
        >
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={holeX}
                y={holeY}
                width={holeW}
                height={holeH}
                rx="16"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Tooltip */}
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, y: position === "bottom" ? 12 : -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{
            position: "fixed",
            left: tooltipLeft,
            top: tooltipTop,
            zIndex: 9999,
            maxWidth: 300,
            width: "calc(100% - 32px)",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              background: "#1C1C1E",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            <p style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
              {tooltipTitle}
            </p>
            <p style={{ fontSize: 15, color: "#8E8E93", marginTop: 8, lineHeight: 1.5 }}>
              {tooltipText}
            </p>
            {!hideButton && (
              <button
                onClick={onNext}
                style={{
                  width: "100%",
                  marginTop: 16,
                  padding: "14px 0",
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
            <DotIndicator current={step} total={totalSteps} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
