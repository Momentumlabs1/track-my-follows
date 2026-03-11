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
  index: number;
}

const LEVELS: LevelConfig[] = [
  { key: "gelassen", color: "hsl(142 71% 45%)", index: 0 },
  { key: "aufmerksam", color: "hsl(45 100% 51%)", index: 1 },
  { key: "wachsam", color: "hsl(30 100% 50%)", index: 2 },
  { key: "alarmiert", color: "hsl(4 90% 58%)", index: 3 },
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
    <div className="mb-2">
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border) / 0.3)",
        }}
      >
        {/* Top accent stripe */}
        <div className="h-1 w-full" style={{ background: levelConfig.color }} />

        <div className="p-5">
          {/* Row: Spy icon + label */}
          <div className="flex items-center gap-2.5 mb-3">
            <SpyIcon size={24} glow />
            <span className="text-muted-foreground font-medium" style={{ fontSize: "0.8125rem" }}>
              {t("spy_status.title", "Dein Spy ist...")}
            </span>
          </div>

          {/* HERO level label */}
          <p
            style={{
              fontSize: "3.25rem",
              fontWeight: 900,
              lineHeight: 1,
              color: levelConfig.color,
              marginBottom: "0.375rem",
              letterSpacing: "-0.02em",
            }}
          >
            {labelMap[level]}
          </p>

          {/* Description */}
          <p className="text-muted-foreground" style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
            {descMap[level]}
          </p>

          {/* Early estimate */}
          {realEventCount > 0 && realEventCount < 5 && (
            <p className="text-muted-foreground mb-3" style={{ fontSize: "0.6875rem", opacity: 0.5 }}>
              ⏳ {t("spy_status.early_estimate", "Frühe Einschätzung · wenig Aktivität")}
            </p>
          )}
        </div>

        {/* Bar section – darker footer */}
        <div className="px-5 pb-4 pt-2" style={{ background: "hsl(var(--card) / 0.6)" }}>
          <div className="flex gap-1.5 mb-1.5">
            {LEVELS.map((l) => (
              <motion.div
                key={l.key}
                className="flex-1 rounded-full"
                style={{
                  height: 8,
                  background: l.index <= levelConfig.index ? levelConfig.color : "hsl(var(--border))",
                  opacity: l.index <= levelConfig.index ? 1 : 0.15,
                }}
                animate={l.index === levelConfig.index ? { scaleY: [1, 1.3, 1] } : { scaleY: 1 }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            ))}
          </div>
          <div className="flex justify-between">
            {LEVELS.map((l) => (
              <span
                key={l.key}
                style={{
                  fontSize: "0.5625rem",
                  color: l.key === level ? levelConfig.color : "hsl(var(--muted-foreground))",
                  fontWeight: l.key === level ? 700 : 400,
                }}
              >
                {labelMap[l.key]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
