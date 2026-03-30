import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpyIcon } from "@/components/SpyIcon";
import { useTranslation } from "react-i18next";
import { haptic } from "@/lib/native";

interface ScanOverlayProps {
  open: boolean;
  /** null = still scanning, number = result count */
  result: number | null;
  onClose: () => void;
}

const STATUS_TEXTS = [
  "scan_overlay.connecting",
  "scan_overlay.scanning_followings",
  "scan_overlay.analyzing",
  "scan_overlay.comparing",
];

export function ScanOverlay({ open, result, onClose }: ScanOverlayProps) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [phase, setPhase] = useState<"scanning" | "reveal" | "exit">("scanning");
  const [countUp, setCountUp] = useState(0);

  // Simulate progress while scanning
  useEffect(() => {
    if (!open) {
      setProgress(0);
      setStatusIdx(0);
      setPhase("scanning");
      setCountUp(0);
      return;
    }

    if (result !== null) return; // API done, stop simulation

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) return p + 0.1;
        if (p >= 60) return p + 0.3;
        return p + 1.2;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [open, result]);

  // Status text rotation
  useEffect(() => {
    if (!open || result !== null) return;
    const interval = setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_TEXTS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [open, result]);

  // Haptic ticks at milestones
  useEffect(() => {
    if (!open) return;
    const milestones = [20, 40, 60, 80];
    const rounded = Math.floor(progress);
    if (milestones.includes(rounded)) {
      haptic.light();
    }
  }, [progress, open]);

  // Phase 2: Result received
  useEffect(() => {
    if (result === null || phase !== "scanning") return;

    setProgress(100);
    haptic.light();

    const revealTimer = setTimeout(() => {
      setPhase("reveal");
      haptic.success();
    }, 400);

    return () => clearTimeout(revealTimer);
  }, [result, phase]);

  // Count-up animation
  useEffect(() => {
    if (phase !== "reveal" || result === null || result === 0) return;

    let current = 0;
    const step = Math.max(1, Math.floor(result / 10));
    const interval = setInterval(() => {
      current += step;
      if (current >= result) {
        setCountUp(result);
        clearInterval(interval);
      } else {
        setCountUp(current);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [phase, result]);

  // Phase 3: Auto-close
  useEffect(() => {
    if (phase !== "reveal") return;
    const timer = setTimeout(() => {
      setPhase("exit");
      setTimeout(onClose, 400);
    }, 2000);
    return () => clearTimeout(timer);
  }, [phase, onClose]);

  const statusText = result !== null
    ? t("scan_overlay.finalizing", "Finalisiere...")
    : t(STATUS_TEXTS[statusIdx], STATUS_TEXTS[statusIdx]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "exit" ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Dark background */}
          <div className="absolute inset-0 bg-background/95" />

          {/* Radar sweep */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 400,
                height: 400,
                left: "50%",
                top: "50%",
                x: "-50%",
                y: "-50%",
                background: `conic-gradient(from 0deg, transparent, hsl(var(--primary) / 0.15), transparent)`,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center px-8">
            {/* SpyIcon with glow */}
            <motion.div
              className="relative mb-8"
              animate={
                phase === "reveal"
                  ? { scale: [1, 1.3, 1] }
                  : { scale: [1, 1.05, 1] }
              }
              transition={
                phase === "reveal"
                  ? { duration: 0.5, ease: "easeOut" }
                  : { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }
            >
              {/* Glow rings */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  width: 160,
                  height: 160,
                  left: "50%",
                  top: "50%",
                  x: "-50%",
                  y: "-50%",
                  background: phase === "reveal" && result && result > 0
                    ? `radial-gradient(circle, hsl(var(--brand-green) / 0.4), transparent 70%)`
                    : `radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)`,
                  filter: "blur(20px)",
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <SpyIcon size={120} glow />
            </motion.div>

            {/* Phase 1: Progress */}
            {phase === "scanning" && (
              <motion.div
                className="w-full max-w-[260px] flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Status text */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={statusIdx}
                    className="text-foreground font-bold text-lg text-center"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    {statusText}
                  </motion.p>
                </AnimatePresence>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--brand-rose)))",
                    }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 0.15, ease: "linear" }}
                  />
                </div>

                {/* Percentage */}
                <p className="text-muted-foreground font-mono text-sm tabular-nums">
                  {Math.floor(Math.min(progress, 100))}%
                </p>
              </motion.div>
            )}

            {/* Phase 2: Result reveal */}
            {phase === "reveal" && (
              <motion.div
                className="flex flex-col items-center gap-3"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {result !== null && result > 0 ? (
                  <>
                    <motion.span
                      className="font-black tabular-nums"
                      style={{
                        fontSize: "3.5rem",
                        lineHeight: 1,
                        color: "hsl(var(--brand-green))",
                        textShadow: "0 0 30px hsl(var(--brand-green) / 0.5)",
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                    >
                      +{countUp}
                    </motion.span>
                    <p className="text-foreground font-bold text-lg">
                      {t("scan_overlay.new_found", { count: result })}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t("scan_overlay.scroll_hint", "Scrolle runter für Details")}
                    </p>
                  </>
                ) : (
                  <>
                    <motion.span
                      style={{ fontSize: "3rem" }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      ✓
                    </motion.span>
                    <p className="text-foreground font-bold text-lg">
                      {t("scan_overlay.all_clear", "Alles beim Alten")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t("scan_overlay.no_changes", "Keine neuen Aktivitäten erkannt")}
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
