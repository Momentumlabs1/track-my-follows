import { detectGender } from "@/lib/genderDetection";

export type GenderGuess = "female" | "male" | "unknown";

export { detectGender as guessGender };

export interface SuspicionBreakdown {
  overallScore: number;
  label: string;
  emoji: string;
  factors: SuspicionFactor[];
  genderStats: { female: number; male: number; unknown: number; total: number; femalePercent: number };
}

export interface SuspicionFactor {
  name: string;
  description: string;
  score: number;
  maxScore: number;
  icon: string;
}

export function analyzeSuspicion(
  followEvents: Array<{ event_type: string; target_display_name?: string | null; detected_at: string }>,
  profileFollowings: Array<{ following_display_name?: string | null }>,
  followerCount: number,
  followingCount: number,
  t?: (key: string, opts?: Record<string, unknown>) => string,
): SuspicionBreakdown {
  const tr = t || ((key: string) => key);
  const factors: SuspicionFactor[] = [];

  // 1. Gender ratio (max 40)
  let femaleCount = 0;
  let maleCount = 0;
  let unknownCount = 0;
  const allNames = profileFollowings.length > 0
    ? profileFollowings
    : followEvents.filter((e) => e.event_type === "follow");

  for (const entry of allNames) {
    const name = "following_display_name" in entry
      ? (entry as { following_display_name?: string | null }).following_display_name
      : (entry as { target_display_name?: string | null }).target_display_name;
    const gender = detectGender(name);
    if (gender === "female") femaleCount++;
    else if (gender === "male") maleCount++;
    else unknownCount++;
  }

  const totalKnown = femaleCount + maleCount;
  const femalePercent = totalKnown > 0 ? Math.round((femaleCount / totalKnown) * 100) : 50;
  let genderScore = 0;
  if (totalKnown >= 5) {
    if (femalePercent > 80) genderScore = 40;
    else if (femalePercent > 70) genderScore = 30;
    else if (femalePercent > 60) genderScore = 20;
    else if (femalePercent > 55) genderScore = 10;
  }
  factors.push({
    name: tr("suspicion.genderRatio"),
    description: tr("suspicion.genderRatioDesc", { percent: femalePercent }),
    score: genderScore,
    maxScore: 40,
    icon: "👩",
  });

  // 2. Recent follow activity (max 30)
  const recentFollows = followEvents.filter((e) => {
    if (e.event_type !== "follow") return false;
    return Date.now() - new Date(e.detected_at).getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const activityRate = followingCount > 0 ? (recentFollows / followingCount) * 100 : 0;
  let activityScore = 0;
  if (activityRate > 10) activityScore = 30;
  else if (activityRate > 5) activityScore = 20;
  else if (activityRate > 2) activityScore = 10;
  else if (activityRate > 0.5) activityScore = 5;
  factors.push({
    name: tr("suspicion.followActivity"),
    description: tr("suspicion.followActivityDesc", { count: recentFollows }),
    score: activityScore,
    maxScore: 30,
    icon: "📈",
  });

  // 3. Follow/Unfollow churn (max 15)
  const recentUnfollows = followEvents.filter((e) => {
    if (e.event_type !== "unfollow") return false;
    return Date.now() - new Date(e.detected_at).getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const churnRate = recentFollows > 0 ? recentUnfollows / recentFollows : 0;
  let churnScore = 0;
  if (churnRate > 0.5) churnScore = 15;
  else if (churnRate > 0.3) churnScore = 10;
  else if (churnRate > 0.1) churnScore = 5;
  factors.push({
    name: tr("suspicion.followUnfollow"),
    description: tr("suspicion.followUnfollowDesc", { unfollows: recentUnfollows, follows: recentFollows }),
    score: churnScore,
    maxScore: 15,
    icon: "🔄",
  });

  // 4. Following/Follower ratio (max 10)
  const ratio = followerCount > 0 ? followingCount / followerCount : followingCount > 0 ? 5 : 1;
  let ratioScore = 0;
  if (ratio > 3) ratioScore = 10;
  else if (ratio > 2) ratioScore = 7;
  else if (ratio > 1.5) ratioScore = 4;
  factors.push({
    name: tr("suspicion.followingFollowerRatio"),
    description: tr("suspicion.followingFollowerRatioDesc", { ratio: ratio.toFixed(1) }),
    score: ratioScore,
    maxScore: 10,
    icon: "⚖️",
  });

  // 5. Night activity (max 5) - NEW
  const nightFollows = followEvents.filter((e) => {
    if (e.event_type !== "follow") return false;
    const hour = new Date(e.detected_at).getHours();
    return hour >= 23 || hour <= 5;
  }).length;
  const nightRatio = recentFollows > 0 ? nightFollows / recentFollows : 0;
  let nightScore = 0;
  if (nightRatio > 0.5) nightScore = 5;
  else if (nightRatio > 0.3) nightScore = 3;
  else if (nightRatio > 0.1) nightScore = 1;
  factors.push({
    name: tr("suspicion.nightActivity"),
    description: tr("suspicion.nightActivityDesc"),
    score: nightScore,
    maxScore: 5,
    icon: "🌙",
  });

  const overallScore = Math.min(100, factors.reduce((sum, f) => sum + f.score, 0));

  let label: string;
  let emoji: string;
  if (overallScore <= 15) { label = tr("suspicion.safe"); emoji = "😇"; }
  else if (overallScore <= 35) { label = tr("suspicion.safe"); emoji = "😊"; }
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
