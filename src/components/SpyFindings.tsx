import { useMemo } from "react";
import { motion } from "framer-motion";
import { Heart, TrendingUp, Repeat, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FollowEvent } from "@/hooks/useTrackedProfiles";

interface SpyFindingsProps {
  followEvents: FollowEvent[];
  followerEvents: Array<{ event_type: string; is_initial?: boolean | null; detected_at: string }>;
  profileFollowings: Array<{
    following_username: string;
    gender_tag?: string | null;
  }>;
  followerCount: number;
  followingCount: number;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function SpyFindings({
  followEvents,
  followerEvents,
  profileFollowings,
  followerCount,
  followingCount,
}: SpyFindingsProps) {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const now = Date.now();

    // ── 1. Frauen-Anteil — aus ALLEN profileFollowings ──
    let totalFemale = 0;
    let totalMale = 0;
    for (const f of profileFollowings) {
      if (f.gender_tag === "female") totalFemale++;
      else if (f.gender_tag === "male") totalMale++;
    }
    const totalClassified = totalFemale + totalMale;
    const femalePercent: number | null = totalClassified >= 3
      ? Math.round((totalFemale / totalClassified) * 100)
      : null;

    let femaleLevel: "safe" | "warning" | "danger" = "safe";
    if (femalePercent !== null) {
      if (femalePercent > 70) femaleLevel = "danger";
      else if (femalePercent > 55) femaleLevel = "warning";
    }

    // ── 2. Follow-Tempo (7d real follows) ──
    const recentFollows = followEvents.filter(
      (e) =>
        (e.event_type === "follow" || e.event_type === "new_following") &&
        !(e as any).is_initial &&
        (e as any).direction === "following" &&
        now - new Date(e.detected_at).getTime() < SEVEN_DAYS
    );

    const recentUnfollows = followEvents.filter(
      (e) =>
        (e.event_type === "unfollow" || e.event_type === "unfollowed") &&
        !(e as any).is_initial &&
        (e as any).direction === "following" &&
        now - new Date(e.detected_at).getTime() < SEVEN_DAYS
    );

    const followCount = recentFollows.length;
    let tempoLabel: string;
    let tempoLevel: "safe" | "warning" | "danger";
    if (followCount === 0) { tempoLabel = t("spy_findings.quiet", "Ruhig"); tempoLevel = "safe"; }
    else if (followCount <= 3) { tempoLabel = t("spy_findings.normal", "Normal"); tempoLevel = "safe"; }
    else if (followCount <= 10) { tempoLabel = t("spy_findings.active", "Aktiv"); tempoLevel = "warning"; }
    else { tempoLabel = t("spy_findings.very_active", "Sehr aktiv"); tempoLevel = "danger"; }

    // ── 3. Treue-Index ──
    const totalChurnEvents = recentFollows.length + recentUnfollows.length;
    let loyaltyLabel: string;
    let loyaltyLevel: "safe" | "warning" | "danger";
    if (totalChurnEvents < 4) {
      loyaltyLabel = "–";
      loyaltyLevel = "safe";
    } else {
      const churnRate = recentFollows.length > 0 ? recentUnfollows.length / recentFollows.length : 0;
      if (churnRate <= 0.1) { loyaltyLabel = t("spy_findings.stable", "Stabil"); loyaltyLevel = "safe"; }
      else if (churnRate <= 0.3) { loyaltyLabel = t("spy_findings.lightly_changing", "Leicht wechselnd"); loyaltyLevel = "warning"; }
      else { loyaltyLabel = t("spy_findings.changing", "Wechselhaft"); loyaltyLevel = "danger"; }
    }

    // ── 4. Netzwerk-Stil ──
    let networkLabel: string;
    let networkLevel: "safe" | "warning" | "danger";
    if (followerCount <= 0) {
      networkLabel = "–";
      networkLevel = "safe";
    } else {
      const ratio = followingCount / followerCount;
      if (ratio < 1) { networkLabel = t("spy_findings.selective", "Selektiv"); networkLevel = "safe"; }
      else if (ratio <= 1.5) { networkLabel = t("spy_findings.balanced", "Ausgeglichen"); networkLevel = "safe"; }
      else if (ratio <= 3) { networkLabel = t("spy_findings.exploratory", "Entdeckend"); networkLevel = "warning"; }
      else { networkLabel = t("spy_findings.very_active_network", "Sehr aktiv"); networkLevel = "danger"; }
    }

    return {
      femalePercent, femaleLevel,
      tempoLabel, tempoLevel,
      loyaltyLabel, loyaltyLevel,
      networkLabel, networkLevel,
    };
  }, [followEvents, followerEvents, profileFollowings, followerCount, followingCount, t]);

  const levelColor = (level: "safe" | "warning" | "danger") => {
    if (level === "danger") return "#FF3B30";
    if (level === "warning") return "#FF9500";
    return "#34C759";
  };

  const levelBg = (level: "safe" | "warning" | "danger") => {
    if (level === "danger") return "rgba(255,59,48,0.08)";
    if (level === "warning") return "rgba(255,149,0,0.08)";
    return "rgba(52,199,89,0.08)";
  };

  const levelBorder = (level: "safe" | "warning" | "danger") => {
    if (level === "danger") return "rgba(255,59,48,0.2)";
    if (level === "warning") return "rgba(255,149,0,0.2)";
    return "rgba(52,199,89,0.2)";
  };

  return (
    <div className="mb-2 px-1">
      <p className="section-header mb-3">
        {t("spy_findings.title", "Das hat der Spy gefunden")}
      </p>

      {/* Card 1: Frauen-Anteil — wide card with donut */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl p-5 mb-3"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.5)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
              {t("spy_findings.female_ratio", "Frauen-Anteil")}
            </p>
            <p style={{
              fontSize: "3rem",
              fontWeight: 900,
              color: levelColor(data.femaleLevel),
              lineHeight: 1,
            }}>
              {data.femalePercent !== null ? `${data.femalePercent}%` : "–"}
            </p>
          </div>
          {data.femalePercent !== null && (
            <div
              style={{
                width: 64, height: 64, borderRadius: "50%",
                background: `conic-gradient(#FF2D55 0% ${data.femalePercent}%, #007AFF ${data.femalePercent}% 100%)`,
                boxShadow: "0 4px 16px rgba(255,45,85,0.3)",
              }}
            />
          )}
        </div>
      </motion.div>

      {/* Cards 2+3: Follow-Tempo + Treue-Index side by side */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="rounded-2xl p-4"
          style={{ background: levelBg(data.tempoLevel), border: `1px solid ${levelBorder(data.tempoLevel)}` }}
        >
          <TrendingUp size={20} style={{ color: levelColor(data.tempoLevel), marginBottom: 8 }} />
          <p style={{ fontSize: "1.375rem", fontWeight: 800, color: "hsl(var(--foreground))" }}>
            {data.tempoLabel}
          </p>
          <p className="text-muted-foreground" style={{ fontSize: "0.6875rem" }}>
            {t("spy_findings.follow_tempo", "Follow-Tempo")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="rounded-2xl p-4"
          style={{ background: levelBg(data.loyaltyLevel), border: `1px solid ${levelBorder(data.loyaltyLevel)}` }}
        >
          <Repeat size={20} style={{ color: levelColor(data.loyaltyLevel), marginBottom: 8 }} />
          <p style={{ fontSize: "1.375rem", fontWeight: 800, color: "hsl(var(--foreground))" }}>
            {data.loyaltyLabel}
          </p>
          <p className="text-muted-foreground" style={{ fontSize: "0.6875rem" }}>
            {t("spy_findings.loyalty", "Treue-Index")}
          </p>
        </motion.div>
      </div>

      {/* Card 4: Netzwerk-Stil — wide banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="rounded-2xl px-5 py-4 flex items-center justify-between"
        style={{ background: "hsl(var(--secondary))", border: "none" }}
      >
        <div>
          <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
            {t("spy_findings.network_style", "Netzwerk-Stil")}
          </p>
          <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(var(--foreground))" }}>
            {data.networkLabel}
          </p>
        </div>
        <Users size={32} className="text-muted-foreground" style={{ opacity: 0.3 }} />
      </motion.div>
    </div>
  );
}
