import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import type { FollowEvent } from "@/hooks/useTrackedProfiles";

interface WeeklyActivityChartProps {
  events: FollowEvent[];
}

export function WeeklyActivityChart({ events }: WeeklyActivityChartProps) {
  const { t } = useTranslation();

  const weeks = Array.from({ length: 8 }, (_, i) => {
    const weekEnd = new Date(Date.now() - (7 - i) * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const count = events.filter((e) => {
      const d = new Date(e.detected_at);
      return e.event_type === "follow" && d >= weekStart && d < weekEnd;
    }).length;
    return { week: `W${i + 1}`, follows: count };
  });

  return (
    <div className="ios-card">
      <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
        {t("insights.weeklyActivity")}
      </p>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeks}>
            <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis hide />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
            />
            <Bar dataKey="follows" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
