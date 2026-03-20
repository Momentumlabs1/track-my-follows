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

  const ghostActive = data.hasGhostData && data.ghostCount > 0;
  const privateActive = data.privatePct !== null && data.privatePct > 0;

  return (
    <div className="mb-2">
      <p className="section-header mb-3 flex items-center gap-1.5">
        <SpyIcon size={16} />
        {t("spy_findings.title", "Spy-Analyse")}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Ghost Follow & Unfollow */}
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.16, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl relative overflow-hidden"
          style={{
            background: ghostActive
              ? "linear-gradient(145deg, hsl(4 90% 58% / 0.18), hsl(var(--card)) 60%)"
              : "hsl(var(--card))",
            boxShadow: ghostActive
              ? "0 0 24px hsl(4 90% 58% / 0.08), inset 0 1px 0 hsl(0 0% 100% / 0.04)"
              : "inset 0 1px 0 hsl(0 0% 100% / 0.04), 0 2px 8px hsl(0 0% 0% / 0.2)",
            border: "1px solid hsl(var(--border) / 0.12)",
          }}
        >
          <div className="p-4 pb-3">
            <div
              className="w-10 h-10 rounded-[14px] flex items-center justify-center mb-4"
              style={{
                background: ghostActive
                  ? "hsl(4 90% 58% / 0.15)"
                  : "hsl(var(--muted) / 0.5)",
                boxShadow: ghostActive
                  ? "0 0 12px hsl(4 90% 58% / 0.1)"
                  : "none",
              }}
            >
              <Ghost
                className="h-[20px] w-[20px]"
                style={{ color: ghostActive ? "hsl(4 90% 58%)" : "hsl(var(--muted-foreground))" }}
              />
            </div>
            <p
              className="text-foreground font-black tabular-nums"
              style={{ fontSize: "2rem", lineHeight: 1, letterSpacing: "-0.02em" }}
            >
              {data.hasGhostData ? String(data.ghostCount) : "—"}
            </p>
            <p className="text-muted-foreground font-semibold mt-2.5" style={{ fontSize: "0.6875rem", letterSpacing: "0.01em" }}>
              {t("spy_findings.follow_unfollow", "Follow & Unfollow")}
            </p>
          </div>

          {/* Bottom strip */}
          <div
            className="px-4 py-2.5"
            style={{ borderTop: "1px solid hsl(var(--border) / 0.08)" }}
          >
            {ghostActive && (
              <div className="h-[3px] rounded-full overflow-hidden mb-2" style={{ background: "hsl(var(--border) / 0.12)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "hsl(4 90% 58%)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(data.ghostCount * 20, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            )}
            <p className="text-muted-foreground" style={{ fontSize: "0.5625rem", opacity: 0.45 }}>
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
          initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.24, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl relative overflow-hidden"
          style={{
            background: privateActive
              ? `linear-gradient(145deg, ${getBarColor(data.privatePct).replace(")", " / 0.18)")}, hsl(var(--card)) 60%)`
              : "hsl(var(--card))",
            boxShadow: privateActive
              ? `0 0 24px ${getBarColor(data.privatePct).replace(")", " / 0.08)")}, inset 0 1px 0 hsl(0 0% 100% / 0.04)`
              : "inset 0 1px 0 hsl(0 0% 100% / 0.04), 0 2px 8px hsl(0 0% 0% / 0.2)",
            border: "1px solid hsl(var(--border) / 0.12)",
          }}
        >
          <div className="p-4 pb-3">
            <div
              className="w-10 h-10 rounded-[14px] flex items-center justify-center mb-4"
              style={{
                background: privateActive
                  ? `${getBarColor(data.privatePct).replace(")", " / 0.15)")}`
                  : "hsl(var(--muted) / 0.5)",
                boxShadow: privateActive
                  ? `0 0 12px ${getBarColor(data.privatePct).replace(")", " / 0.1)")}`
                  : "none",
              }}
            >
              <ShieldCheck
                className="h-[20px] w-[20px]"
                style={{ color: privateActive ? getBarColor(data.privatePct) : "hsl(var(--muted-foreground))" }}
              />
            </div>
            <p
              className="text-foreground font-black tabular-nums"
              style={{ fontSize: "2rem", lineHeight: 1, letterSpacing: "-0.02em" }}
            >
              {data.privatePct !== null ? `${data.privatePct}%` : "—"}
            </p>
            <p className="text-muted-foreground font-semibold mt-2.5" style={{ fontSize: "0.6875rem", letterSpacing: "0.01em" }}>
              {t("spy_findings.private_accounts", "Private Accounts")}
            </p>
          </div>

          {/* Bottom strip */}
          <div
            className="px-4 py-2.5"
            style={{ borderTop: "1px solid hsl(var(--border) / 0.08)" }}
          >
            {privateActive && (
              <div className="h-[3px] rounded-full overflow-hidden mb-2" style={{ background: "hsl(var(--border) / 0.12)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: getBarColor(data.privatePct) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(data.privatePct!, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            )}
            <p className="text-muted-foreground" style={{ fontSize: "0.5625rem", opacity: 0.45 }}>
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