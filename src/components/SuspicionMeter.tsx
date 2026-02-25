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

const levelBg: Record<FactorLevel, string> = {
  safe: "bg-brand-green/10",
  warning: "bg-brand-yellow/10",
  danger: "bg-destructive/10",
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

      {/* Factors – simple emoji + text list */}
      <div className="native-card p-4 space-y-2.5">
        <p className="section-header">{t("simple.what_we_found")}</p>
        {factors.map((factor, i) => (
          <motion.div
            key={factor.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            className={`flex items-start gap-3 rounded-xl px-3.5 py-3 ${levelBg[factor.level]}`}
          >
            <span className="text-lg leading-none mt-0.5">{levelEmoji[factor.level]}</span>
            <p className="text-[13px] font-semibold text-foreground leading-snug">
              {factor.simpleLabel}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Gender split bar */}
      {genderStats.total > 0 && (
        <div className="native-card p-4">
          <p className="section-header mb-3">{t("simple.who_they_follow")}</p>
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
          <div className="h-3.5 rounded-full overflow-hidden flex">
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
          {/* Verdict sentence */}
          <p className="text-[13px] font-semibold text-foreground mt-3 text-center">
            {getGenderVerdict()}
          </p>
          {genderStats.unknown > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1 text-center">
              {t("suspicion.not_detected", { count: genderStats.unknown })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
