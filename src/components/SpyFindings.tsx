import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Repeat, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FollowEvent } from "@/hooks/useTrackedProfiles";

interface SpyFindingsProps {
  followEvents: FollowEvent[];
  followerEvents: Array<{ event_type: string; is_initial?: boolean | null; detected_at: string; username: string }>;
  profileFollowings: Array<{
    following_username: string;
    gender_tag?: string | null;
  }>;
  followerCount: number;
  followingCount: number;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

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

    // ── 2. Ghost-Follows (30d) — follow + unfollow same username within 48h ──
    const recentFollowsAll = followEvents.filter(
      (e) =>
        (e.event_type === "follow" || e.event_type === "new_following") &&
        !(e as any).is_initial &&
        (e as any).direction === "following" &&
        now - new Date(e.detected_at).getTime() < THIRTY_DAYS
    );
    const recentUnfollowsAll = followEvents.filter(
      (e) =>
        (e.event_type === "unfollow" || e.event_type === "unfollowed") &&
        !(e as any).is_initial &&
        (e as any).direction === "following" &&
        now - new Date(e.detected_at).getTime() < THIRTY_DAYS
    );

    let ghostCount = 0;
    for (const follow of recentFollowsAll) {
      const matchingUnfollow = recentUnfollowsAll.find(
        (u) =>
          u.target_username === follow.target_username &&
          Math.abs(new Date(u.detected_at).getTime() - new Date(follow.detected_at).getTime()) < 48 * 60 * 60 * 1000
      );
      if (matchingUnfollow) ghostCount++;
    }
    const hasGhostData = recentFollowsAll.length >= 2;

    // ── 3. Private Accounts (7d new follows) ──
    const recentFollows7d = followEvents.filter(
      (e) =>
        (e.event_type === "follow" || e.event_type === "new_following") &&
        !(e as any).is_initial &&
        (e as any).direction === "following" &&
        now - new Date(e.detected_at).getTime() < SEVEN_DAYS
    );
    const privateCount = recentFollows7d.filter((e) => (e as any).target_is_private === true).length;
    const privatePct: number | null = recentFollows7d.length > 0
      ? Math.round((privateCount / recentFollows7d.length) * 100)
      : null;

    // ── 4. Followback-Rate (7d) ──
    const followedUsernames = new Set(recentFollows7d.map((e) => e.target_username));
    const followbackCount = followerEvents.filter(
      (e) => e.event_type === "gained" && followedUsernames.has(e.username)
    ).length;
    const followbackRate: number | null = recentFollows7d.length > 0
      ? Math.round((followbackCount / recentFollows7d.length) * 100)
      : null;

    return {
      femalePercent,
      femaleLevel,
      ghostCount,
      hasGhostData,
      privatePct,
      hasPrivateData: recentFollows7d.length > 0,
      followbackRate,
      hasFollowbackData: recentFollows7d.length > 0,
    };
  }, [followEvents, followerEvents, profileFollowings, followerCount, followingCount]);

  const levelColor = (level: "safe" | "warning" | "danger") => {
    if (level === "danger") return "#FF3B30";
    if (level === "warning") return "#FF9500";
    return "#34C759";
  };

  return (
    <div className="mb-2">
      <p className="section-header mb-3 flex items-center gap-1.5">
        🔍 {t("spy_findings.title", "Spy-Analyse")}
      </p>

      {/* Card 1: Frauen-Anteil — wide card with donut */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-[20px] p-5 mb-3"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.3)" }}
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

      {/* Cards 2+3: Ghost-Follows + Private Accounts side by side */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="rounded-[20px] p-4"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.3)" }}
        >
          <span style={{ fontSize: "1.5rem" }}>👻</span>
          <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "hsl(var(--foreground))", lineHeight: 1, marginTop: 8 }}>
            {data.hasGhostData ? data.ghostCount : "–"}
          </p>
          <p className="text-muted-foreground" style={{ fontSize: "0.6875rem", marginTop: 4 }}>
            Ghost-Follows
          </p>
          <p className="text-muted-foreground" style={{ fontSize: "0.5625rem", opacity: 0.6, marginTop: 2 }}>
            {data.hasGhostData
              ? t("spy_findings.ghost_desc", "Gefolgt & schnell entfolgt")
              : t("spy_findings.not_enough_data", "Noch nicht genug Daten")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="rounded-[20px] p-4"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.3)" }}
        >
          <span style={{ fontSize: "1.5rem" }}>🔒</span>
          <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "hsl(var(--foreground))", lineHeight: 1, marginTop: 8 }}>
            {data.privatePct !== null ? `${data.privatePct}%` : "–"}
          </p>
          <p className="text-muted-foreground" style={{ fontSize: "0.6875rem", marginTop: 4 }}>
            {t("spy_findings.private_accounts", "Private Accounts")}
          </p>
          <p className="text-muted-foreground" style={{ fontSize: "0.5625rem", opacity: 0.6, marginTop: 2 }}>
            {data.hasPrivateData
              ? t("spy_findings.private_desc", "Bei neuen Follows")
              : t("spy_findings.not_enough_data", "Noch nicht genug Daten")}
          </p>
        </motion.div>
      </div>

      {/* Card 4: Followback-Rate — wide banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="rounded-[20px] px-5 py-4"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.3)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
              🔁 {t("spy_findings.followback_rate", "Followback-Rate")}
            </p>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(var(--foreground))" }}>
              {data.followbackRate !== null ? `${data.followbackRate}%` : "–"}
            </p>
          </div>
        </div>
        {data.followbackRate !== null && (
          <>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--border) / 0.3)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: data.followbackRate < 20 ? "#FF3B30" : data.followbackRate < 50 ? "#FF9500" : "#34C759" }}
                initial={{ width: 0 }}
                animate={{ width: `${data.followbackRate}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
            <p className="text-muted-foreground mt-2" style={{ fontSize: "0.5625rem", opacity: 0.6 }}>
              {data.followbackRate < 20
                ? t("spy_findings.followback_low", "Wenige folgen zurück – einseitiges Interesse")
                : data.followbackRate < 50
                  ? t("spy_findings.followback_mid", "Manche folgen zurück")
                  : t("spy_findings.followback_high", "Viele folgen zurück – gegenseitiges Interesse")}
            </p>
          </>
        )}
        {data.followbackRate === null && (
          <p className="text-muted-foreground" style={{ fontSize: "0.5625rem", opacity: 0.6 }}>
            {t("spy_findings.not_enough_data", "Noch nicht genug Daten")}
          </p>
        )}
      </motion.div>
    </div>
  );
}
