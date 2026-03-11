import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Info, ChevronDown } from "lucide-react";
import { SpyIcon } from "@/components/SpyIcon";
import { SpyFindings } from "@/components/SpyFindings";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { SuspicionBreakdown } from "@/lib/suspicionAnalysis";
import type { FollowEvent } from "@/hooks/useTrackedProfiles";

interface SpyStatusCardProps {
  analysis: SuspicionBreakdown | null;
  realEventCount: number;
  followEvents?: FollowEvent[];
  followerEvents?: Array<{ event_type: string; is_initial?: boolean | null; detected_at: string; username: string }>;
  profileFollowings?: Array<{ following_username: string; gender_tag?: string | null }>;
  followerCount?: number;
  followingCount?: number;
}

type SpyLevel = "gelassen" | "aufmerksam" | "wachsam" | "alarmiert";

interface LevelConfig {
  key: SpyLevel;
  label: string;
  color: string;
  emoji: string;
  index: number;
}

const LEVELS: LevelConfig[] = [
  { key: "gelassen", label: "Gelassen", color: "hsl(142 71% 45%)", emoji: "😌", index: 0 },
  { key: "aufmerksam", label: "Aufmerksam", color: "hsl(45 100% 51%)", emoji: "🤨", index: 1 },
  { key: "wachsam", label: "Wachsam", color: "hsl(30 100% 50%)", emoji: "😠", index: 2 },
  { key: "alarmiert", label: "Alarmiert", color: "hsl(4 90% 58%)", emoji: "🚨", index: 3 },
];

function getSpyLevel(score: number): SpyLevel {
  if (score <= 15) return "gelassen";
  if (score <= 40) return "aufmerksam";
  if (score <= 65) return "wachsam";
  return "alarmiert";
}

export function SpyStatusCard({
  analysis,
  realEventCount,
  followEvents = [],
  followerEvents = [],
  profileFollowings = [],
  followerCount = 0,
  followingCount = 0,
}: SpyStatusCardProps) {
  const { t } = useTranslation();
  const [infoOpen, setInfoOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
      ? t("spy_status.no_clear_signals", "Dein Spy wurde gerade aktiviert und sammelt ab jetzt Daten. Die Analyse wird genauer je länger der Spy aktiv ist.")
      : t("spy_status.gelassen_desc", "Alles sieht normal aus"),
    aufmerksam: t("spy_status.aufmerksam_desc", "Leichte Auffälligkeiten im Follow-Verhalten"),
    wachsam: t("spy_status.wachsam_desc", "Mehrere verdächtige Signale erkannt"),
    alarmiert: t("spy_status.alarmiert_desc", "Stark auffälliges Verhaltensmuster"),
  };

  const ringSize = 100;
  const strokeWidth = 5;
  const radius = (ringSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - (score / 100) * circumference;

  const handleCardClick = () => {
    setExpanded((prev) => !prev);
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInfoOpen(true);
  };

  return (
    <>
      <div className="mb-2">
        <button
          type="button"
          onClick={handleCardClick}
          className="w-full text-left rounded-3xl overflow-hidden transition-transform active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${levelConfig.color}15, ${levelConfig.color}08)`,
            border: `1px solid ${levelConfig.color}30`,
          }}
        >
          <div className="p-5">
            <div className="flex items-center gap-5">
              {/* Score Ring with SpyIcon */}
              <div className="relative flex-shrink-0" style={{ width: ringSize, height: ringSize }}>
                <svg width={ringSize} height={ringSize} className="rotate-[-90deg]">
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke={levelConfig.color}
                    strokeWidth={strokeWidth}
                    opacity={0.15}
                  />
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <SpyIcon size={48} glow />
                </div>
              </div>

              {/* Right side: label + level + score */}
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground mb-0.5" style={{ fontSize: "0.6875rem" }}>
                  {t("spy_status.your_spy_is", "Dein Spy ist:")}
                </p>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className="font-black"
                    style={{
                      fontSize: "1.5rem",
                      lineHeight: 1.1,
                      color: levelConfig.color,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {labelMap[level]}
                  </span>
                  <span style={{ fontSize: "1.25rem" }}>{levelConfig.emoji}</span>
                  <span className="flex items-baseline gap-0.5">
                    <span
                      className="font-extrabold tabular-nums"
                      style={{ fontSize: "0.875rem", color: levelConfig.color }}
                    >
                      {score}
                    </span>
                    <span className="text-muted-foreground" style={{ fontSize: "0.625rem" }}>
                      /100
                    </span>
                  </span>
                </div>
              </div>

              {/* Info hint */}
              <button
                type="button"
                onClick={handleInfoClick}
                className="flex-shrink-0 p-1"
              >
                <Info className="text-muted-foreground" style={{ width: 16, height: 16, opacity: 0.4 }} />
              </button>
            </div>
          </div>

          {/* Level segments footer */}
          <div className="px-5 pb-3 pt-1">
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

          {/* Chevron indicator */}
          <div className="flex justify-center pb-2">
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="text-muted-foreground" style={{ width: 16, height: 16, opacity: 0.4 }} />
            </motion.div>
          </div>
        </button>
      </div>

      {/* Collapsible SpyFindings */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <SpyFindings
              followEvents={followEvents}
              followerEvents={followerEvents}
              profileFollowings={profileFollowings}
              followerCount={followerCount}
              followingCount={followingCount}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Sheet */}
      <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <SpyIcon size={24} />
              {t("spy_status.info_title", "Spy-Status Erklärung")}
            </SheetTitle>
            <SheetDescription>
              {descMap[level]}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 pb-6">
            {LEVELS.map((l) => (
              <div
                key={l.key}
                className="flex items-start gap-3 rounded-xl p-3"
                style={{
                  background: l.key === level ? `${l.color}12` : undefined,
                  border: l.key === level ? `1px solid ${l.color}30` : "1px solid transparent",
                }}
              >
                <span style={{ fontSize: "1.25rem" }}>{l.emoji}</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: l.color }}>
                    {labelMap[l.key]}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {descMap[l.key]}
                  </p>
                </div>
              </div>
            ))}

            {realEventCount > 0 && realEventCount < 5 && (
              <p className="text-muted-foreground text-xs pt-2" style={{ opacity: 0.6 }}>
                ⏳ {t("spy_status.early_estimate", "Frühe Einschätzung · wenig Aktivität")}
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
