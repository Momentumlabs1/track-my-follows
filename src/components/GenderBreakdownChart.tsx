import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import type { FollowEvent } from "@/hooks/useTrackedProfiles";

interface GenderBreakdownChartProps {
  events: FollowEvent[];
}

export function GenderBreakdownChart({ events }: GenderBreakdownChartProps) {
  const { t } = useTranslation();

  const recentFollows = events.filter(
    (e) =>
      e.event_type === "follow" &&
      new Date(e.detected_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  );

  const female = recentFollows.filter((e) => (e as Record<string, unknown>).gender_tag === "female").length;
  const male = recentFollows.filter((e) => (e as Record<string, unknown>).gender_tag === "male").length;
  const unknown = recentFollows.filter((e) => (e as Record<string, unknown>).gender_tag === "unknown" || !(e as Record<string, unknown>).gender_tag).length;
  const total = Math.max(female + male + unknown, 1);

  const data = [
    { name: t("gender.female"), value: female, color: "hsl(330, 80%, 60%)" },
    { name: t("gender.male"), value: male, color: "hsl(210, 80%, 60%)" },
    { name: t("gender.unknown"), value: unknown, color: "hsl(var(--muted-foreground))" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  return (
    <div className="ios-card">
      <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
        {t("insights.genderBreakdown")}
      </p>
      <div className="flex items-center gap-4">
        <div className="h-28 w-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" strokeWidth={0}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1.5 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(330, 80%, 60%)" }} />
            <span>{Math.round((female / total) * 100)}% {t("gender.female")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(210, 80%, 60%)" }} />
            <span>{Math.round((male / total) * 100)}% {t("gender.male")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
            <span>{Math.round((unknown / total) * 100)}% {t("gender.unknown")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
