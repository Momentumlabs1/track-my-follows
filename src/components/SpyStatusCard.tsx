import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SpyIcon } from "@/components/SpyIcon";
import type { SuspicionBreakdown } from "@/lib/suspicionAnalysis";

interface SpyStatusCardProps {
  analysis: SuspicionBreakdown | null;
  realEventCount: number;
}

type SpyLevel = "gelassen" | "aufmerksam" | "wachsam" | "alarmiert";

interface LevelConfig {
  key: SpyLevel;
  color: string;
  bgTint: string;
  borderTint: string;
  index: number;
}

const LEVELS: LevelConfig[] = [
  { key: "gelassen", color: "hsl(142 71% 45%)", bgTint: "hsl(142 71% 45% / 0.08)", borderTint: "hsl(142 71% 45% / 0.15)", index: 0 },
  { key: "aufmerksam", color: "hsl(45 100% 51%)", bgTint: "hsl(45 100% 51% / 0.08)", borderTint: "hsl(45 100% 51% / 0.15)", index: 1 },
  { key: "wachsam", color: "hsl(30 100% 50%)", bgTint: "hsl(30 100% 50% / 0.08)", borderTint: "hsl(30 100% 50% / 0.15)", index: 2 },
  { key: "alarmiert", color: "hsl(4 90% 58%)", bgTint: "hsl(4 90% 58% / 0.08)", borderTint: "hsl(4 90% 58% / 0.15)", index: 3 },
];

function getSpyLevel(score: number): SpyLevel {
  if (score <= 15) return "gelassen";
  if (score <= 40) return "aufmerksam";
  if (score <= 65) return "wachsam";
  return "alarmiert";
}

export function SpyStatusCard({ analysis, realEventCount }: SpyStatusCardProps) {
  const { t } = useTranslation();

  const score = analysis?.overallScore ?? 0;
  const level = getSpyLevel(score);
  const levelConfig = LEVELS.find((l) => l.key === level)!;

  const labelMap: Record<SpyLevel, string> = {
    gelassen: t("spy_status.gelassen", "Gelassen"),
    aufmerksam: t("spy_status.aufmerksam", "Aufmerksam"),
    wachsam: t("spy_status.wachsam", "Wachsam"),
    alarmiert: t("spy_status.alarmiert", "Alarmiert"),
  };

  const descMap: Record<SpyLevel, string> = {
    gelassen: realEventCount === 0
      ? t("spy_status.no_clear_signals", "Noch keine klaren Auffälligkeiten — dein Spy sammelt erste Signale")
      : t("spy_status.gelassen_desc", "Sieht alles normal aus"),
    aufmerksam: t("spy_status.aufmerksam_desc", "Leichte Auffälligkeiten erkannt"),
    wachsam: t("spy_status.wachsam_desc", "Mehrere Signale erkannt"),
    alarmiert: t("spy_status.alarmiert_desc", "Stark auffälliges Muster"),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl p-5 mb-5 border"
      style={{
        background: levelConfig.bgTint,
        borderColor: levelConfig.borderTint,
      }}
    >
      {/* Title row with SpyIcon */}
      <div className="flex items-center gap-2 mb-3">
        <SpyIcon size={24} />
        <p className="text-muted-foreground font-medium" style={{ fontSize: "0.8125rem" }}>
          {t("spy_status.title", "Dein Spy ist...")}
        </p>
      </div>

      {/* Level label */}
      <p
        className="font-extrabold mb-1"
        style={{ fontSize: "1.5rem", color: levelConfig.color, lineHeight: 1.2 }}
      >
        {labelMap[level]}
      </p>

      {/* Description */}
      <p className="text-muted-foreground mb-4" style={{ fontSize: "0.8125rem" }}>
        {descMap[level]}
      </p>

      {/* Early estimate disclaimer */}
      {realEventCount > 0 && realEventCount < 5 && (
        <p className="text-muted-foreground mb-4" style={{ fontSize: "0.6875rem", opacity: 0.6 }}>
          {t("spy_status.early_estimate", "Frühe Einschätzung · wenig Aktivität")}
        </p>
      )}

      {/* 4-segment indicator */}
      <div className="flex gap-1.5">
        {LEVELS.map((l) => (
          <div
            key={l.key}
            className="flex-1 rounded-full"
            style={{
              height: 6,
              background: l.index <= levelConfig.index ? levelConfig.color : "hsl(var(--border))",
              opacity: l.index <= levelConfig.index ? 1 : 0.3,
              transition: "background 0.4s, opacity 0.4s",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
