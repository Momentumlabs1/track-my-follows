import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { SuspicionBreakdown, FactorLevel } from "@/lib/suspicionAnalysis";
import { SuspicionGauge } from "@/components/SuspicionGauge";

interface SuspicionMeterProps {
  analysis: SuspicionBreakdown;
  weeklyScores?: number[];
}

const levelEmoji: Record<FactorLevel, string> = {
  safe: "🟢",
  warning: "🟡",
  danger: "🔴",
};

export function SuspicionMeter({ analysis, weeklyScores }: SuspicionMeterProps) {
  const { t } = useTranslation();
  const { overallScore, factors, genderStats } = analysis;

  const getGenderVerdict = () => {
    if (genderStats.femalePercent > 70) return t("simple.mostly_women");
    if (genderStats.femalePercent < 40) return t("simple.mostly_men");
    return t("simple.balanced");
  };

  return (
    <div className="space-y-3">
      {/* Gauge */}
      <div className="native-card p-5">
        <SuspicionGauge score={overallScore} weeklyScores={weeklyScores} />
      </div>

      {/* Factors – iOS-style grouped list */}
      <div className="native-card overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <p className="section-header">{t("simple.what_we_found")}</p>
        </div>
        {factors.map((factor, i) => (
          <motion.div
            key={factor.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            className="native-cell"
          >
            <span className="text-base leading-none flex-shrink-0">{levelEmoji[factor.level]}</span>
            <p className="text-[13px] font-medium text-foreground leading-snug flex-1">
              {factor.simpleLabel}
            </p>
          </motion.div>
        ))}
      </div>

    </div>
  );
}