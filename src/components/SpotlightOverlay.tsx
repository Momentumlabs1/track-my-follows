import { useState, useEffect, useRef } from "react";
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
}: SpotlightOverlayProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipHeight, setTooltipHeight] = useState(200);

  useEffect(() => {
    const measure = () => {
      const el = document.getElementById(targetId);
      if (el) setRect(el.getBoundingClientRect());
    };
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
    if (tooltipRef.current) setTooltipHeight(tooltipRef.current.offsetHeight);
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

          {/* Tooltip */}
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

          {/* Agent comment bubble */}
          {agentComment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              style={{
                position: "fixed",
                bottom: 100,
                right: 20,
                zIndex: 10000,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  background: "#2C2C2E",
                  borderRadius: 16,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  maxWidth: 260,
                }}
              >
                <SpyIcon size={20} />
                <span style={{ fontSize: 13, color: "#EBEBF5", fontWeight: 500 }}>
                  {agentComment}
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
