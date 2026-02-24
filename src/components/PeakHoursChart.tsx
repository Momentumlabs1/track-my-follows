import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useTranslation } from "react-i18next";
import type { FollowEvent } from "@/hooks/useTrackedProfiles";

interface PeakHoursChartProps {
  events: FollowEvent[];
}

export function PeakHoursChart({ events }: PeakHoursChartProps) {
  const { t } = useTranslation();

  const hourData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, "0")}`,
    count: events.filter(
      (e) => e.event_type === "follow" && new Date(e.detected_at).getHours() === i,
    ).length,
  }));

  const maxCount = Math.max(...hourData.map((d) => d.count), 1);
  const topHours = [...hourData]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((d) => `${d.hour}:00`);

  return (
    <div className="ios-card">
      <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
        {t("insights.peakHours")}
      </p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourData}>
            <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} stroke="hsl(var(--muted-foreground))" />
            <YAxis hide />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {hourData.map((entry) => (
                <Cell
                  key={entry.hour}
                  fill={entry.count >= maxCount * 0.7 ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        {t("insights.mostActive")}: {topHours.join(", ")}
      </p>
    </div>
  );
}
