import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Info, ChevronRight } from "lucide-react";
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
  color: string;
  emoji: string;
  index: number;
}

const LEVELS: LevelConfig[] = [
  { key: "gelassen", color: "hsl(142 71% 45%)", emoji: "😌", index: 0 },
  { key: "aufmerksam", color: "hsl(45 100% 51%)", emoji: "🤨", index: 1 },
  { key: "wachsam", color: "hsl(30 100% 50%)", emoji: "😠", index: 2 },
  { key: "alarmiert", color: "hsl(4 90% 58%)", emoji: "🚨", index: 3 },
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
      ? t("spy_status.no_clear_signals", "Dein Spy wurde gerade aktiviert und sammelt ab jetzt Daten.")
      : t("spy_status.gelassen_desc", "Alles sieht normal aus"),
    aufmerksam: t("spy_status.aufmerksam_desc", "Leichte Auffälligkeiten im Follow-Verhalten"),
    wachsam: t("spy_status.wachsam_desc", "Mehrere verdächtige Signale erkannt"),
    alarmiert: t("spy_status.alarmiert_desc", "Stark auffälliges Verhaltensmuster"),
  };

  const ringSize = 120;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - (score / 100) * circumference;

  return (
    <>
      <div className="my-4">
        {/* Section title */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <SpyIcon size={18} />
          <span className="text-sm font-bold text-foreground">
            {t("spy_status.section_title", "Deine Spy-Analyse")}
          </span>
        </div>

        {/* Card */}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="relative w-full rounded-2xl border border-primary/20 bg-card p-6 text-center transition-all active:scale-[0.98]"
          style={{
            boxShadow: "0 2px 12px -4px hsl(var(--primary) / 0.12)",
          }}
        >
          {/* Info icon top-right */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setInfoOpen(true); }}
            className="absolute top-4 right-4 p-1"
          >
            <Info className="text-muted-foreground" style={{ width: 16, height: 16, opacity: 0.4 }} />
          </button>

          {/* Centered ring + spy icon */}
          <div className="flex flex-col items-center">
            <div className="relative" style={{ width: ringSize, height: ringSize }}>
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
                <SpyIcon size={56} glow />
              </div>
            </div>

            {/* Level + Score */}
            <div className="mt-3 flex items-center gap-2">
              <span className="font-bold text-lg" style={{ color: levelConfig.color }}>
                {labelMap[level]}
              </span>
              <span className="text-lg">{levelConfig.emoji}</span>
              <span className="text-muted-foreground text-sm">·</span>
              <span className="font-bold text-sm tabular-nums" style={{ color: levelConfig.color }}>
                {score}
              </span>
              <span className="text-muted-foreground text-xs">/100</span>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-xs mt-1">
              {descMap[level]}
            </p>

            {/* CTA pill */}
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs font-bold">
              {expanded
                ? t("spy_status.tap_to_close", "Analyse ausblenden")
                : t("spy_status.tap_for_analysis", "Analyse anzeigen")}
              <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronRight style={{ width: 12, height: 12 }} />
              </motion.div>
            </span>
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
