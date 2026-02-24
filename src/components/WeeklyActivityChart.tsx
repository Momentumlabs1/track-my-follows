import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { FollowEvent } from "@/hooks/useTrackedProfiles";

interface WeeklyActivityChartProps {
  events: FollowEvent[];
}

export function WeeklyActivityChart({ events }: WeeklyActivityChartProps) {
  const { t } = useTranslation();

  const { weeks, trend } = useMemo(() => {
    const w = Array.from({ length: 5 }, (_, i) => {
      const weekEnd = new Date(Date.now() - (4 - i) * 7 * 24 * 60 * 60 * 1000);
      const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      const count = events.filter((e) => {
        const d = new Date(e.detected_at);
        return e.event_type === "follow" && d >= weekStart && d < weekEnd;
      }).length;
      return { label: `W${i + 1}`, count };
    });

    const lastWeek = w[w.length - 1]?.count || 0;
    const prevWeek = w[w.length - 2]?.count || 0;
    const trendPct = prevWeek > 0 ? Math.round(((lastWeek - prevWeek) / prevWeek) * 100) : 0;

    return { weeks: w, trend: trendPct };
  }, [events]);

  const maxCount = Math.max(...weeks.map((w) => w.count), 1);

  return (
    <div className="native-card p-4">
      <p className="section-header mb-3">{t("insights.weeklyActivity")}</p>

      {/* Bar chart */}
      <div className="flex items-end gap-2 h-24">
        {weeks.map((week, i) => (
          <div key={week.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-foreground tabular-nums">{week.count}</span>
            <motion.div
              className="w-full rounded-lg gradient-pink"
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(4, (week.count / maxCount) * 64)}px` }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            />
            <span className="text-[9px] text-muted-foreground font-medium">{week.label}</span>
          </div>
        ))}
      </div>

      {/* Trend */}
      {trend !== 0 && (
        <div className="flex items-center gap-1.5 mt-3 justify-center">
          {trend > 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-destructive" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-brand-green" />
          )}
          <span className={`text-[12px] font-bold ${trend > 0 ? "text-destructive" : "text-brand-green"}`}>
            {trend > 0 ? "+" : ""}{trend}% {t("insights.vs_last_week")}
          </span>
        </div>
      )}
    </div>
  );
}
