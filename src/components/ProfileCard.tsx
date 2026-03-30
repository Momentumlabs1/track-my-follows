import { memo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Clock } from "lucide-react";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SpyIcon } from "@/components/SpyIcon";
import { useTranslation } from "react-i18next";
import { useRecentFollowings } from "@/hooks/useProfileFollowings";
import type { TrackedProfile } from "@/hooks/useTrackedProfiles";

const SUPABASE_URL = "https://bqqmfajowxzkdcvmrtyd.supabase.co";
function getProxiedUrl(src: string): string {
  if (src.includes("cdninstagram.com") || src.includes("fbcdn.net")) {
    return `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(src)}`;
  }
  return src;
}

function RectAvatar({ src, alt, fallback, className = "" }: { src?: string | null; alt: string; fallback: string; className?: string }) {
  const [stage, setStage] = useState<'direct' | 'proxy' | 'fallback'>('direct');

  useState(() => {
    return undefined;
  });

  if (!src || stage === 'fallback') {
    return (
      <div className={`w-full h-full flex items-center justify-center font-bold text-muted-foreground ${className}`} style={{ fontSize: '0.75rem', background: 'hsl(var(--muted))' }}>
        {fallback.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  const imgSrc = stage === 'direct' ? src : getProxiedUrl(src);
  return <img src={imgSrc} alt={alt} referrerPolicy="no-referrer" className={`w-full h-full object-cover ${className}`} onError={() => setStage(prev => prev === 'direct' ? 'proxy' : 'fallback')} />;
}

function useShortTimeAgo() {
  return (dateStr: string | null): string => {
    if (!dateStr) return "—";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "jetzt";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };
}

interface ProfileCardProps {
  profile: TrackedProfile;
  hasSpy: boolean;
  profileId: string;
  onTap: (profileId: string) => void;
  onAssignSpy: (profileId: string) => void;
  index: number;
  isDragging?: boolean;
  isHovered?: boolean;
  isDropped?: boolean;
}

export const ProfileCard = memo(function ProfileCard({ profile, hasSpy, profileId, onTap, index, isDragging, isHovered, isDropped }: ProfileCardProps) {
  const { t } = useTranslation();
  const shortTime = useShortTimeAgo();
  const { data: recentFollowings = [] } = useRecentFollowings(profileId);

  const isDropTarget = isHovered === true;

  const followerCount = profile.follower_count ?? profile.last_follower_count;
  const followingCount = profile.following_count ?? profile.last_following_count;

  return (
    <motion.div
      data-profile-id={profile.id}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      animate={{
        scale: isDropped ? [1, 1.05, 1] : isDropTarget ? 1.02 : 1,
        boxShadow: isDropped
          ? ["0 0 0 0px rgba(236,72,153,0)", "0 0 20px 6px rgba(236,72,153,0.5)", "0 0 0 0px rgba(236,72,153,0)"]
          : "0 0 0 0px rgba(236,72,153,0)",
      }}
      transition={isDropped
        ? { duration: 0.5, ease: "easeOut" }
        : { delay: index * 0.04, type: "spring", stiffness: 300, damping: 25 }
      }
      viewport={{ once: true }}
      className="relative rounded-2xl"
    >
      {isDropTarget && (
        <motion.div
          className="absolute -inset-[2px] rounded-2xl border-2 border-primary pointer-events-none z-10"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
      {isDropped && (
        <motion.div
          className="absolute -inset-[3px] rounded-2xl pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0], scale: [0.98, 1.02, 1] }}
          transition={{ duration: 0.6 }}
          style={{ border: "2px solid rgba(236,72,153,0.7)", boxShadow: "0 0 16px 4px rgba(236,72,153,0.3)" }}
        />
      )}

      <button
        onClick={() => onTap(profileId)}
        className="w-full text-start overflow-hidden rounded-2xl border border-border bg-card"
      >
        {/* ═══ Profile Header ═══ */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="relative flex-shrink-0">
              <InstagramAvatar src={profile.avatar_url} alt={profile.username} fallbackInitials={profile.username} size={56} />
              {hasSpy && <div className="absolute -top-1 -end-1"><SpyIcon size={16} glow /></div>}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-foreground truncate" style={{ fontSize: '1.125rem' }}>
                  @{profile.username}
                </p>
                {profile.is_private && <span style={{ fontSize: '0.75rem' }}>🔒</span>}
              </div>

              {/* Stats row */}
              {!profile.is_private && (followerCount != null || followingCount != null) && (
                <div className="flex items-center gap-3 mt-1">
                  {followerCount != null && (
                    <span className="text-muted-foreground" style={{ fontSize: '0.8125rem' }}>
                      <span className="font-semibold text-foreground">{followerCount.toLocaleString()}</span> Follower
                    </span>
                  )}
                  {followingCount != null && (
                    <span className="text-muted-foreground" style={{ fontSize: '0.8125rem' }}>
                      <span className="font-semibold text-foreground">{followingCount.toLocaleString()}</span> Following
                    </span>
                  )}
                </div>
              )}
              {profile.is_private && (
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.75rem' }}>
                  {t("private_frozen_short", "Tracking eingefroren")} 🔒
                </p>
              )}
            </div>

            {/* Time + badge + chevron */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {!profile.is_private && (
                <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: '0.75rem' }}>
                  <Clock className="h-3 w-3" />
                  {shortTime(profile.last_scanned_at)}
                </span>
              )}
              <span className="text-muted-foreground" style={{ fontSize: '0.625rem' }}>· 📡 1x/d</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground/50 rtl:rotate-180" />
            </div>
          </div>
        </div>

        {/* ═══ Zuletzt gefolgt – neutral sub-area ═══ */}
        {recentFollowings.length > 0 && (
          <div className="mx-0 mb-0 px-3 py-3 border-t border-border/30">
            <p className="text-muted-foreground mb-2" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              {t("profile_detail.tab_following", "Zuletzt gefolgt")}
            </p>
            <div className="flex gap-1.5">
              {recentFollowings.map((f, idx) => (
                <div
                  key={`${f.following_username}-${idx}`}
                  className="overflow-hidden rounded-md"
                  style={{ aspectRatio: '1/1', width: '40px', flexShrink: 0 }}
                >
                  <RectAvatar
                    src={f.following_avatar_url}
                    alt={f.following_username || ""}
                    fallback={f.following_username || "?"}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </button>
    </motion.div>
  );
});
