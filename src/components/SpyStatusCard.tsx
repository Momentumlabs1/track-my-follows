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
  lastScannedAt?: string | null;
  totalScans?: number | null;
  pushScansToday?: number | null;
}

type SpyLevel = "gelassen" | "aufmerksam" | "wachsam" | "alarmiert";

interface LevelConfig {
  key: SpyLevel;
  color: string;
  emoji: string;
  index: number;
}

const LEVELS: LevelConfig[] = [
  { key: "gelassen", color: "142 71% 45%", emoji: "😌", index: 0 },
  { key: "aufmerksam", color: "45 100% 51%", emoji: "🤨", index: 1 },
  { key: "wachsam", color: "30 100% 50%", emoji: "😠", index: 2 },
  { key: "alarmiert", color: "4 90% 58%", emoji: "🚨", index: 3 },
];

function getSpyLevel(score: number): SpyLevel {
  if (score <= 15) return "gelassen";
  if (score <= 40) return "aufmerksam";
  if (score <= 65) return "wachsam";
  return "alarmiert";
}

function timeAgoShort(dateStr: string | null): string {
  if (!dateStr) return "–";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "gerade";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function SpyStatusCard({
  analysis,
  realEventCount,
  followEvents = [],
  followerEvents = [],
  profileFollowings = [],
  followerCount = 0,
  followingCount = 0,
  lastScannedAt,
  totalScans,
  pushScansToday,
}: SpyStatusCardProps) {
  const { t } = useTranslation();
  const [infoOpen, setInfoOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const score = analysis?.overallScore ?? 0;
  const level = getSpyLevel(score);
  const levelConfig = LEVELS.find((l) => l.key === level)!;
  const levelColor = `hsl(${levelConfig.color})`;

  const labelMap: Record<SpyLevel, string> = {
    gelassen: t("spy_status.gelassen", "Gelassen"),
    aufmerksam: t("spy_status.aufmerksam", "Aufmerksam"),
    wachsam: t("spy_status.wachsam", "Wachsam"),
    alarmiert: t("spy_status.alarmiert", "Alarmiert"),
  };

  const descMap: Record<SpyLevel, string> = {
    gelassen: realEventCount === 0
      ? t("spy_status.no_clear_signals", "Sammelt gerade erste Daten…")
      : t("spy_status.gelassen_desc", "Alles sieht normal aus"),
    aufmerksam: t("spy_status.aufmerksam_desc", "Leichte Auffälligkeiten erkannt"),
    wachsam: t("spy_status.wachsam_desc", "Mehrere verdächtige Signale"),
    alarmiert: t("spy_status.alarmiert_desc", "Stark auffälliges Verhalten"),
  };

  // Ring config - compact
  const ringSize = 120;
  const strokeWidth = 4;
  const radius = (ringSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - (score / 100) * circumference;

  // Card uses brighter primary pink
  const bgGlowColor = `hsl(var(--primary) / 0.15)`;
  const borderGlowColor = `hsl(var(--primary) / 0.3)`;

  return (
    <>
      <div className="my-5">
        {/* Section title */}
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
          {t("spy_status.section_title", "Spy-Analyse")}
        </p>

        {/* Card */}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="relative w-full rounded-3xl text-center transition-all active:scale-[0.98] overflow-hidden"
          style={{
            background: `linear-gradient(180deg, ${bgGlowColor}, hsl(var(--card)))`,
            border: `1px solid ${borderGlowColor}`,
            boxShadow: `0 0 40px -12px hsl(var(--primary) / 0.25), 0 2px 8px -2px hsl(var(--foreground) / 0.05)`,
          }}
        >
          {/* Info icon */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setInfoOpen(true); }}
            className="absolute top-4 right-4 p-1.5 rounded-full z-10"
            style={{ background: "hsl(var(--foreground) / 0.05)" }}
          >
            <Info className="text-muted-foreground" style={{ width: 14, height: 14 }} />
          </button>

          <div className="flex flex-col items-center px-5 pt-6 pb-5">
            {/* Mood Ring with Spy */}
            <div className="relative" style={{ width: ringSize, height: ringSize }}>
              {/* Ambient glow behind ring */}
              <div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{
                  background: `radial-gradient(circle, hsl(${levelConfig.color} / 0.3), transparent 70%)`,
                }}
              />

              <svg width={ringSize} height={ringSize} className="rotate-[-90deg] relative z-10">
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke={`hsl(${levelConfig.color} / 0.1)`}
                  strokeWidth={strokeWidth}
                />
                <motion.circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke={levelColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: scoreOffset }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center z-10">
                <SpyIcon size={72} glow />
              </div>
            </div>

            {/* Level + Score inline */}
            <div className="mt-3 flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight" style={{ color: levelColor }}>
                {labelMap[level]}
              </span>
              <span className="text-base">{levelConfig.emoji}</span>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="font-extrabold text-sm tabular-nums" style={{ color: levelColor }}>{score}</span>
              <span className="text-muted-foreground" style={{ fontSize: "0.625rem" }}>/100</span>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-xs mt-1">
              {descMap[level]}
            </p>

            {/* CTA */}
            <motion.div
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-5 py-2 text-xs font-bold shadow-lg"
              style={{ boxShadow: "0 4px 14px -3px hsl(var(--primary) / 0.4)" }}
              whileTap={{ scale: 0.95 }}
            >
              {expanded
                ? t("spy_status.tap_to_close", "Analyse ausblenden")
                : t("spy_status.tap_for_analysis", "Analyse anzeigen")}
              <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown style={{ width: 14, height: 14 }} />
              </motion.div>
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
                  background: l.key === level ? `hsl(${l.color} / 0.08)` : undefined,
                  border: l.key === level ? `1px solid hsl(${l.color} / 0.2)` : "1px solid transparent",
                }}
              >
                <span style={{ fontSize: "1.25rem" }}>{l.emoji}</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: `hsl(${l.color})` }}>
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
