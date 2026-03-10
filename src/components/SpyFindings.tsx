import { useMemo } from "react";
import { motion } from "framer-motion";
import { Heart, TrendingUp, Repeat, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { detectGender } from "@/lib/genderDetection";
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

  const tiles = useMemo(() => {
    const now = Date.now();

    // Build gender lookup
    const genderMap = new Map<string, string>();
    for (const f of profileFollowings) {
      if (f.gender_tag === "female" || f.gender_tag === "male") {
        genderMap.set(f.following_username, f.gender_tag);
      }
    }

    // Recent follows (7d, non-initial, following direction)
    const recentFollows = followEvents.filter(
      (e) =>
        (e.event_type === "follow" || e.event_type === "new_following") &&
        !(e as any).is_initial &&
        (e as any).direction === "following" &&
        now - new Date(e.detected_at).getTime() < SEVEN_DAYS
    );

    // Recent unfollows (7d)
    const recentUnfollows = followEvents.filter(
      (e) =>
        (e.event_type === "unfollow" || e.event_type === "unfollowed") &&
        !(e as any).is_initial &&
        (e as any).direction === "following" &&
        now - new Date(e.detected_at).getTime() < SEVEN_DAYS
    );

    // 1. Frauen-Anteil
    let femaleNew = 0;
    let maleNew = 0;
    for (const ev of recentFollows) {
      const fromMap = genderMap.get(ev.target_username);
      let gender: string;
      if (fromMap) gender = fromMap;
      else if ((ev as any).gender_tag === "female" || (ev as any).gender_tag === "male") gender = (ev as any).gender_tag;
      else gender = detectGender(ev.target_display_name);
      if (gender === "female") femaleNew++;
      else if (gender === "male") maleNew++;
    }
    const classifiedCount = femaleNew + maleNew;
    const femalePercent = classifiedCount >= 3 ? Math.round((femaleNew / classifiedCount) * 100) : null;

    // 2. Follow-Tempo
    const followCount = recentFollows.length;
    let tempoLabel: string;
    let tempoLevel: "safe" | "warning" | "danger";
    if (followCount === 0) { tempoLabel = t("spy_findings.quiet", "Ruhig"); tempoLevel = "safe"; }
    else if (followCount <= 3) { tempoLabel = t("spy_findings.normal", "Normal"); tempoLevel = "safe"; }
    else if (followCount <= 10) { tempoLabel = t("spy_findings.active", "Aktiv"); tempoLevel = "warning"; }
    else { tempoLabel = t("spy_findings.very_active", "Sehr aktiv"); tempoLevel = "danger"; }

    // 3. Treue-Index
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

    // 4. Netzwerk-Stil
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

    // Frauen-Anteil level
    let femaleLevel: "safe" | "warning" | "danger" = "safe";
    if (femalePercent !== null) {
      if (femalePercent > 70) femaleLevel = "danger";
      else if (femalePercent > 55) femaleLevel = "warning";
    }

    return [
      { icon: Heart, label: t("spy_findings.female_ratio", "Frauen-Anteil"), value: femalePercent !== null ? `${femalePercent}%` : "–", level: femaleLevel },
      { icon: TrendingUp, label: t("spy_findings.follow_tempo", "Follow-Tempo"), value: tempoLabel, level: tempoLevel },
      { icon: Repeat, label: t("spy_findings.loyalty", "Treue-Index"), value: loyaltyLabel, level: loyaltyLevel },
      { icon: Users, label: t("spy_findings.network_style", "Netzwerk-Stil"), value: networkLabel, level: networkLevel },
    ];
  }, [followEvents, followerEvents, profileFollowings, followerCount, followingCount, t]);

  const levelColor = {
    safe: "hsl(var(--brand-green))",
    warning: "hsl(var(--brand-yellow))",
    danger: "hsl(var(--destructive))",
  };

  return (
    <div className="mb-5">
      <p className="section-header px-1 mb-3">
        {t("spy_findings.title", "Das hat der Spy gefunden")}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="native-card p-4 flex flex-col gap-2"
          >
            <tile.icon
              className="flex-shrink-0"
              size={18}
              style={{ color: levelColor[tile.level] }}
            />
            <span
              className="font-bold text-foreground"
              style={{ fontSize: "1.125rem", lineHeight: 1.2 }}
            >
              {tile.value}
            </span>
            <span
              className="text-muted-foreground"
              style={{ fontSize: "0.6875rem" }}
            >
              {tile.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
