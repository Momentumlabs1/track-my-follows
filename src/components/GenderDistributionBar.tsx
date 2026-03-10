import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface GenderDistributionBarProps {
  femaleCount: number;
  maleCount: number;
  unknownCount: number;
}

export function GenderDistributionBar({ femaleCount, maleCount, unknownCount }: GenderDistributionBarProps) {
  const { t } = useTranslation();
  const total = femaleCount + maleCount;
  if (total === 0) return null;

  const femalePct = Math.round((femaleCount / total) * 100);
  const malePct = 100 - femalePct;

  return (
    <div
      className="p-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        border: "0.5px solid rgba(255,255,255,0.06)",
        borderRadius: "16px",
      }}
    >
      <p className="font-semibold text-foreground mb-0.5" style={{ fontSize: "0.875rem" }}>
        {t("insights_new.gender_title", "Geschlechterverteilung")}
      </p>
      <p className="text-muted-foreground mb-4" style={{ fontSize: "0.75rem" }}>
        {t("insights_new.gender_subtitle", "Basierend auf allen Followings · Schätzung")}
      </p>

      {/* Numbers + bar */}
      <div className="flex items-center gap-3 mb-2">
        <span className="font-bold tabular-nums flex-shrink-0" style={{ fontSize: "1rem", color: "#FF2D55" }}>
          ♀ {femaleCount}
        </span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden flex" style={{ background: "hsl(var(--muted))" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "#FF2D55" }}
            initial={{ width: 0 }}
            animate={{ width: `${femalePct}%` }}
            transition={{ duration: 0.8 }}
          />
          <motion.div
            className="h-full rounded-full"
            style={{ background: "#007AFF" }}
            initial={{ width: 0 }}
            animate={{ width: `${malePct}%` }}
            transition={{ duration: 0.8, delay: 0.1 }}
          />
        </div>
        <span className="font-bold tabular-nums flex-shrink-0" style={{ fontSize: "1rem", color: "#007AFF" }}>
          ♂ {maleCount}
        </span>
      </div>

      {unknownCount > 0 && (
        <p className="text-muted-foreground" style={{ fontSize: "0.6875rem" }}>
          {t("insights_new.not_identified", "{{count}} Profile konnten nicht identifiziert werden", { count: unknownCount })}
        </p>
      )}
    </div>
  );
}
