import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Info, ChevronDown, Search, Eye, Loader2 } from "lucide-react";
import { SpyIcon } from "@/components/SpyIcon";
import { SpyFindings } from "@/components/SpyFindings";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { haptic } from "@/lib/native";
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
  profileId?: string;
  unfollowScansToday?: number | null;
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
  profileId,
  unfollowScansToday,
}: SpyStatusCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [infoOpen, setInfoOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pushScanning, setPushScanning] = useState(false);
  const [unfollowScanning, setUnfollowScanning] = useState(false);

  const score = analysis?.overallScore ?? 0;
  const level = getSpyLevel(score);
  const levelConfig = LEVELS.find((l) => l.key === level)!;
  const levelColor = `hsl(${levelConfig.color})`;

  const { isProMax } = useSubscription();
  const pushRemaining = isProMax ? 999 : (pushScansToday ?? 4);
  const unfollowRemaining = unfollowScansToday ?? 1;

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

  // Ring config
  const ringSize = 140;
  const strokeWidth = 4.5;
  const radius = (ringSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - (score / 100) * circumference;

  const bgGlowColor = `hsl(var(--primary) / 0.22)`;
  const borderGlowColor = `hsl(var(--primary) / 0.35)`;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
    queryClient.invalidateQueries({ queryKey: ["follow_events"] });
    queryClient.invalidateQueries({ queryKey: ["follower_events"] });
    queryClient.invalidateQueries({ queryKey: ["profile_followings"] });
  };

  const handlePushScan = async () => {
    if (!profileId || pushRemaining <= 0) {
      toast.error(t("spy_detail.no_scans_left", "Keine Push-Scans mehr übrig heute ⏰"));
      return;
    }
    haptic.light();
    setPushScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("trigger-scan", {
        body: { profileId, scanType: "push" },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setPushScanning(false); return; }
      const newCount = (data?.results?.[0]?.new_follows || 0) + (data?.results?.[0]?.new_followers || 0);
      toast.success(t("spy_detail.scan_complete", { count: newCount }));
      invalidateAll();
    } catch {
      toast.error(t("spy_detail.scan_failed"));
    } finally {
      setPushScanning(false);
    }
  };

  const handleUnfollowScan = async () => {
    if (!profileId || unfollowRemaining <= 0) {
      toast.error(t("spy_detail.no_unfollow_left", "Kein Unfollow-Scan mehr übrig heute ⏰"));
      return;
    }
    haptic.light();
    setUnfollowScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("unfollow-check", {
        body: { profileId },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setUnfollowScanning(false); return; }
      const total = (data?.unfollows_found || 0) + (data?.lost_followers || 0) + (data?.new_follows_found || 0) + (data?.new_followers_found || 0);
      toast.success(t("spy_detail.unfollow_complete", { count: total }));
      invalidateAll();
    } catch {
      toast.error(t("spy_detail.unfollow_failed"));
    } finally {
      setUnfollowScanning(false);
    }
  };

  return (
    <>
      <div className="my-5 mb-8">
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
              <div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{
                  background: `radial-gradient(circle, hsl(${levelConfig.color} / 0.3), transparent 70%)`,
                }}
              />
              <svg width={ringSize} height={ringSize} className="rotate-[-90deg] relative z-10">
                <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke={`hsl(${levelConfig.color} / 0.1)`} strokeWidth={strokeWidth} />
                <motion.circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke={levelColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: scoreOffset }} transition={{ duration: 1.4, ease: "easeOut" }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <SpyIcon size={90} glow />
              </div>
            </div>

            {/* Level + Score */}
            <div className="mt-4 flex items-center gap-2">
              <span className="font-black text-lg tracking-tight" style={{ color: levelColor }}>{labelMap[level]}</span>
              <span className="text-lg">{levelConfig.emoji}</span>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="font-extrabold text-base tabular-nums" style={{ color: levelColor }}>{score}</span>
              <span className="text-muted-foreground text-xs">/100</span>
            </div>

            <p className="text-muted-foreground text-sm mt-2">{descMap[level]}</p>

            {/* CTA */}
            <motion.div
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-bold shadow-lg"
              style={{ boxShadow: "0 4px 14px -3px hsl(var(--primary) / 0.4)" }}
              whileTap={{ scale: 0.95 }}
            >
              {expanded
                ? t("spy_status.tap_to_close", "Analyse ausblenden")
                : t("spy_status.tap_for_analysis", "Analyse anzeigen")}
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <ChevronDown style={{ width: 14, height: 14 }} />
              </motion.div>
            </motion.div>
          </div>
        </button>
      </div>

      {/* Collapsible content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {/* Info Banner */}
            <div className="rounded-2xl p-4 mb-4 flex items-start gap-3" style={{ background: "hsl(var(--secondary) / 0.3)", border: "1px solid hsl(var(--border) / 0.3)" }}>
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  {t("spy_status.info_hourly", "Dein Spy scannt automatisch jede Stunde. Du kannst zusätzlich manuelle Scans auslösen.")}
                </p>
                <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                  {t("spy_status.info_unfollow_baseline", "Unfollow-Scans funktionieren erst nach dem ersten vollständigen Scan.")}
                </p>
              </div>
            </div>

            {/* Scan Action Buttons */}
            {profileId && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                {/* Push Scan */}
                <button
                  onClick={(e) => { e.stopPropagation(); handlePushScan(); }}
                  disabled={pushRemaining <= 0 || pushScanning}
                  className={`rounded-2xl border p-4 text-start transition-all active:scale-[0.97] ${
                    pushRemaining > 0
                      ? "border-primary/20 bg-gradient-to-br from-primary/10 to-card hover:from-primary/15"
                      : "border-muted bg-muted/30 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {pushScanning ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-[12px] font-bold text-foreground">{t("spy_detail.push_scan_title", "Push Scan")}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-2.5 leading-snug">
                    {pushRemaining > 0
                      ? t("spy_detail.push_desc", "Sofort scannen wer neu gefolgt wird")
                      : t("spy_detail.tomorrow", "Morgen wieder verfügbar ⏰")}
                  </p>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">
                    {isProMax ? t("spy_detail.unlimited", "∞ unlimited") : t("spy_detail.remaining", { current: pushRemaining, max: 4 })}
                  </p>
                  {!isProMax && <Progress value={(pushRemaining / 4) * 100} className="h-1.5 bg-muted" />}
                </button>

                {/* Unfollow Scan */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleUnfollowScan(); }}
                  disabled={unfollowRemaining <= 0 || unfollowScanning}
                  className={`rounded-2xl border p-4 text-start transition-all active:scale-[0.97] ${
                    unfollowRemaining > 0
                      ? "border-primary/20 bg-gradient-to-br from-primary/10 to-card hover:from-primary/15"
                      : "border-muted bg-muted/30 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {unfollowScanning ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-[12px] font-bold text-foreground">{t("spy_detail.unfollow_scan_title", "Unfollow Scan")}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-2.5 leading-snug">
                    {unfollowRemaining > 0
                      ? t("spy_detail.unfollow_desc", "Prüfe ob jemand entfolgt wurde")
                      : t("spy_detail.tomorrow", "Morgen wieder verfügbar ⏰")}
                  </p>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">
                    {t("spy_detail.remaining", { current: unfollowRemaining, max: 1 })}
                  </p>
                  <Progress value={(unfollowRemaining / 1) * 100} className="h-1.5 bg-muted" />
                </button>
              </div>
            )}

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
            <SheetDescription>{descMap[level]}</SheetDescription>
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
                  <p className="font-semibold text-sm" style={{ color: `hsl(${l.color})` }}>{labelMap[l.key]}</p>
                  <p className="text-muted-foreground text-xs">{descMap[l.key]}</p>
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
