import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { SuspicionBreakdown } from "@/lib/suspicionAnalysis";

interface SuspicionMeterProps {
  analysis: SuspicionBreakdown;
}

export function SuspicionMeter({ analysis }: SuspicionMeterProps) {
  const { t } = useTranslation();
  const { overallScore, label, emoji, factors, genderStats } = analysis;

  const getBarGradient = () => {
    if (overallScore <= 15) return "from-emerald-400 to-emerald-500";
    if (overallScore <= 35) return "from-emerald-400 to-yellow-400";
    if (overallScore <= 55) return "from-yellow-400 to-orange-400";
    if (overallScore <= 75) return "from-orange-400 to-red-400";
    return "from-red-400 to-red-600";
  };

  const getScoreColor = () => {
    if (overallScore <= 15) return "text-emerald-600";
    if (overallScore <= 35) return "text-emerald-500";
    if (overallScore <= 55) return "text-yellow-600";
    if (overallScore <= 75) return "text-orange-500";
    return "text-red-500";
  };

  const getBgColor = () => {
    if (overallScore <= 15) return "bg-emerald-50 border-emerald-200";
    if (overallScore <= 35) return "bg-emerald-50/50 border-emerald-100";
    if (overallScore <= 55) return "bg-yellow-50 border-yellow-200";
    if (overallScore <= 75) return "bg-orange-50 border-orange-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="space-y-3">
      <div className={`ios-card border ${getBgColor()}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <div>
              <p className={`text-[15px] font-extrabold ${getScoreColor()}`}>{label}</p>
              <p className="text-[10px] text-muted-foreground">{t("suspicion.score_label")}</p>
            </div>
          </div>
          <div className={`text-2xl font-black ${getScoreColor()}`}>{overallScore}%</div>
        </div>
        <div className="h-3 bg-muted/60 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${getBarGradient()}`}
            initial={{ width: 0 }}
            animate={{ width: `${overallScore}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />
        </div>
      </div>

      <div className="ios-card space-y-3">
        <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">{t("suspicion.factors_title")}</p>
        {factors.map((factor, i) => (
          <motion.div key={factor.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center gap-3">
            <span className="text-lg flex-shrink-0">{factor.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-semibold text-foreground">{factor.name}</span>
                <span className="text-[11px] font-bold text-muted-foreground">{factor.score}/{factor.maxScore}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${factor.score > factor.maxScore * 0.6 ? "bg-red-400" : factor.score > factor.maxScore * 0.3 ? "bg-yellow-400" : "bg-emerald-400"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{factor.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {genderStats.total > 0 && (
        <div className="ios-card">
          <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("suspicion.gender_title")}</p>
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl bg-pink-50 p-2.5 text-center">
              <p className="text-lg font-extrabold text-pink-500">{genderStats.femalePercent}%</p>
              <p className="text-[10px] font-medium text-pink-400">{t("suspicion.female")}</p>
            </div>
            <div className="flex-1 rounded-xl bg-blue-50 p-2.5 text-center">
              <p className="text-lg font-extrabold text-blue-500">{genderStats.total > 0 ? 100 - genderStats.femalePercent : 0}%</p>
              <p className="text-[10px] font-medium text-blue-400">{t("suspicion.male")}</p>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden mt-2 flex">
            <motion.div className="h-full bg-pink-400" initial={{ width: 0 }} animate={{ width: `${genderStats.femalePercent}%` }} transition={{ duration: 0.8, delay: 0.4 }} />
            <motion.div className="h-full bg-blue-400" initial={{ width: 0 }} animate={{ width: `${100 - genderStats.femalePercent}%` }} transition={{ duration: 0.8, delay: 0.5 }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            {t("suspicion.based_on", { count: genderStats.female + genderStats.male })}
            {genderStats.unknown > 0 && ` ${t("suspicion.not_detected", { count: genderStats.unknown })}`}
          </p>
        </div>
      )}
    </div>
  );
}
