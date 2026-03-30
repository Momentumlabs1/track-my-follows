import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpyIcon } from "@/components/SpyIcon";
import { useTranslation } from "react-i18next";
import { haptic } from "@/lib/native";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ProScanOverlayProps {
  open: boolean;
  profileId: string;
  username: string;
  onComplete: (result: ProScanResult) => void;
}

export interface ProScanResult {
  followingsLoaded: number;
  genderFemale: number;
  genderMale: number;
  genderUnknown: number;
  confidence: string;
}

const STATUS_KEYS = [
  "pro_tutorial.scan_connecting",
  "pro_tutorial.scan_followings",
  "pro_tutorial.scan_analyzing",
  "pro_tutorial.scan_gender",
  "pro_tutorial.scan_score",
];

export function ProScanOverlay({ open, profileId, username, onComplete }: ProScanOverlayProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [phase, setPhase] = useState<"scanning" | "done">("scanning");
  const [result, setResult] = useState<ProScanResult | null>(null);

  // Simulate progress
  useEffect(() => {
    if (!open || phase === "done") return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) return p + 0.1;
        if (p >= 60) return p + 0.4;
        return p + 1.0;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [open, phase]);

  // Status text rotation
  useEffect(() => {
    if (!open || phase === "done") return;
    const interval = setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_KEYS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [open, phase]);

  // Haptic ticks
  useEffect(() => {
    if (!open) return;
    const milestones = [20, 40, 60, 80];
    if (milestones.includes(Math.floor(progress))) haptic.light();
  }, [progress, open]);

  // Run scan
  useEffect(() => {
    if (!open || !profileId) return;
    let cancelled = false;

    const runScan = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

        // Run trigger-scan and create-baseline in parallel
        const [scanRes, baselineRes] = await Promise.allSettled([
          supabase.functions.invoke("trigger-scan", { headers, body: { profileId, scanType: "push" } }),
          supabase.functions.invoke("create-baseline", { headers, body: { profileId } }),
        ]);

        if (cancelled) return;

        // Extract baseline result for stats
        let followingsLoaded = 0;
        let genderFemale = 0, genderMale = 0, genderUnknown = 0;
        let confidence = "medium";

        if (baselineRes.status === "fulfilled" && baselineRes.value.data) {
          const d = baselineRes.value.data;
          followingsLoaded = d.followings_in_db || d.followings_unique || 0;
          if (d.gender) {
            genderFemale = d.gender.female || 0;
            genderMale = d.gender.male || 0;
            genderUnknown = d.gender.unknown || 0;
          }
          confidence = d.confidence || "medium";
        }

        haptic.success();
        setProgress(100);

        const scanResult: ProScanResult = {
          followingsLoaded,
          genderFemale,
          genderMale,
          genderUnknown,
          confidence,
        };

        setResult(scanResult);

        // Short delay for visual effect
        setTimeout(() => {
          if (!cancelled) setPhase("done");
        }, 600);

        queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
        queryClient.invalidateQueries({ queryKey: ["follow_events"] });
        queryClient.invalidateQueries({ queryKey: ["profile_followings"] });
      } catch (err) {
        console.error("[ProScanOverlay] Error:", err);
        if (!cancelled) {
          setPhase("done");
          setResult({ followingsLoaded: 0, genderFemale: 0, genderMale: 0, genderUnknown: 0, confidence: "low" });
        }
      }
    };

    runScan();
    return () => { cancelled = true; };
  }, [open, profileId, queryClient]);

  if (!open) return null;

  const totalGender = (result?.genderFemale || 0) + (result?.genderMale || 0) + (result?.genderUnknown || 0);
  const femalePercent = totalGender > 0 ? Math.round(((result?.genderFemale || 0) / totalGender) * 100) : 0;
  const malePercent = totalGender > 0 ? Math.round(((result?.genderMale || 0) / totalGender) * 100) : 0;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute inset-0 bg-background/95" />

      {/* Radar sweep */}
      {phase === "scanning" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 400, height: 400,
              left: "50%", top: "50%", x: "-50%", y: "-50%",
              background: "conic-gradient(from 0deg, transparent, hsl(var(--primary) / 0.15), transparent)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center px-8 w-full max-w-sm">
        {/* SpyIcon */}
        <motion.div
          className="relative mb-6"
          animate={phase === "done" ? { scale: [1, 1.2, 1] } : { scale: [1, 1.05, 1] }}
          transition={phase === "done" ? { duration: 0.5 } : { duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              width: 160, height: 160,
              left: "50%", top: "50%", x: "-50%", y: "-50%",
              background: phase === "done"
                ? "radial-gradient(circle, hsl(142 71% 45% / 0.4), transparent 70%)"
                : "radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)",
              filter: "blur(20px)",
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <SpyIcon size={120} glow />
        </motion.div>

        <AnimatePresence mode="wait">
          {phase === "scanning" && (
            <motion.div
              key="scanning"
              className="w-full flex flex-col items-center gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-sm text-muted-foreground">@{username}</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={statusIdx}
                  className="text-foreground font-bold text-lg text-center"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  {t(STATUS_KEYS[statusIdx])}
                </motion.p>
              </AnimatePresence>

              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--brand-rose)))" }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.15, ease: "linear" }}
                />
              </div>
              <p className="text-muted-foreground font-mono text-sm tabular-nums">
                {Math.floor(Math.min(progress, 100))}%
              </p>
            </motion.div>
          )}

          {phase === "done" && result && (
            <motion.div
              key="done"
              className="w-full flex flex-col items-center gap-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <p className="text-foreground font-bold text-xl text-center">
                {t("pro_tutorial.scan_complete_title")}
              </p>

              {/* Stats cards */}
              <div className="w-full grid grid-cols-2 gap-3 mt-2">
                <div className="rounded-2xl p-4 text-center" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.3)" }}>
                  <motion.p
                    className="font-black text-2xl tabular-nums"
                    style={{ color: "hsl(var(--primary))" }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                  >
                    {result.followingsLoaded}
                  </motion.p>
                  <p className="text-[11px] text-muted-foreground mt-1">{t("pro_tutorial.scan_followings_analyzed")}</p>
                </div>

                <div className="rounded-2xl p-4 text-center" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.3)" }}>
                  <motion.p
                    className="font-black text-2xl tabular-nums"
                    style={{ color: "hsl(var(--primary))" }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    {femalePercent}%
                  </motion.p>
                  <p className="text-[11px] text-muted-foreground mt-1">{t("pro_tutorial.scan_female_ratio")}</p>
                </div>
              </div>

              {/* Gender bar */}
              {totalGender > 0 && (
                <div className="w-full">
                  <div className="w-full h-3 rounded-full overflow-hidden flex" style={{ background: "hsl(var(--muted))" }}>
                    <motion.div
                      className="h-full"
                      style={{ background: "hsl(var(--primary))", width: `${femalePercent}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${femalePercent}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
                    <motion.div
                      className="h-full"
                      style={{ background: "hsl(210 70% 55%)", width: `${malePercent}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${malePercent}%` }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">♀ {femalePercent}%</span>
                    <span className="text-[10px] text-muted-foreground">♂ {malePercent}%</span>
                  </div>
                </div>
              )}

              <p className="text-muted-foreground text-sm text-center mt-1">
                {t("pro_tutorial.scan_spy_ready")}
              </p>

              <button
                onClick={() => onComplete(result)}
                className="w-full mt-2 py-3.5 rounded-2xl font-bold text-[15px] text-primary-foreground"
                style={{
                  background: "hsl(var(--primary))",
                  boxShadow: "0 4px 14px -3px hsl(var(--primary) / 0.4)",
                }}
              >
                {t("onboarding.next", "Weiter")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}