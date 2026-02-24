import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { FollowEvent } from "@/hooks/useTrackedProfiles";

interface ActivityHeatmapProps {
  events: FollowEvent[];
}

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const DAYS_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

export function ActivityHeatmap({ events }: ActivityHeatmapProps) {
  const { t, i18n } = useTranslation();
  const dayLabels = i18n.language === "de" ? DAYS_DE : DAYS;

  const { heatmapData, maxCount, peakText } = useMemo(() => {
    const grid: Record<string, number> = {};
    const followEvents = events.filter((e) => e.event_type === "follow");

    followEvents.forEach((e) => {
      const date = new Date(e.detected_at);
      // Convert Sunday=0 to Monday-first: Mo=0, Tu=1 ... Su=6
      const jsDay = date.getDay();
      const day = jsDay === 0 ? 6 : jsDay - 1;
      const hourBlock = Math.floor(date.getHours() / 3);
      const key = `${day}-${hourBlock}`;
      grid[key] = (grid[key] || 0) + 1;
    });

    const max = Math.max(...Object.values(grid), 1);

    // Find peak
    let peakKey = "";
    let peakVal = 0;
    for (const [k, v] of Object.entries(grid)) {
      if (v > peakVal) {
        peakVal = v;
        peakKey = k;
      }
    }

    let peak = "";
    if (peakKey) {
      const [d, h] = peakKey.split("-").map(Number);
      peak = `${dayLabels[d]} ${String(h * 3).padStart(2, "0")}:00`;
    }

    return { heatmapData: grid, maxCount: max, peakText: peak };
  }, [events, dayLabels]);

  const getIntensity = (count: number) => {
    if (count === 0) return "bg-muted";
    const ratio = count / maxCount;
    if (ratio < 0.25) return "bg-primary/20";
    if (ratio < 0.5) return "bg-primary/40";
    if (ratio < 0.75) return "bg-primary/60";
    return "bg-primary";
  };

  return (
    <div className="native-card p-4">
      <p className="section-header mb-3">{t("insights.activity_heatmap")}</p>

      <div className="grid gap-1" style={{ gridTemplateColumns: `32px repeat(7, 1fr)` }}>
        {/* Header row */}
        <div />
        {dayLabels.map((d) => (
          <div key={d} className="text-[9px] text-muted-foreground text-center font-medium">{d}</div>
        ))}

        {/* Data rows */}
        {HOURS.map((hour) => (
          <>
            <div key={`h-${hour}`} className="text-[9px] text-muted-foreground text-end pe-1 flex items-center justify-end">
              {String(hour).padStart(2, "0")}
            </div>
            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
              const count = heatmapData[`${day}-${Math.floor(hour / 3)}`] || 0;
              return (
                <div
                  key={`${day}-${hour}`}
                  className={`aspect-square rounded-sm ${getIntensity(count)} transition-colors`}
                  title={`${count} events`}
                />
              );
            })}
          </>
        ))}
      </div>

      {peakText && (
        <div className="flex items-center gap-2 mt-3">
          <span className="text-lg">🔥</span>
          <span className="text-[12px] text-foreground font-medium">
            {t("insights.mostActive")}: {peakText}
          </span>
        </div>
      )}
    </div>
  );
}
