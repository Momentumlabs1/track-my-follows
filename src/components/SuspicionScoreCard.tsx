import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { SuspicionBreakdown, FactorLevel } from "@/lib/suspicionAnalysis";

interface SuspicionScoreCardProps {
  analysis: SuspicionBreakdown;
  trackingDays: number;
  hasEnoughData: boolean;
}

const levelBgColor: Record<FactorLevel, string> = {
  safe: "rgba(52,199,89,0.08)",
  warning: "rgba(255,214,10,0.08)",
  danger: "rgba(255,59,48,0.08)",
};

const levelTextColor: Record<FactorLevel, string> = {
  safe: "#34C759",
  warning: "#FFD60A",
  danger: "#FF3B30",
};

function getBarColor(score: number): string {
  if (score <= 20) return "#34C759";
  if (score <= 50) return "#FFD60A";
  return "#FF3B30";
}

const chipLabels: Record<number, string> = {
  0: "Gender",
  1: "Aktiv.",
  2: "Churn",
  3: "Ratio",
  4: "Nacht",
};

const chipLabelsEn: Record<number, string> = {
  0: "Gender",
  1: "Activity",
  2: "Churn",
  3: "Ratio",
  4: "Night",
};

export function SuspicionScoreCard({ analysis, trackingDays, hasEnoughData }: SuspicionScoreCardProps) {
  const { t, i18n } = useTranslation();
  const { overallScore, label, emoji, factors } = analysis;
  const barColor = getBarColor(overallScore);
  const isDE = i18n.language?.startsWith("de");
  const labels = isDE ? chipLabels : chipLabelsEn;

  // Not enough data state
  if (!hasEnoughData) {
    const progressPct = Math.min(100, Math.round((trackingDays / 7) * 100));
    return (
      <div
        className="p-5"
        style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          border: "0.5px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
        }}
      >
        <p className="font-semibold text-foreground mb-1" style={{ fontSize: "0.875rem" }}>
          📊 {t("insights_new.building_title", "Analyse wird aufgebaut")}
        </p>
        <p className="text-muted-foreground mb-3" style={{ fontSize: "0.8125rem" }}>
          {trackingDays < 7
            ? t("insights_new.since_x_days", "Seit {{days}} Tagen aktiv · Noch keine Daten für eine zuverlässige Analyse.", { days: trackingDays })
            : t("insights_new.no_real_events", "Der Verdachts-Score wird berechnet sobald genügend Aktivität erkannt wurde.")}
        </p>
        <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "hsl(var(--muted))" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "hsl(var(--primary))" }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <p className="text-muted-foreground" style={{ fontSize: "0.6875rem" }}>
          {trackingDays} / 7 {t("insights.days", "Tage")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Score Card */}
      <div
        className="p-5"
        style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          border: "0.5px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-foreground" style={{ fontSize: "0.875rem" }}>
            {t("suspicion.score_label", "Verdachts-Score")}
          </p>
          <div className="flex items-center gap-2">
            <span className="font-bold tabular-nums text-foreground" style={{ fontSize: "1.75rem", lineHeight: 1 }}>
              {overallScore}
            </span>
            <span className="text-muted-foreground font-medium" style={{ fontSize: "0.875rem" }}>/ 100</span>
            <span style={{ fontSize: "1.25rem" }}>{emoji}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "hsl(var(--muted))" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: barColor }}
            initial={{ width: 0 }}
            animate={{ width: `${overallScore}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>

        <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
          {label} · {t("insights_new.last_7_days", "Letzte 7 Tage")}
        </p>
      </div>

      {/* Analysis Chips — horizontal scroll */}
      <div className="overflow-x-auto -mx-5 px-5">
        <div className="flex gap-2 w-max">
          {factors.map((factor, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              className="flex flex-col items-center px-3 py-2.5 flex-shrink-0"
              style={{
                minWidth: "76px",
                background: levelBgColor[factor.level],
                borderRadius: "14px",
              }}
            >
              <span className="font-bold tabular-nums" style={{ fontSize: "1.125rem", color: levelTextColor[factor.level], lineHeight: 1.2 }}>
                {factor.icon} {factor.displayValue}
              </span>
              <span className="text-muted-foreground font-medium mt-0.5" style={{ fontSize: "0.6875rem" }}>
                {labels[i] || factor.name}
              </span>
              <span className="text-muted-foreground" style={{ fontSize: "0.625rem" }}>
                {factor.score}/{factor.maxScore}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
