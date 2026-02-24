import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface SuspicionGaugeProps {
  score: number;
  weeklyScores?: number[];
}

export function SuspicionGauge({ score, weeklyScores }: SuspicionGaugeProps) {
  const { t } = useTranslation();

  const getColor = () => {
    if (score <= 20) return "hsl(145, 100%, 45%)";
    if (score <= 50) return "hsl(50, 100%, 52%)";
    return "hsl(338, 100%, 58%)";
  };

  const getLabel = () => {
    if (score <= 20) return t("suspicion.safe");
    if (score <= 50) return t("suspicion.suspicious");
    return t("suspicion.verySuspicious");
  };

  const getEmoji = () => {
    if (score <= 15) return "😇";
    if (score <= 35) return "😊";
    if (score <= 55) return "🤨";
    if (score <= 75) return "😬";
    return "🚩";
  };

  const radius = 70;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getColor();

  return (
    <div className="flex flex-col items-center">
      {/* Gauge */}
      <div className="relative">
        <svg width="200" height="110" viewBox="0 0 200 110" className="overflow-visible">
          {/* Glow effect */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background arc */}
          <path
            d="M 15 95 A 70 70 0 0 1 185 95"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <motion.path
            d="M 15 95 A 70 70 0 0 1 185 95"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            filter="url(#glow)"
          />
        </svg>
        {/* Score overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <motion.span
            className="text-4xl font-extrabold text-foreground tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-[11px] text-muted-foreground font-medium -mt-1">{t("suspicion.score_label")}</span>
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xl">{getEmoji()}</span>
        <span className="text-sm font-bold" style={{ color }}>{getLabel()}</span>
      </div>

      {/* Mini sparkline */}
      {weeklyScores && weeklyScores.length > 1 && (
        <div className="mt-3 flex items-end gap-1.5 h-8">
          {weeklyScores.map((s, i) => (
            <motion.div
              key={i}
              className="w-3 rounded-full"
              style={{
                background: s <= 20 ? "hsl(145, 100%, 45%)" : s <= 50 ? "hsl(50, 100%, 52%)" : "hsl(338, 100%, 58%)",
              }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(4, (s / 100) * 32)}px` }}
              transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
            />
          ))}
        </div>
      )}
      {weeklyScores && weeklyScores.length > 1 && (
        <p className="text-[10px] text-muted-foreground mt-1">{t("suspicion.trend_4_weeks")}</p>
      )}
    </div>
  );
}
