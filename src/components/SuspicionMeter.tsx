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

      {/* Gender split */}
      {genderStats.total > 0 && (
        <div className="native-card p-4">
          <p className="section-header mb-3">{t("simple.who_they_follow")}</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-xl font-extrabold text-primary">♀ {genderStats.femalePercent}%</span>
              <span className="text-[11px] text-muted-foreground">{genderStats.female}</span>
            </div>
            <div className="flex-1 flex items-center justify-end gap-2">
              <span className="text-[11px] text-muted-foreground">{genderStats.male}</span>
              <span className="text-xl font-extrabold text-blue-400">♂ {genderStats.total > 0 ? 100 - genderStats.femalePercent : 0}%</span>
            </div>
          </div>
          {/* Split bar */}
          <div className="h-2 rounded-full overflow-hidden flex bg-muted">
            <motion.div
              className="h-full gradient-pink"
              initial={{ width: 0 }}
              animate={{ width: `${genderStats.femalePercent}%` }}
              transition={{ duration: 0.8, delay: 0.4 }}
            />
            <motion.div
              className="h-full bg-blue-400"
              initial={{ width: 0 }}
              animate={{ width: `${100 - genderStats.femalePercent}%` }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
          </div>
          <p className="text-[12px] font-medium text-muted-foreground mt-2.5 text-center">
            {getGenderVerdict()}
          </p>
          {genderStats.unknown > 0 && (
            <p className="text-[10px] text-muted-foreground/60 mt-0.5 text-center">
              {t("suspicion.not_detected", { count: genderStats.unknown })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}