import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { detectGender } from "@/lib/genderDetection";
import type { FollowEvent } from "@/hooks/useTrackedProfiles";

interface WeeklyGenderCardsProps {
  followEvents: FollowEvent[];
  profileFollowings: Array<{
    following_username: string;
    following_display_name?: string | null;
    following_avatar_url?: string | null;
    gender_tag?: string | null;
    first_seen_at?: string;
  }>;
}

interface GenderedFollow {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  detectedAt: string;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function useTimeAgoShort() {
  const { t } = useTranslation();
  return (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("dashboard.just_now");
    if (mins < 60) return t("dashboard.minutes_ago", { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("dashboard.hours_ago", { count: hours });
    return t("dashboard.days_ago", { count: Math.floor(hours / 24) });
  };
}

export function WeeklyGenderCards({ followEvents, profileFollowings }: WeeklyGenderCardsProps) {
  const { t } = useTranslation();
  const [sheetGender, setSheetGender] = useState<"female" | "male" | null>(null);
  const timeAgo = useTimeAgoShort();

  const followingMap = useMemo(() => {
    const map = new Map<string, { gender: string; avatar?: string | null; displayName?: string | null }>();
    for (const f of profileFollowings) {
      map.set(f.following_username, {
        gender: f.gender_tag || "unknown",
        avatar: f.following_avatar_url,
        displayName: f.following_display_name,
      });
    }
    return map;
  }, [profileFollowings]);

  const { femaleFollows, maleFollows, isOverallMode } = useMemo(() => {
    const female: GenderedFollow[] = [];
    const male: GenderedFollow[] = [];
    const now = Date.now();

    // Check if there are real (non-initial) follow events
    const hasRealEvents = followEvents.some(
      (e) =>
        !(e as any).is_initial &&
        (e.event_type === "follow" || e.event_type === "new_following") &&
        (e as any).direction === "following"
    );

    if (hasRealEvents) {
      // Use 7d real events
      const realFollows = followEvents.filter(
        (e) =>
          (e.event_type === "follow" || e.event_type === "new_following") &&
          !(e as any).is_initial &&
          (e as any).direction === "following" &&
          now - new Date(e.detected_at).getTime() < SEVEN_DAYS
      );

      for (const ev of realFollows) {
        const fromMap = followingMap.get(ev.target_username);
        let gender: string;
        if (fromMap && (fromMap.gender === "female" || fromMap.gender === "male")) gender = fromMap.gender;
        else if ((ev as any).gender_tag === "female" || (ev as any).gender_tag === "male") gender = (ev as any).gender_tag;
        else gender = detectGender(ev.target_display_name);

        const entry: GenderedFollow = {
          username: ev.target_username,
          displayName: fromMap?.displayName || ev.target_display_name,
          avatarUrl: fromMap?.avatar || ev.target_avatar_url,
          detectedAt: ev.detected_at,
        };

        if (gender === "female") female.push(entry);
        else if (gender === "male") male.push(entry);
      }

      female.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
      male.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());

      return { femaleFollows: female, maleFollows: male, isOverallMode: false };
    }

    // Fallback: show from profileFollowings directly
    for (const f of profileFollowings) {
      if (f.gender_tag === "female" || f.gender_tag === "male") {
        const entry: GenderedFollow = {
          username: f.following_username,
          displayName: f.following_display_name,
          avatarUrl: f.following_avatar_url,
          detectedAt: f.first_seen_at || new Date().toISOString(),
        };
        if (f.gender_tag === "female") female.push(entry);
        else male.push(entry);
      }
    }

    return { femaleFollows: female, maleFollows: male, isOverallMode: true };
  }, [followEvents, followingMap, profileFollowings]);

  const femaleCount = femaleFollows.length;
  const maleCount = maleFollows.length;
  const bothEmpty = femaleCount === 0 && maleCount === 0;
  const total = femaleCount + maleCount;
  const femalePercent = total > 0 ? Math.round((femaleCount / total) * 100) : 50;

  const sheetData = sheetGender === "female" ? femaleFollows : maleFollows;
  const sheetTitle = sheetGender === "female"
    ? t("weekly.women_followed", "Frauen gefolgt") + ` (${femaleCount})`
    : t("weekly.men_followed", "Männern gefolgt") + ` (${maleCount})`;

  return (
    <>
      <div className="mb-5">
        <p className="section-header px-1 mb-3">
          {isOverallMode
            ? t("weekly.overall_title", "Geschlechterverteilung")
            : t("weekly.title", "In der letzten Woche")}
        </p>

        {bothEmpty ? (
          <div
            className="rounded-2xl p-5 text-center border"
            style={{
              background: "hsl(var(--muted) / 0.3)",
              borderColor: "hsl(var(--border))",
            }}
          >
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
              {t("weekly.no_activity", "Noch keine Aktivität")}
            </p>
          </div>
        ) : (
          <>
            {/* Two solid bubbles */}
            <div className="flex gap-4 justify-center mb-4">
              {/* Female */}
              <button
                onClick={() => femaleCount > 0 && setSheetGender("female")}
                className="flex flex-col items-center gap-2"
                style={{ opacity: femaleCount === 0 ? 0.4 : 1 }}
              >
                <div
                  className="flex flex-col items-center justify-center rounded-full"
                  style={{
                    width: 110,
                    height: 110,
                    background: "#FF2D55",
                    boxShadow: femaleCount > 0 ? "0 8px 24px rgba(255,45,85,0.35)" : "none",
                  }}
                >
                  <span style={{ fontSize: "2rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                    {femaleCount}
                  </span>
                  <span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.8)" }}>♀</span>
                </div>
                <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                  {t("weekly.women_followed", "Frauen gefolgt")}
                </span>
              </button>

              {/* Male */}
              <button
                onClick={() => maleCount > 0 && setSheetGender("male")}
                className="flex flex-col items-center gap-2"
                style={{ opacity: maleCount === 0 ? 0.4 : 1 }}
              >
                <div
                  className="flex flex-col items-center justify-center rounded-full"
                  style={{
                    width: 110,
                    height: 110,
                    background: "#007AFF",
                    boxShadow: maleCount > 0 ? "0 8px 24px rgba(0,122,255,0.35)" : "none",
                  }}
                >
                  <span style={{ fontSize: "2rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                    {maleCount}
                  </span>
                  <span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.8)" }}>♂</span>
                </div>
                <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                  {t("weekly.men_followed", "Männern gefolgt")}
                </span>
              </button>
            </div>

            {/* Gender ratio bar */}
            {total > 0 && (
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${femalePercent}%`,
                    background: "linear-gradient(90deg, #FF2D55, #FF2D55)",
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {sheetGender && (
          <div className="fixed inset-0 z-50" onClick={() => setSheetGender(null)}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl max-h-[70vh] flex flex-col"
              style={{ background: "hsl(var(--card))" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 pb-3 flex items-center justify-between border-b border-border flex-shrink-0">
                <p className="font-bold text-foreground" style={{ fontSize: "1rem" }}>{sheetTitle}</p>
                <button onClick={() => setSheetGender(null)} className="p-2 -me-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 pb-[calc(env(safe-area-inset-bottom)+16px)]">
                {sheetData.map((item) => (
                  <a
                    key={item.username}
                    href={`https://instagram.com/${item.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 py-3 border-b border-border"
                  >
                    <InstagramAvatar src={item.avatarUrl} alt={item.username} fallbackInitials={item.username} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate" style={{ fontSize: "0.875rem" }}>@{item.username}</p>
                      {item.displayName && (
                        <p className="text-muted-foreground truncate" style={{ fontSize: "0.8125rem" }}>{item.displayName}</p>
                      )}
                    </div>
                    <span className="text-muted-foreground flex-shrink-0" style={{ fontSize: "0.75rem" }}>
                      {timeAgo(item.detectedAt)}
                    </span>
                  </a>
                ))}
                {sheetData.length === 0 && (
                  <p className="text-muted-foreground text-center py-8" style={{ fontSize: "0.875rem" }}>
                    {t("profile.noEventsYet", "Keine Einträge")}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
