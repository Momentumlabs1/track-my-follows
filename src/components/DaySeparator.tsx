import { memo } from "react";
import { useTranslation } from "react-i18next";

interface DaySeparatorProps {
  date: string;
}

export const DaySeparator = memo(function DaySeparator({ date }: DaySeparatorProps) {
  const { t } = useTranslation();

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return t("feed.today");
    if (diff === 1) return t("feed.yesterday");
    if (diff < 7) {
      return d.toLocaleDateString(undefined, { weekday: "long" });
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="py-2">
      <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
        {formatDay(date)}
      </span>
    </div>
  );
});
