import { useMemo } from "react";
import { motion } from "framer-motion";
import { Ghost, ShieldCheck } from "lucide-react";
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
    const { followEvents } = props;
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

    return { ghostCount, hasGhostData, privatePct, hasPrivateData, privateIsInitial, isEarlyStage };
  }, [props.followEvents, props.followerEvents, props.profileFollowings, props.followerCount, props.followingCount]);
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

      <div className="grid grid-cols-2 gap-3">
        {/* Ghost Follow & Unfollow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.15)" }}
        >
          {data.hasGhostData && data.ghostCount > 0 && (
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, hsl(4 90% 58% / 0.12), hsl(4 90% 58% / 0.04))",
              }}
            />
          )}
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "hsl(var(--muted) / 0.6)" }}>
              <Ghost className="h-[18px] w-[18px] text-muted-foreground" />
            </div>
            <p className="text-foreground font-black tabular-nums tracking-tight" style={{ fontSize: "1.75rem", lineHeight: 1 }}>
              {data.hasGhostData ? String(data.ghostCount) : "—"}
            </p>
            <p className="text-muted-foreground font-semibold mt-2" style={{ fontSize: "0.6875rem" }}>
              {t("spy_findings.follow_unfollow", "Follow & Unfollow")}
            </p>
            {data.hasGhostData && data.ghostCount > 0 && (
              <div className="h-1 rounded-full overflow-hidden mt-2.5" style={{ background: "hsl(var(--border) / 0.2)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "hsl(4 90% 58%)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(data.ghostCount * 20, 100)}%` }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                />
              </div>
            )}
            <p className="text-muted-foreground mt-2" style={{ fontSize: "0.5625rem", opacity: 0.5 }}>
              {data.hasGhostData
                ? t("spy_findings.ghost_desc", "Gefolgt & schnell entfolgt")
                : data.isEarlyStage
                  ? t("spy_findings.after_next_scan")
                  : t("spy_findings.not_enough_data")}
            </p>
          </div>
        </motion.div>

        {/* Private Accounts */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.15)" }}
        >
          {data.privatePct !== null && data.privatePct > 30 && (
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${getBarColor(data.privatePct).replace(")", " / 0.12)")}, ${getBarColor(data.privatePct).replace(")", " / 0.04)")})`,
              }}
            />
          )}
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "hsl(var(--muted) / 0.6)" }}>
              <ShieldCheck className="h-[18px] w-[18px] text-muted-foreground" />
            </div>
            <p className="text-foreground font-black tabular-nums tracking-tight" style={{ fontSize: "1.75rem", lineHeight: 1 }}>
              {data.privatePct !== null ? `${data.privatePct}%` : "—"}
            </p>
            <p className="text-muted-foreground font-semibold mt-2" style={{ fontSize: "0.6875rem" }}>
              {t("spy_findings.private_accounts", "Private Accounts")}
            </p>
            {data.privatePct != null && data.privatePct > 0 && (
              <div className="h-1 rounded-full overflow-hidden mt-2.5" style={{ background: "hsl(var(--border) / 0.2)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: getBarColor(data.privatePct) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(data.privatePct, 100)}%` }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                />
              </div>
            )}
            <p className="text-muted-foreground mt-2" style={{ fontSize: "0.5625rem", opacity: 0.5 }}>
              {data.hasPrivateData
                ? data.privateIsInitial
                  ? t("spy_findings.based_on_initial", "Basierend auf erstem Scan")
                  : t("spy_findings.private_desc", "Bei neuen Follows")
                : t("spy_findings.not_enough_data")}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}