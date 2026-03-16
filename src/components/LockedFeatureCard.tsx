import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LockedFeatureCardProps {
  icon?: string;
  title: string;
  subtitle?: string;
  onTap: () => void;
  className?: string;
}

export function LockedFeatureCard({ icon, title, subtitle, onTap, className = "" }: LockedFeatureCardProps) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onTap}
      className={`w-full rounded-[20px] p-5 flex flex-col items-center justify-center gap-2 text-center transition-all active:scale-[0.97] ${className}`}
      style={{
        background: "hsl(var(--card))",
        opacity: 0.6,
        border: "1px dashed hsl(var(--foreground) / 0.15)",
        minHeight: 120,
      }}
    >
      <Lock className="h-6 w-6 text-muted-foreground" />
      <p className="font-bold text-foreground" style={{ fontSize: "1rem" }}>
        {title}
      </p>
      <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
        {subtitle || t("locked_feature.available_with_pro", "Verfügbar mit Pro")}
      </p>
    </button>
  );
}
