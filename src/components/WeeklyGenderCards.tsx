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

    return { femaleFollows: female, maleFollows: male };
  }, [followEvents, followingMap]);

  const sheetData = sheetGender === "female" ? femaleFollows : maleFollows;
  const sheetTitle = sheetGender === "female"
    ? t("weekly.women_followed", "Frauen gefolgt") + ` (${femaleFollows.length})`
    : t("weekly.men_followed", "Männern gefolgt") + ` (${maleFollows.length})`;

  return (
    <>
      <div className="mb-5">
        <p className="section-header px-1 mb-3">
          {t("weekly.title", "In der letzten Woche")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* Female card */}
          <GenderCard
            gender="female"
            count={femaleFollows.length}
            label={t("weekly.women_followed", "Frauen gefolgt")}
            items={femaleFollows.slice(0, 3)}
            totalExtra={Math.max(0, femaleFollows.length - 3)}
            onTap={() => femaleFollows.length > 0 && setSheetGender("female")}
            t={t}
          />
          {/* Male card */}
          <GenderCard
            gender="male"
            count={maleFollows.length}
            label={t("weekly.men_followed", "Männern gefolgt")}
            items={maleFollows.slice(0, 3)}
            totalExtra={Math.max(0, maleFollows.length - 3)}
            onTap={() => maleFollows.length > 0 && setSheetGender("male")}
            t={t}
          />
        </div>
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

function GenderCard({
  gender,
  count,
  label,
  items,
  totalExtra,
  onTap,
  t,
}: {
  gender: "female" | "male";
  count: number;
  label: string;
  items: GenderedFollow[];
  totalExtra: number;
  onTap: () => void;
  t: (key: string, opts?: any) => string;
}) {
  const isFemale = gender === "female";
  const isEmpty = count === 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: isFemale ? 0.1 : 0.16 }}
      onClick={onTap}
      className="text-start rounded-2xl p-4 flex flex-col gap-3 border transition-opacity"
      style={{
        background: isFemale
          ? "hsl(347 100% 59% / 0.06)"
          : "hsl(210 100% 56% / 0.06)",
        borderColor: isFemale
          ? "hsl(347 100% 59% / 0.12)"
          : "hsl(210 100% 56% / 0.12)",
        opacity: isEmpty ? 0.5 : 1,
      }}
    >
      {/* Header */}
      <div className="flex items-baseline gap-2">
        <span
          className="font-extrabold tabular-nums"
          style={{
            fontSize: "1.75rem",
            lineHeight: 1,
            color: isFemale ? "hsl(347 100% 59%)" : "hsl(210 100% 56%)",
          }}
        >
          {count}
        </span>
        <span
          className="font-bold"
          style={{
            fontSize: "1rem",
            color: isFemale ? "hsl(347 100% 59%)" : "hsl(210 100% 56%)",
            opacity: 0.7,
          }}
        >
          {isFemale ? "♀" : "♂"}
        </span>
      </div>
      <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
        {label}
      </span>

      {/* Preview accounts */}
      {items.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          {items.map((item) => (
            <div key={item.username} className="flex items-center gap-2 min-w-0">
              <InstagramAvatar
                src={item.avatarUrl}
                alt={item.username}
                fallbackInitials={item.username}
                size={24}
              />
              <span
                className="text-foreground truncate"
                style={{ fontSize: "0.75rem" }}
              >
                @{item.username}
              </span>
            </div>
          ))}
          {totalExtra > 0 && (
            <span className="text-muted-foreground" style={{ fontSize: "0.6875rem" }}>
              +{totalExtra} {t("weekly.more_count", "weitere")}
            </span>
          )}
        </div>
      )}
    </motion.button>
  );
}
