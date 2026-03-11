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
  label: string;
  color: string;
  emoji: string;
  index: number;
  scoreRange: [number, number];
}

const LEVELS: LevelConfig[] = [
  { key: "gelassen", label: "Gelassen", color: "hsl(142 71% 45%)", emoji: "😌", index: 0, scoreRange: [0, 15] },
  { key: "aufmerksam", label: "Aufmerksam", color: "hsl(45 100% 51%)", emoji: "🤨", index: 1, scoreRange: [16, 40] },
  { key: "wachsam", label: "Wachsam", color: "hsl(30 100% 50%)", emoji: "😠", index: 2, scoreRange: [41, 65] },
  { key: "alarmiert", label: "Alarmiert", color: "hsl(4 90% 58%)", emoji: "🚨", index: 3, scoreRange: [66, 100] },
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
      ? t("spy_status.no_clear_signals", "Keine Auffälligkeiten — dein Spy sammelt Signale")
      : t("spy_status.gelassen_desc", "Alles sieht normal aus"),
    aufmerksam: t("spy_status.aufmerksam_desc", "Leichte Auffälligkeiten im Follow-Verhalten"),
    wachsam: t("spy_status.wachsam_desc", "Mehrere verdächtige Signale erkannt"),
    alarmiert: t("spy_status.alarmiert_desc", "Stark auffälliges Verhaltensmuster"),
  };

  // Score ring SVG params
  const ringSize = 88;
  const strokeWidth = 5;
  const radius = (ringSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - (score / 100) * circumference;

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
          <div className="flex items-center gap-2.5 mb-4">
            <SpyIcon size={24} glow />
            <span className="text-muted-foreground font-medium" style={{ fontSize: "0.8125rem" }}>
              {t("spy_status.title", "Dein Spy ist...")}
            </span>
          </div>

          {/* Main content: Ring + Right side */}
          <div className="flex items-center gap-5">
            {/* ═══ Score Ring with SpyIcon ═══ */}
            <div className="relative flex-shrink-0" style={{ width: ringSize, height: ringSize }}>
              <svg width={ringSize} height={ringSize} className="rotate-[-90deg]">
                {/* Background track */}
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth={strokeWidth}
                  opacity={0.3}
                />
                {/* Score arc */}
                <motion.circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke={levelConfig.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: scoreOffset }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </svg>
              {/* SpyIcon in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <SpyIcon size={36} glow />
              </div>
            </div>

            {/* ═══ Right side content ═══ */}
            <div className="flex-1 min-w-0">
              {/* Level name + emoji */}
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="font-black"
                  style={{
                    fontSize: "1.75rem",
                    lineHeight: 1.1,
                    color: levelConfig.color,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {labelMap[level]}
                </span>
                <span style={{ fontSize: "1.5rem" }}>{levelConfig.emoji}</span>
              </div>

              {/* Score number */}
              <div className="flex items-baseline gap-0.5 mb-1.5">
                <span
                  className="font-extrabold tabular-nums"
                  style={{ fontSize: "1.125rem", color: levelConfig.color }}
                >
                  {score}
                </span>
                <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                  /100
                </span>
              </div>

              {/* Description */}
              <p className="text-muted-foreground" style={{ fontSize: "0.75rem", lineHeight: 1.4 }}>
                {descMap[level]}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ Level segments footer ═══ */}
        <div className="px-5 pb-4 pt-2" style={{ background: "hsl(var(--card) / 0.6)" }}>
          <div className="flex gap-1.5 mb-1.5">
            {LEVELS.map((l) => {
              const isActive = l.index <= levelConfig.index;
              const isCurrent = l.index === levelConfig.index;

              return (
                <motion.div
                  key={l.key}
                  className="flex-1 rounded-full"
                  style={{
                    height: 8,
                    background: isActive ? levelConfig.color : "hsl(var(--border))",
                    opacity: isActive ? 1 : 0.15,
                  }}
                  animate={isCurrent ? { scaleY: [1, 1.3, 1] } : { scaleY: 1 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              );
            })}
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

        {/* Early estimate note */}
        {realEventCount > 0 && realEventCount < 5 && (
          <div className="px-5 pb-3">
            <p className="text-muted-foreground" style={{ fontSize: "0.6875rem", opacity: 0.5 }}>
              ⏳ {t("spy_status.early_estimate", "Frühe Einschätzung · wenig Aktivität")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
