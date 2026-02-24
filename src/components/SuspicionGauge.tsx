import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface SuspicionGaugeProps {
  score: number;
}

export function SuspicionGauge({ score }: SuspicionGaugeProps) {
  const { t } = useTranslation();

  const getColor = () => {
    if (score <= 20) return "hsl(142, 71%, 45%)";
    if (score <= 50) return "hsl(48, 96%, 53%)";
    return "hsl(0, 84%, 60%)";
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

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="100" viewBox="0 0 180 100" className="overflow-visible">
        {/* Background arc */}
        <path
          d="M 10 90 A 70 70 0 0 1 170 90"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <motion.path
          d="M 10 90 A 70 70 0 0 1 170 90"
          fill="none"
          stroke={getColor()}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        />
        {/* Score text */}
        <text x="90" y="70" textAnchor="middle" className="fill-foreground text-3xl font-extrabold" style={{ fontSize: "28px" }}>
          {score}%
        </text>
        <text x="90" y="90" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "11px" }}>
          {t("suspicion.score_label")}
        </text>
      </svg>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xl">{getEmoji()}</span>
        <span className="text-sm font-bold" style={{ color: getColor() }}>{getLabel()}</span>
      </div>
    </div>
  );
}
