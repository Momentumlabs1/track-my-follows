/**
 * Suspicion Analysis Engine
 * Analyzes follow patterns to determine how "suspicious" a profile's activity is.
 * Factors: follow frequency, gender ratio of followed accounts, follow/unfollow churn.
 */

// Common female first names (international mix, lowercase)
const FEMALE_NAMES = new Set([
  // German/Austrian
  "anna", "maria", "laura", "lisa", "sarah", "sophie", "julia", "lena", "hannah", "emma",
  "lea", "mia", "nina", "jana", "alina", "lara", "clara", "elena", "melanie", "nadine",
  "stefanie", "christina", "katharina", "alexandra", "bianca", "daniela", "jessica", "sandra",
  "sabrina", "tamara", "vanessa", "jennifer", "michaela", "verena", "denise", "jasmin",
  "carina", "manuela", "martina", "petra", "silvia", "claudia", "monika",
  // English
  "emily", "jessica", "ashley", "samantha", "brittany", "taylor", "olivia", "madison",
  "chloe", "grace", "natalie", "victoria", "amber", "nicole", "rachel", "megan", "kate",
  "rebecca", "amanda", "stephanie", "heather", "lauren", "bella", "sophia", "ava", "isabella",
  "charlotte", "amelia", "harper", "ella", "scarlett", "aria", "lily", "zoe", "riley",
  // Turkish
  "ayse", "fatma", "emine", "hatice", "zeynep", "elif", "merve", "büsra", "esra", "tugba",
  "selin", "dilara", "nur", "buse", "ceren", "irem", "gamze", "gizem", "pinar", "derya",
  // Spanish/Portuguese
  "maria", "carmen", "lucia", "paula", "sofia", "valentina", "camila", "gabriela", "daniela",
  "andrea", "ana", "rosa", "elena", "adriana", "diana", "carolina", "alejandra",
  // Arabic
  "fatima", "aisha", "maryam", "layla", "sara", "nour", "hana", "amira", "dina", "rania",
  "yasmin", "lina", "maya", "nadia", "salma", "sana", "zahra",
  // Slavic
  "natasha", "katya", "olga", "tatiana", "irina", "svetlana", "elena", "marina", "alina",
  "daria", "polina", "anastasia", "kristina", "milena", "ivana", "jelena",
]);

// Common male first names (international mix, lowercase)
const MALE_NAMES = new Set([
  // German/Austrian
  "max", "lukas", "leon", "paul", "jonas", "felix", "david", "moritz", "julian", "niklas",
  "tobias", "daniel", "stefan", "michael", "thomas", "alexander", "christian", "florian",
  "markus", "patrick", "dominik", "sebastian", "bernhard", "wolfgang", "franz", "josef",
  "andreas", "martin", "peter", "hans", "karl", "helmut", "gerhard", "manfred", "manuel",
  // English
  "james", "john", "robert", "michael", "william", "david", "richard", "joseph", "thomas",
  "charles", "christopher", "matthew", "anthony", "mark", "donald", "steven", "andrew",
  "brian", "joshua", "kevin", "jason", "ryan", "jacob", "ethan", "noah", "liam", "mason",
  "logan", "alex", "tyler", "brandon", "dylan", "connor", "luke", "jack", "owen",
  // Turkish
  "mehmet", "mustafa", "ahmet", "ali", "hasan", "ibrahim", "murat", "ismail", "osman",
  "yusuf", "emre", "burak", "serkan", "volkan", "cem", "baris", "arda", "kerem", "kaan",
  // Arabic
  "mohammed", "muhammad", "ahmed", "omar", "khalid", "hassan", "hussein", "saif", "amir",
  "tariq", "youssef", "karim", "nabil", "bilal", "hamza", "ibrahim",
  // Slavic
  "ivan", "vladimir", "sergei", "dmitri", "alexei", "nikola", "milan", "dragan", "boris",
  "andrej", "stefan", "marko",
]);

function extractFirstName(displayName: string | null | undefined): string | null {
  if (!displayName) return null;
  // Remove emojis, special chars, clean up
  const cleaned = displayName
    .replace(/[\u{1F600}-\u{1F9FF}]/gu, "")
    .replace(/[|📷📸🇷🇺🇦🇹🇩🇪]/g, "")
    .trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length === 0 || !parts[0]) return null;
  return parts[0].toLowerCase().replace(/[^a-zäöüß]/g, "");
}

export type GenderGuess = "female" | "male" | "unknown";

export function guessGender(displayName: string | null | undefined): GenderGuess {
  const firstName = extractFirstName(displayName);
  if (!firstName || firstName.length < 2) return "unknown";
  if (FEMALE_NAMES.has(firstName)) return "female";
  if (MALE_NAMES.has(firstName)) return "male";
  // Heuristic: names ending in 'a', 'e', 'i' are more often female in many cultures
  if (firstName.endsWith("a") && firstName.length > 3) return "female";
  return "unknown";
}

export interface SuspicionBreakdown {
  overallScore: number; // 0-100
  label: string;
  emoji: string;
  factors: SuspicionFactor[];
  genderStats: { female: number; male: number; unknown: number; total: number; femalePercent: number };
}

export interface SuspicionFactor {
  name: string;
  description: string;
  score: number; // contribution to overall
  maxScore: number;
  icon: string;
}

export function analyzeSuspicion(
  followEvents: Array<{ event_type: string; target_display_name?: string | null; detected_at: string }>,
  profileFollowings: Array<{ following_display_name?: string | null }>,
  followerCount: number,
  followingCount: number,
): SuspicionBreakdown {
  const factors: SuspicionFactor[] = [];

  // 1. Gender ratio analysis (max 40 points)
  let femaleCount = 0;
  let maleCount = 0;
  let unknownCount = 0;
  const allNames = profileFollowings.length > 0
    ? profileFollowings
    : followEvents.filter(e => e.event_type === "follow");

  for (const entry of allNames) {
    const name = "following_display_name" in entry
      ? (entry as { following_display_name?: string | null }).following_display_name
      : (entry as { target_display_name?: string | null }).target_display_name;
    const gender = guessGender(name);
    if (gender === "female") femaleCount++;
    else if (gender === "male") maleCount++;
    else unknownCount++;
  }

  const totalKnown = femaleCount + maleCount;
  const femalePercent = totalKnown > 0 ? Math.round((femaleCount / totalKnown) * 100) : 50;
  let genderScore = 0;
  if (totalKnown >= 5) {
    // > 80% female is very suspicious, 60-80% is moderate
    if (femalePercent > 80) genderScore = 40;
    else if (femalePercent > 70) genderScore = 30;
    else if (femalePercent > 60) genderScore = 20;
    else if (femalePercent > 55) genderScore = 10;
  }
  factors.push({
    name: "Gender Ratio",
    description: `${femalePercent}% weibliche Accounts`,
    score: genderScore,
    maxScore: 40,
    icon: "👩",
  });

  // 2. Recent follow activity (max 30 points)
  const recentFollows = followEvents.filter(e => {
    if (e.event_type !== "follow") return false;
    const age = Date.now() - new Date(e.detected_at).getTime();
    return age < 7 * 24 * 60 * 60 * 1000; // 7 days
  }).length;
  const activityRate = followingCount > 0 ? (recentFollows / followingCount) * 100 : 0;
  let activityScore = 0;
  if (activityRate > 10) activityScore = 30;
  else if (activityRate > 5) activityScore = 20;
  else if (activityRate > 2) activityScore = 10;
  else if (activityRate > 0.5) activityScore = 5;
  factors.push({
    name: "Follow-Aktivität",
    description: `${recentFollows} neue Follows in 7 Tagen`,
    score: activityScore,
    maxScore: 30,
    icon: "📈",
  });

  // 3. Follow/Unfollow churn (max 15 points)
  const recentUnfollows = followEvents.filter(e => {
    if (e.event_type !== "unfollow") return false;
    const age = Date.now() - new Date(e.detected_at).getTime();
    return age < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const churnRate = recentFollows > 0 ? (recentUnfollows / recentFollows) : 0;
  let churnScore = 0;
  if (churnRate > 0.5) churnScore = 15;
  else if (churnRate > 0.3) churnScore = 10;
  else if (churnRate > 0.1) churnScore = 5;
  factors.push({
    name: "Follow/Unfollow",
    description: `${recentUnfollows} Unfollows vs ${recentFollows} Follows`,
    score: churnScore,
    maxScore: 15,
    icon: "🔄",
  });

  // 4. Following/Follower ratio (max 15 points)
  const ratio = followerCount > 0 ? followingCount / followerCount : followingCount > 0 ? 5 : 1;
  let ratioScore = 0;
  if (ratio > 3) ratioScore = 15;
  else if (ratio > 2) ratioScore = 10;
  else if (ratio > 1.5) ratioScore = 5;
  factors.push({
    name: "Following/Follower",
    description: `Ratio: ${ratio.toFixed(1)}x`,
    score: ratioScore,
    maxScore: 15,
    icon: "⚖️",
  });

  const overallScore = Math.min(100, factors.reduce((sum, f) => sum + f.score, 0));

  let label: string;
  let emoji: string;
  if (overallScore <= 15) { label = "Sehr sicher"; emoji = "😇"; }
  else if (overallScore <= 35) { label = "Unauffällig"; emoji = "😊"; }
  else if (overallScore <= 55) { label = "Verdächtig"; emoji = "🤨"; }
  else if (overallScore <= 75) { label = "Sehr verdächtig"; emoji = "😬"; }
  else { label = "Red Flag!"; emoji = "🚩"; }

  return {
    overallScore,
    label,
    emoji,
    factors,
    genderStats: {
      female: femaleCount,
      male: maleCount,
      unknown: unknownCount,
      total: femaleCount + maleCount + unknownCount,
      femalePercent,
    },
  };
}
