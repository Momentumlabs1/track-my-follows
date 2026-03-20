import { useMemo } from "react";
import { motion } from "framer-motion";
import { Ghost, ShieldCheck, ArrowLeftRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SpyIcon } from "@/components/SpyIcon";
import type { FollowEvent } from "@/hooks/useTrackedProfiles";

interface SpyFindingsProps {
  followEvents: FollowEvent[];
  followerEvents: Array<{ event_type: string; is_initial?: boolean | null; detected_at: string; username: string }>;
  profileFollowings: Array<{ following_username: string; gender_tag?: string | null }>;
  followerCount: number;
  followingCount: number;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

function useSpyData(props: SpyFindingsProps) {
  return useMemo(() => {
    const { followEvents, followerEvents } = props;
    const now = Date.now();

    const realFollows7d = followEvents.filter(
      (e) => (e.event_type === "follow" || e.event_type === "new_following") && !(e as any).is_initial && (e as any).direction === "following" && now - new Date(e.detected_at).getTime() < SEVEN_DAYS
    );
    const realFollows30d = followEvents.filter(
      (e) => (e.event_type === "follow" || e.event_type === "new_following") && !(e as any).is_initial && (e as any).direction === "following" && now - new Date(e.detected_at).getTime() < THIRTY_DAYS
    );
    const realUnfollows30d = followEvents.filter(
      (e) => (e.event_type === "unfollow" || e.event_type === "unfollowed") && !(e as any).is_initial && (e as any).direction === "following" && now - new Date(e.detected_at).getTime() < THIRTY_DAYS
    );
    const initialFollows = followEvents.filter(
      (e) => (e.event_type === "follow" || e.event_type === "new_following") && (e as any).is_initial === true && (e as any).direction === "following"
    );

    const hasRealData = realFollows7d.length >= 2;
    const isEarlyStage = !hasRealData;

    let ghostCount = 0;
    if (!isEarlyStage) {
      for (const follow of realFollows30d) {
        const match = realUnfollows30d.find(
          (u) => u.target_username === follow.target_username && Math.abs(new Date(u.detected_at).getTime() - new Date(follow.detected_at).getTime()) < 48 * 60 * 60 * 1000
        );
        if (match) ghostCount++;
      }
    }
    const hasGhostData = !isEarlyStage && realFollows30d.length >= 2;

    const privateSource = hasRealData ? realFollows7d : initialFollows;
    const privateCount = privateSource.filter((e) => (e as any).target_is_private === true).length;
    const privatePct: number | null = privateSource.length > 0 ? Math.round((privateCount / privateSource.length) * 100) : null;
    const hasPrivateData = privateSource.length > 0;
    const privateIsInitial = !hasRealData && initialFollows.length > 0;

    const followedUsernames = new Set(realFollows7d.map((e) => e.target_username));
    const followbackCount = followerEvents.filter((e) => e.event_type === "gained" && followedUsernames.has(e.username)).length;
    const followbackRate: number | null = !isEarlyStage && realFollows7d.length > 0 ? Math.round((followbackCount / realFollows7d.length) * 100) : null;

    return { ghostCount, hasGhostData, privatePct, hasPrivateData, privateIsInitial, followbackRate, hasFollowbackData: !isEarlyStage && realFollows7d.length > 0, isEarlyStage };
  }, [props.followEvents, props.followerEvents, props.profileFollowings, props.followerCount, props.followingCount]);
}

function StatCard({ icon, value, label, description, barPct, barColor, delay }: {
  icon: React.ReactNode; value: string; label: string; description: string;
  barPct?: number | null; barColor?: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-4"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.3)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
      </div>
      <p className="text-foreground font-black tabular-nums" style={{ fontSize: "1.5rem", lineHeight: 1 }}>
        {value}
      </p>
      <p className="text-muted-foreground font-semibold mt-1.5" style={{ fontSize: "0.6875rem" }}>
        {label}
      </p>
      {barPct != null && barPct > 0 && (
        <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: "hsl(var(--border) / 0.3)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: barColor || "hsl(var(--primary))" }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(barPct, 100)}%` }}
            transition={{ duration: 0.6, delay: delay + 0.15 }}
          />
        </div>
      )}
      <p className="text-muted-foreground mt-1.5" style={{ fontSize: "0.5625rem", opacity: 0.6 }}>
        {description}
      </p>
    </motion.div>
  );
}

export function SpyFindings(props: SpyFindingsProps) {
  const { t } = useTranslation();
  const data = useSpyData(props);

  const getBarColor = (value: number | null) => {
    if (value === null) return "hsl(var(--muted-foreground) / 0.3)";
    if (value < 20) return "hsl(142 71% 45%)";
    if (value < 50) return "hsl(25 95% 53%)";
    return "hsl(4 90% 58%)";
  };

  return (
    <div className="mb-2">
      <p className="section-header mb-3 flex items-center gap-1.5">
        <SpyIcon size={16} />
        {t("spy_findings.title", "Spy-Analyse")}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <StatCard
          icon={<Ghost className="h-5 w-5 text-muted-foreground" />}
          value={data.hasGhostData ? String(data.ghostCount) : "—"}
          label={t("spy_findings.follow_unfollow", "Follow & Unfollow")}
          description={
            data.hasGhostData
              ? t("spy_findings.ghost_desc", "Gefolgt & schnell entfolgt")
              : data.isEarlyStage
                ? t("spy_findings.after_next_scan")
                : t("spy_findings.not_enough_data")
          }
          barPct={data.hasGhostData && data.ghostCount > 0 ? Math.min(data.ghostCount * 20, 100) : null}
          barColor="hsl(4 90% 58%)"
          delay={0.16}
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5 text-muted-foreground" />}
          value={data.privatePct !== null ? `${data.privatePct}%` : "—"}
          label={t("spy_findings.private_accounts", "Private Accounts")}
          description={
            data.hasPrivateData
              ? data.privateIsInitial
                ? t("spy_findings.based_on_initial", "Basierend auf erstem Scan")
                : t("spy_findings.private_desc", "Bei neuen Follows")
              : t("spy_findings.not_enough_data")
          }
          barPct={data.privatePct}
          barColor={getBarColor(data.privatePct)}
          delay={0.22}
        />
      </div>

      {/* Followback-Rate */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="rounded-2xl px-5 py-4"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.3)" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <p className="text-muted-foreground font-semibold" style={{ fontSize: "0.75rem" }}>
              {t("spy_findings.followback_rate", "Followback-Rate")}
            </p>
          </div>
          <p className="text-foreground font-black tabular-nums" style={{ fontSize: "1.25rem" }}>
            {data.followbackRate !== null ? `${data.followbackRate}%` : "—"}
          </p>
        </div>
        {data.followbackRate !== null ? (
          <>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--border) / 0.3)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: data.followbackRate < 20 ? "hsl(4 90% 58%)" : data.followbackRate < 50 ? "hsl(25 95% 53%)" : "hsl(142 71% 45%)" }}
                initial={{ width: 0 }}
                animate={{ width: `${data.followbackRate}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
            <p className="text-muted-foreground mt-2" style={{ fontSize: "0.5625rem", opacity: 0.6 }}>
              {data.followbackRate < 20
                ? t("spy_findings.followback_low")
                : data.followbackRate < 50
                  ? t("spy_findings.followback_mid")
                  : t("spy_findings.followback_high")}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground" style={{ fontSize: "0.5625rem", opacity: 0.6 }}>
            {data.isEarlyStage ? t("spy_findings.after_next_scan") : t("spy_findings.not_enough_data")}
          </p>
        )}
      </motion.div>
    </div>
  );
}
