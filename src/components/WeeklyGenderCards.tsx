import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { detectGender } from "@/lib/genderDetection";
import type { FollowEvent } from "@/hooks/useTrackedProfiles";
import silhouetteFemale from "@/assets/silhouette-female.png";
import silhouetteMale from "@/assets/silhouette-male.png";

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

  const { femaleFollows, maleFollows } = useMemo(() => {
    const female: GenderedFollow[] = [];
    const male: GenderedFollow[] = [];
    const now = Date.now();

    // Only real (non-initial) events from the last 7 days
    const realFollows = followEvents.filter(
      (e) =>
        (e.event_type === "follow" || e.event_type === "new_following") &&
        !e.is_initial &&
        e.direction === "following" &&
        now - new Date(e.detected_at).getTime() < SEVEN_DAYS
    );

    for (const ev of realFollows) {
      const fromMap = followingMap.get(ev.target_username);
      let gender: string;
      if (fromMap && (fromMap.gender === "female" || fromMap.gender === "male")) gender = fromMap.gender;
      else if ((ev as any).gender_tag === "female" || (ev as any).gender_tag === "male") gender = (ev as any).gender_tag;
      else gender = detectGender(ev.target_display_name, ev.target_username);

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

    return { femaleFollows: female, maleFollows: male, isInitialData: !hasRealFollows && initialFollows.length > 0 };
  }, [followEvents, followingMap]);

  const femaleCount = femaleFollows.length;
  const maleCount = maleFollows.length;

  const sheetData = sheetGender === "female" ? femaleFollows : maleFollows;
  const sheetTitle = sheetGender === "female"
    ? t("weekly.women_followed", "Frauen gefolgt") + ` (${femaleCount})`
    : t("weekly.men_followed", "Männern gefolgt") + ` (${maleCount})`;

  return (
    <>
      <div className="mb-2">
        <p className="section-header mb-3">
          {t("weekly.title", "Diese Woche neu gefolgt")}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Female Bubble */}
          <button
            onClick={() => femaleCount > 0 && setSheetGender("female")}
            className="text-start"
          >
            <div
              className="rounded-3xl overflow-hidden relative"
              style={{
                background: "linear-gradient(135deg, #FF2D55, #FF6B8A)",
                aspectRatio: "1/1",
                boxShadow: femaleCount > 0 ? "0 8px 32px rgba(255,45,85,0.4)" : "none",
                opacity: femaleCount === 0 ? 0.4 : 1,
              }}
            >
              <div className="absolute inset-0">
                <img src={silhouetteFemale} alt="" className="w-full h-full object-cover rounded-3xl" style={{ opacity: 0.3 }} />
              </div>
              <div className="absolute top-4 left-4">
                <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                  {femaleCount}
                </span>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                  {t("weekly.new_women", "neue Frauen")}
                </p>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex gap-1.5">
                {femaleFollows.slice(0, 4).map((f) => (
                  <InstagramAvatar
                    key={f.username}
                    src={f.avatarUrl}
                    alt={f.username}
                    fallbackInitials={f.username}
                    size={30}
                  />
                ))}
              </div>
              {femaleCount === 0 && (
                <div className="absolute bottom-3 left-3">
                  <p style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.6)" }}>
                    {t("weekly.no_activity", "Keine neue Aktivität")}
                  </p>
                </div>
              )}
            </div>
          </button>

          {/* Male Bubble */}
          <button
            onClick={() => maleCount > 0 && setSheetGender("male")}
            className="text-start"
          >
            <div
              className="rounded-3xl overflow-hidden relative"
              style={{
                background: "linear-gradient(135deg, #007AFF, #5AC8FA)",
                aspectRatio: "1/1",
                boxShadow: maleCount > 0 ? "0 8px 32px rgba(0,122,255,0.4)" : "none",
                opacity: maleCount === 0 ? 0.4 : 1,
              }}
            >
              <div className="absolute inset-0">
                <img src={silhouetteMale} alt="" className="w-full h-full object-cover rounded-3xl" style={{ opacity: 0.3 }} />
              </div>
              <div className="absolute top-4 left-4">
                <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                  {maleCount}
                </span>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                  {t("weekly.new_men", "neue Männer")}
                </p>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex gap-1.5">
                {maleFollows.slice(0, 4).map((f) => (
                  <InstagramAvatar
                    key={f.username}
                    src={f.avatarUrl}
                    alt={f.username}
                    fallbackInitials={f.username}
                    size={30}
                  />
                ))}
              </div>
              {maleCount === 0 && (
                <div className="absolute bottom-3 left-3">
                  <p style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.6)" }}>
                    {t("weekly.no_activity", "Keine neue Aktivität")}
                  </p>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Initial data hint */}
        {isInitialData && (femaleCount > 0 || maleCount > 0) && (
          <p className="text-muted-foreground text-center" style={{ fontSize: "0.625rem", opacity: 0.5 }}>
            📊 {t("weekly.based_on_initial", "Basierend auf dem ersten Scan · wird mit weiteren Scans genauer")}
          </p>
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
                      {isInitialData ? t("profile.initial_scan_label", "Beim Start erkannt") : timeAgo(item.detectedAt)}
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