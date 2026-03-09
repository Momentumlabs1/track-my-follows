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

  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getColor();

  return (
    <div className="flex flex-col items-center">
      {/* Circular ring gauge */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "center",
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </svg>
        {/* Score centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-foreground font-extrabold tabular-nums"
            style={{ fontSize: "3rem", lineHeight: 1 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {score}
          </motion.span>
          <span className="text-muted-foreground font-medium" style={{ fontSize: "0.6875rem" }}>
            {t("suspicion.score_label")}
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center gap-2 mt-3">
        <span style={{ fontSize: "1.25rem" }}>{getEmoji()}</span>
        <span className="font-bold" style={{ color, fontSize: "1rem" }}>{getLabel()}</span>
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
        <p className="text-muted-foreground mt-1" style={{ fontSize: "0.625rem" }}>{t("suspicion.trend_4_weeks")}</p>
      )}
    </div>
  );
}
