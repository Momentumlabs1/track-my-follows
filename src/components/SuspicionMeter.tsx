import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { SuspicionBreakdown, FactorLevel } from "@/lib/suspicionAnalysis";
import { SuspicionGauge } from "@/components/SuspicionGauge";
import { SpyIcon } from "@/components/SpyIcon";

interface SuspicionMeterProps {
  analysis: SuspicionBreakdown;
  weeklyScores?: number[];
}

const levelColor: Record<FactorLevel, string> = {
  safe: "hsl(145, 100%, 45%)",
  warning: "hsl(50, 100%, 52%)",
  danger: "hsl(338, 100%, 58%)",
};

const levelBg: Record<FactorLevel, string> = {
  safe: "hsl(145, 100%, 45%, 0.1)",
  warning: "hsl(50, 100%, 52%, 0.1)",
  danger: "hsl(338, 100%, 58%, 0.1)",
};

export function SuspicionMeter({ analysis, weeklyScores }: SuspicionMeterProps) {
  const { t } = useTranslation();
  const { overallScore, factors } = analysis;

  return (
    <div className="space-y-3">
      {/* Gauge */}
      <div className="native-card p-5">
        <SuspicionGauge score={overallScore} weeklyScores={weeklyScores} />
      </div>

      {/* Spy Report */}
      <div className="native-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <SpyIcon size={20} />
          <p className="font-bold text-foreground" style={{ fontSize: "0.9375rem" }}>
            {t("suspicion.spy_report", "Spion-Bericht")}
          </p>
        </div>

        <div className="space-y-2.5">
          {factors.map((factor, i) => {
            const pct = factor.maxScore > 0 ? Math.round((factor.score / factor.maxScore) * 100) : 0;
            return (
              <motion.div
                key={factor.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="rounded-xl bg-secondary/30 px-3.5 py-3"
                style={{ borderLeft: `3px solid ${levelColor[factor.level]}` }}
              >
                <div className="flex items-center gap-2.5">
                  <span style={{ fontSize: "1rem" }}>{factor.icon}</span>
                  <p className="text-foreground font-semibold leading-snug flex-1" style={{ fontSize: "0.8125rem" }}>
                    {factor.simpleLabel}
                  </p>
                  <div
                    className="flex-shrink-0 rounded-full px-2 py-0.5 font-bold"
                    style={{
                      fontSize: "0.6875rem",
                      color: levelColor[factor.level],
                      background: levelBg[factor.level],
                    }}
                  >
                    {pct}%
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
