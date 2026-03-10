import { detectGender } from "@/lib/genderDetection";

export type GenderGuess = "female" | "male" | "unknown";

export { detectGender as guessGender };

export interface SuspicionBreakdown {
  overallScore: number;
  label: string;
  emoji: string;
  factors: SuspicionFactor[];
  genderStats: { female: number; male: number; unknown: number; total: number; femalePercent: number };
  spyLevel: "gelassen" | "aufmerksam" | "wachsam" | "alarmiert";
  spyLevelDescription: string;
}

export type FactorLevel = "safe" | "warning" | "danger";

export interface SuspicionFactor {
  name: string;
  description: string;
  score: number;
  maxScore: number;
  icon: string;
  simpleLabel: string;
  level: FactorLevel;
  displayValue: string;
}

export function analyzeSuspicion(
  followEvents: Array<{ event_type: string; target_username: string; target_display_name?: string | null; detected_at: string; is_initial?: boolean | null; gender_tag?: string | null }>,
  profileFollowings: Array<{ following_username: string; following_display_name?: string | null; gender_tag?: string | null }>,
  followerCount: number,
  followingCount: number,
  t?: (key: string, opts?: Record<string, unknown>) => string,
): SuspicionBreakdown {
  const tr = t || ((key: string) => key);
  const factors: SuspicionFactor[] = [];
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  // Build a lookup map from profile_followings for gender matching
  const followingGenderMap = new Map<string, string>();
  for (const f of profileFollowings) {
    if (f.gender_tag === "female" || f.gender_tag === "male") {
      followingGenderMap.set(f.following_username, f.gender_tag);
    }
  }

  // ── 1. Gender ratio (max 40) — based on NEW follows in last 7 days only ──
  const recentFollowEvents = followEvents.filter((e) => {
    if (e.event_type !== "follow" && e.event_type !== "new_following") return false;
    if (e.is_initial) return false;
    return Date.now() - new Date(e.detected_at).getTime() < SEVEN_DAYS;
  });

  let femaleCount = 0;
  let maleCount = 0;
  let unknownCount = 0;

  for (const ev of recentFollowEvents) {
    const fromFollowings = followingGenderMap.get(ev.target_username);
    let gender: string;
    if (fromFollowings) {
      gender = fromFollowings;
    } else if (ev.gender_tag === "female" || ev.gender_tag === "male") {
      gender = ev.gender_tag;
    } else {
      gender = detectGender(ev.target_display_name);
    }
    if (gender === "female") femaleCount++;
    else if (gender === "male") maleCount++;
    else unknownCount++;
  }

  const totalKnown = femaleCount + maleCount;
  const femalePercent = totalKnown > 0 ? Math.round((femaleCount / totalKnown) * 100) : 50;
  let genderScore = 0;
  if (totalKnown >= 3) {
    if (femalePercent > 80) genderScore = 40;
    else if (femalePercent > 70) genderScore = 30;
    else if (femalePercent > 60) genderScore = 20;
    else if (femalePercent > 55) genderScore = 10;
  }
  const genderLevel: FactorLevel = genderScore >= 30 ? "danger" : genderScore >= 10 ? "warning" : "safe";
  factors.push({
    name: tr("suspicion.genderRatio"),
    description: tr("suspicion.genderRatioDesc", { percent: femalePercent }),
    score: genderScore,
    maxScore: 40,
    icon: "♀",
    simpleLabel: `${femalePercent}%`,
    level: genderLevel,
    displayValue: totalKnown >= 3 ? `${femalePercent}%` : "–",
  });

  // ── 2. Recent follow activity (max 30) ──
  const recentFollows = recentFollowEvents.length;
  const activityRate = followingCount > 0 ? (recentFollows / followingCount) * 100 : 0;
  let activityScore = 0;
  if (activityRate > 10) activityScore = 30;
  else if (activityRate > 5) activityScore = 20;
  else if (activityRate > 2) activityScore = 10;
  else if (activityRate > 0.5) activityScore = 5;
  const activityLevel: FactorLevel = activityScore >= 20 ? "danger" : activityScore >= 5 ? "warning" : "safe";
  factors.push({
    name: tr("suspicion.followActivity"),
    description: tr("suspicion.followActivityDesc", { count: recentFollows }),
    score: activityScore,
    maxScore: 30,
    icon: "📈",
    simpleLabel: `${Math.round(activityRate)}%`,
    level: activityLevel,
    displayValue: `${Math.round(activityRate)}%`,
  });

  // ── 3. Follow/Unfollow churn (max 15) ──
  const recentUnfollows = followEvents.filter((e) => {
    if (e.event_type !== "unfollow" && e.event_type !== "unfollowed") return false;
    if (e.is_initial) return false;
    return Date.now() - new Date(e.detected_at).getTime() < SEVEN_DAYS;
  }).length;
  const churnRate = recentFollows > 0 ? recentUnfollows / recentFollows : 0;
  let churnScore = 0;
  if (churnRate > 0.5) churnScore = 15;
  else if (churnRate > 0.3) churnScore = 10;
  else if (churnRate > 0.1) churnScore = 5;
  const churnLevel: FactorLevel = churnScore >= 10 ? "danger" : churnScore >= 5 ? "warning" : "safe";
  factors.push({
    name: tr("suspicion.followUnfollow"),
    description: tr("suspicion.followUnfollowDesc", { unfollows: recentUnfollows, follows: recentFollows }),
    score: churnScore,
    maxScore: 15,
    icon: "🔄",
    simpleLabel: `${Math.round(churnRate * 100)}%`,
    level: churnLevel,
    displayValue: `${Math.round(churnRate * 100)}%`,
  });

  // ── 4. Following/Follower ratio (max 15) ──
  const ratio = followerCount > 0 ? followingCount / followerCount : followingCount > 0 ? 5 : 1;
  let ratioScore = 0;
  if (ratio > 3) ratioScore = 15;
  else if (ratio > 2) ratioScore = 10;
  else if (ratio > 1.5) ratioScore = 5;
  const ratioLevel: FactorLevel = ratioScore >= 10 ? "danger" : ratioScore >= 5 ? "warning" : "safe";
  factors.push({
    name: tr("suspicion.followingFollowerRatio"),
    description: tr("suspicion.followingFollowerRatioDesc", { ratio: ratio.toFixed(1) }),
    score: ratioScore,
    maxScore: 15,
    icon: "⚖️",
    simpleLabel: `${ratio.toFixed(1)}x`,
    level: ratioLevel,
    displayValue: `${ratio.toFixed(1)}x`,
  });

  const overallScore = Math.min(100, factors.reduce((sum, f) => sum + f.score, 0));

  let label: string;
  let emoji: string;
  if (overallScore <= 15) { label = tr("suspicion.unauffaellig"); emoji = "😇"; }
  else if (overallScore <= 35) { label = tr("suspicion.leicht_auffaellig"); emoji = "😊"; }
  else if (overallScore <= 55) { label = tr("suspicion.suspicious"); emoji = "🤨"; }
  else if (overallScore <= 75) { label = tr("suspicion.verySuspicious"); emoji = "😬"; }
  else { label = "Red Flag!"; emoji = "🚩"; }

  return {
    overallScore,
    label,
    emoji,
    factors,
    genderStats: { female: femaleCount, male: maleCount, unknown: unknownCount, total: femaleCount + maleCount + unknownCount, femalePercent },
  };
}
