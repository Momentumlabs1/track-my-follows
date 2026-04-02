import { useTranslation } from "react-i18next";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface ScanStatusProps {
  lastScannedAt: string | null;
  hasSpy?: boolean;
}

export function ScanStatus({ lastScannedAt, hasSpy }: ScanStatusProps) {
  const { t } = useTranslation();
  const { plan } = useSubscription();
  const timeAgo = (dateStr: string | null): string => {
    if (!dateStr) return t("dashboard.never_scanned");
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("dashboard.just_now");
    if (mins < 60) return t("dashboard.minutes_ago", { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("dashboard.hours_ago", { count: hours });
    return t("dashboard.days_ago", { count: Math.floor(hours / 24) });
  };

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span>{timeAgo(lastScannedAt)}</span>
      <span className="opacity-40">·</span>
      {plan === "pro" && hasSpy ? (
        <span className="text-brand-green font-medium">✓ {t("scan_status.auto_hourly")}</span>
      ) : (
        <span>{t("scan_status.once_daily")}</span>
      )}
    </div>
  );
}
