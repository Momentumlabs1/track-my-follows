import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { detectGender } from "@/lib/genderDetection";
import type { FollowEvent } from "@/hooks/useTrackedProfiles";

interface NewFollowsBubblesProps {
  followEvents: FollowEvent[];
  profileFollowings: Array<{
    following_username: string;
    following_display_name?: string | null;
    following_avatar_url?: string | null;
    gender_tag?: string | null;
  }>;
}

interface GenderedFollow {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  detectedAt: string;
}

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

export function NewFollowsBubbles({ followEvents, profileFollowings }: NewFollowsBubblesProps) {
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

    const realFollows = followEvents.filter(
      (e) =>
        (e.event_type === "follow" || e.event_type === "new_following") &&
        !(e as any).is_initial &&
        (e as any).direction === "following"
    );

    for (const ev of realFollows) {
      const fromMap = followingMap.get(ev.target_username);
      let gender: string;
      if (fromMap && (fromMap.gender === "female" || fromMap.gender === "male")) {
        gender = fromMap.gender;
      } else if ((ev as any).gender_tag === "female" || (ev as any).gender_tag === "male") {
        gender = (ev as any).gender_tag;
      } else {
        gender = detectGender(ev.target_display_name);
      }

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

    return { femaleFollows: female, maleFollows: male };
  }, [followEvents, followingMap]);

  const sheetData = sheetGender === "female" ? femaleFollows : maleFollows;
  const sheetTitle = sheetGender === "female"
    ? t("insights_new.new_women_title", "👩 Neue Frauen ({{count}})", { count: femaleFollows.length })
    : t("insights_new.new_men_title", "👨 Neue Männer ({{count}})", { count: maleFollows.length });

  return (
    <>
      <div
        className="p-5"
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          padding: "20px",
        }}
      >
        <p className="text-foreground font-semibold mb-1" style={{ fontSize: "0.875rem" }}>
          {t("insights_new.new_followed", "Neu gefolgt")}
        </p>

        <div className="flex items-center justify-center gap-8 py-5">
          {/* Female bubble */}
          <button
            onClick={() => femaleFollows.length > 0 && setSheetGender("female")}
            className="flex flex-col items-center gap-2"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: femaleFollows.length === 0 ? 0.3 : 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="flex flex-col items-center justify-center"
              style={{
                width: 100, height: 100, borderRadius: 9999,
                background: "rgba(255,45,85,0.12)",
              }}
            >
              <span style={{ fontSize: "1.75rem" }}>👩</span>
              <span className="font-bold tabular-nums" style={{ fontSize: "2rem", color: "#FF2D55", lineHeight: 1, letterSpacing: "-0.5px" }}>
                {femaleFollows.length}
              </span>
            </motion.div>
            <span className="text-muted-foreground" style={{ fontSize: "0.875rem", opacity: 0.6 }}>
              {t("gender.female", "Frauen")}
            </span>
          </button>

          {/* Male bubble */}
          <button
            onClick={() => maleFollows.length > 0 && setSheetGender("male")}
            className="flex flex-col items-center gap-2"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: maleFollows.length === 0 ? 0.3 : 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.08 }}
              className="flex flex-col items-center justify-center"
              style={{
                width: 100, height: 100, borderRadius: 9999,
                background: "rgba(0,122,255,0.12)",
              }}
            >
              <span style={{ fontSize: "1.75rem" }}>👨</span>
              <span className="font-bold tabular-nums" style={{ fontSize: "2rem", color: "#007AFF", lineHeight: 1, letterSpacing: "-0.5px" }}>
                {maleFollows.length}
              </span>
            </motion.div>
            <span className="text-muted-foreground" style={{ fontSize: "0.875rem", opacity: 0.6 }}>
              {t("gender.male", "Männer")}
            </span>
          </button>
        </div>

        <p className="text-center" style={{ fontSize: "0.75rem", opacity: 0.3, color: "hsl(var(--foreground))" }}>
          {t("insights_new.since_tracking", "Tippe für Details")}
        </p>
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
              className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl max-h-[70vh] flex flex-col"
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
                    className="flex items-center gap-3 px-5 py-3"
                    style={{ borderBottom: "0.5px solid hsl(var(--border))" }}
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
                    {t("insights_new.no_entries", "Keine Einträge")}
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
