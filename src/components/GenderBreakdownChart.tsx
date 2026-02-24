import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { FollowEvent } from "@/hooks/useTrackedProfiles";

interface GenderBreakdownChartProps {
  events: FollowEvent[];
}

export function GenderBreakdownChart({ events }: GenderBreakdownChartProps) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const recentFollows = events.filter(
      (e) => e.event_type === "follow" && new Date(e.detected_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );
    const female = recentFollows.filter((e) => (e as Record<string, unknown>).gender_tag === "female").length;
    const male = recentFollows.filter((e) => (e as Record<string, unknown>).gender_tag === "male").length;
    const unknown = recentFollows.length - female - male;
    const total = Math.max(recentFollows.length, 1);
    return {
      female, male, unknown, total: recentFollows.length,
      femalePct: Math.round((female / total) * 100),
      malePct: Math.round((male / total) * 100),
      unknownPct: Math.round((unknown / total) * 100),
    };
  }, [events]);

  if (stats.total === 0) return null;

  return (
    <div className="native-card p-4">
      <p className="section-header mb-3">{t("insights.genderBreakdown")}</p>

      {/* Big numbers */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 text-center">
          <span className="text-2xl font-extrabold text-primary">♀ {stats.femalePct}%</span>
          <p className="text-[11px] text-muted-foreground">{stats.female} {t("gender.female")}</p>
        </div>
        <div className="flex-1 text-center">
          <span className="text-2xl font-extrabold text-blue-500">♂ {stats.malePct}%</span>
          <p className="text-[11px] text-muted-foreground">{stats.male} {t("gender.male")}</p>
        </div>
        {stats.unknown > 0 && (
          <div className="text-center">
            <span className="text-lg font-bold text-muted-foreground">? {stats.unknownPct}%</span>
            <p className="text-[10px] text-muted-foreground">{stats.unknown}</p>
          </div>
        )}
      </div>

      {/* Split bar */}
      <div className="h-3 rounded-full overflow-hidden flex">
        <motion.div className="h-full gradient-pink" initial={{ width: 0 }} animate={{ width: `${stats.femalePct}%` }} transition={{ duration: 0.8 }} />
        <motion.div className="h-full bg-blue-500" initial={{ width: 0 }} animate={{ width: `${stats.malePct}%` }} transition={{ duration: 0.8, delay: 0.1 }} />
        {stats.unknownPct > 0 && (
          <motion.div className="h-full bg-muted-foreground/30" initial={{ width: 0 }} animate={{ width: `${stats.unknownPct}%` }} transition={{ duration: 0.8, delay: 0.2 }} />
        )}
      </div>

      <p className="text-[11px] text-muted-foreground mt-2 text-center">
        {t("insights.last_30_days")}: {stats.female} {t("gender.female")}, {stats.male} {t("gender.male")}
      </p>
    </div>
  );
}
