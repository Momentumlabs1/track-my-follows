import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { SuspicionBreakdown } from "@/lib/suspicionAnalysis";
import { SuspicionGauge } from "@/components/SuspicionGauge";

interface SuspicionMeterProps {
  analysis: SuspicionBreakdown;
  weeklyScores?: number[];
}

export function SuspicionMeter({ analysis, weeklyScores }: SuspicionMeterProps) {
  const { t } = useTranslation();
  const { overallScore, factors, genderStats } = analysis;

  const getBarColor = (ratio: number) => {
    if (ratio > 0.6) return "gradient-danger";
    if (ratio > 0.3) return "bg-brand-yellow";
    return "gradient-safe";
  };

  const getBarEmoji = (ratio: number) => {
    if (ratio > 0.6) return "🔴";
    if (ratio > 0.3) return "🟡";
    return "🟢";
  };

  return (
    <div className="space-y-3">
      {/* Gauge */}
      <div className="native-card p-5">
        <SuspicionGauge score={overallScore} weeklyScores={weeklyScores} />
      </div>

      {/* Factors */}
      <div className="native-card p-4 space-y-4">
        <p className="section-header">{t("suspicion.factors_title")}</p>
        {factors.map((factor, i) => {
          const ratio = factor.score / factor.maxScore;
          return (
            <motion.div
              key={factor.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-semibold text-foreground">{factor.name}</span>
                <span className="text-[12px] font-bold text-muted-foreground flex items-center gap-1">
                  {factor.score}/{factor.maxScore} {getBarEmoji(ratio)}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${getBarColor(ratio)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${ratio * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{factor.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Gender split bar */}
      {genderStats.total > 0 && (
        <div className="native-card p-4">
          <p className="section-header mb-3">{t("suspicion.gender_title")}</p>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1 text-center">
              <span className="text-2xl font-extrabold text-primary">♀ {genderStats.femalePercent}%</span>
              <p className="text-[11px] text-muted-foreground">{genderStats.female} {t("gender.female")}</p>
            </div>
            <div className="flex-1 text-center">
              <span className="text-2xl font-extrabold text-blue-500">♂ {genderStats.total > 0 ? 100 - genderStats.femalePercent : 0}%</span>
              <p className="text-[11px] text-muted-foreground">{genderStats.male} {t("gender.male")}</p>
            </div>
          </div>
          {/* Split bar */}
          <div className="h-3 rounded-full overflow-hidden flex">
            <motion.div
              className="h-full gradient-pink"
              initial={{ width: 0 }}
              animate={{ width: `${genderStats.femalePercent}%` }}
              transition={{ duration: 0.8, delay: 0.4 }}
            />
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${100 - genderStats.femalePercent}%` }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
          </div>
          {genderStats.unknown > 0 && (
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              {t("suspicion.not_detected", { count: genderStats.unknown })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
