import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import type { SuspicionBreakdown, FactorLevel } from "@/lib/suspicionAnalysis";

interface SuspicionScoreCardProps {
  analysis: SuspicionBreakdown;
  trackingDays: number;
  hasEnoughData: boolean;
}

const levelBgColor: Record<FactorLevel, string> = {
  safe: "#1B3A2A",
  warning: "#3A3420",
  danger: "#3A1B1B",
};

const levelTextColor: Record<FactorLevel, string> = {
  safe: "#34C759",
  warning: "#FFD60A",
  danger: "#FF3B30",
};

function getScoreColor(score: number): string {
  if (score <= 20) return "#34C759";
  if (score <= 50) return "#FFD60A";
  return "#FF3B30";
}

const chipLabels: Record<number, { de: string; en: string }> = {
  0: { de: "Gender", en: "Gender" },
  1: { de: "Aktiv.", en: "Activity" },
  2: { de: "Churn", en: "Churn" },
  3: { de: "Ratio", en: "Ratio" },
};

function CountUp({ target, color }: { target: number; color: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const duration = 800;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) { setVal(target); clearInterval(interval); }
      else setVal(Math.round(current));
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <span className="font-bold tabular-nums" style={{ fontSize: "3rem", lineHeight: 1, color, letterSpacing: "-1px" }}>
      {val}
    </span>
  );
}

export function SuspicionScoreCard({ analysis, trackingDays, hasEnoughData }: SuspicionScoreCardProps) {
  const { t, i18n } = useTranslation();
  const { overallScore, label, emoji, factors } = analysis;
  const scoreColor = getScoreColor(overallScore);
  const isDE = i18n.language?.startsWith("de");

  // Not enough data state
  if (!hasEnoughData) {
    const progressPct = Math.min(100, Math.round((trackingDays / 7) * 100));
    return (
      <div className="text-center" style={{ background: "#1C1C1E", borderRadius: 20, padding: "32px 20px" }}>
        <span style={{ fontSize: "2.5rem" }} className="block mb-3">📊</span>
        <p className="font-semibold text-foreground mb-1" style={{ fontSize: "1rem" }}>
          {t("insights_new.building_title", "Analyse wird aufgebaut")}
        </p>
        <p className="mb-5" style={{ fontSize: "0.875rem", color: "#8E8E93" }}>
          {t("insights_new.since_x_days", "Seit {{days}} Tagen aktiv", { days: trackingDays })}
          {"\n"}
          {t("insights_new.no_real_events_short", "Sobald genug Aktivität erkannt wird, siehst du hier den Verdachts-Score.")}
        </p>
        <div className="overflow-hidden mb-2" style={{ height: 8, borderRadius: 4, background: "#2C2C2E" }}>
          <motion.div
            className="h-full"
            style={{ background: "hsl(var(--primary))", borderRadius: 4 }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <p style={{ fontSize: "0.75rem", color: "#48484A" }}>
          {trackingDays} / 7 {t("insights.days", "Tage")}
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "#1C1C1E", borderRadius: 20, padding: 24 }}>
      {/* Score header */}
      <p className="text-center" style={{ fontSize: "0.875rem", color: "#636366" }}>
        {t("suspicion.score_label", "Verdachts-Score")}
      </p>

      <div className="flex flex-col items-center py-3">
        <CountUp target={overallScore} color={scoreColor} />
        <span className="mt-1" style={{ fontSize: "1.5rem" }}>{emoji}</span>
        <p className="text-foreground font-semibold mt-1" style={{ fontSize: "1rem", color: "#AEAEB2" }}>
          {label}
        </p>
      </div>

      {/* Progress bar */}
      <div className="overflow-hidden mb-4" style={{ height: 8, borderRadius: 4, background: "#2C2C2E" }}>
        <motion.div
          className="h-full"
          style={{ background: scoreColor, borderRadius: 4 }}
          initial={{ width: 0 }}
          animate={{ width: `${overallScore}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
      </div>

      {/* 4 Chips — horizontal scroll */}
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="flex gap-2.5 w-max">
          {factors.map((factor, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="flex flex-col items-center flex-shrink-0"
              style={{
                minWidth: 85,
                padding: "14px 12px",
                background: levelBgColor[factor.level],
                borderRadius: 16,
              }}
            >
              <span className="font-bold tabular-nums" style={{ fontSize: "1.25rem", color: levelTextColor[factor.level], lineHeight: 1.2 }}>
                {factor.icon} {factor.displayValue}
              </span>
              <span className="mt-1" style={{ fontSize: "0.6875rem", color: "#8E8E93" }}>
                {chipLabels[i]?.[isDE ? "de" : "en"] || factor.name}
              </span>
              <span style={{ fontSize: "0.625rem", color: "#48484A" }}>
                {factor.score}/{factor.maxScore}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-center mt-4" style={{ fontSize: "0.6875rem", color: "#48484A" }}>
        {t("insights_new.last_7_days", "Letzte 7 Tage")}
      </p>
    </div>
  );
}
