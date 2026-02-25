import { useTranslation } from "react-i18next";
import { SpyIcon } from "@/components/SpyIcon";

interface SpyRequiredOverlayProps {
  onAssignSpy: () => void;
}

export function SpyRequiredOverlay({ onAssignSpy }: SpyRequiredOverlayProps) {
  const { t } = useTranslation();

  return (
    <div className="native-card p-6 text-center">
      <div className="block mb-3"><SpyIcon size={48} /></div>
      <p className="text-[14px] font-bold text-foreground mb-1">{t("spy.spy_required")}</p>
      <p className="text-[12px] text-muted-foreground mb-4">{t("spy.spy_required_description")}</p>
      <button
        onClick={onAssignSpy}
        className="pill-btn-primary px-5 py-2.5 text-[13px]"
      >
        <SpyIcon size={16} className="inline" /> {t("spy.assign_spy_here")}
      </button>
    </div>
  );
}
