import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Lock, Users } from "lucide-react";
import { SpyWidget } from "@/components/SpyAgentCard";
import { ProfileCard } from "@/components/ProfileCard";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { SpyIcon } from "@/components/SpyIcon";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { useTrackedProfiles } from "@/hooks/useTrackedProfiles";
import { useMoveSpy } from "@/hooks/useSpyProfile";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { haptic } from "@/lib/native";
import { toast } from "sonner";
import spyGif from "@/assets/spy-logo-animated.gif";

export interface UnifiedFeedEvent {
  id: string; tracked_profile_id: string; detected_at: string; is_read: boolean;
  source: "follow" | "follower"; event_type: string;
  target_username?: string; target_avatar_url?: string | null; target_display_name?: string | null;
  target_follower_count?: number | null; target_is_private?: boolean | null; direction?: string;
  gender_tag?: string | null; is_mutual?: boolean | null; category?: string | null;
  username?: string; full_name?: string | null; profile_pic_url?: string | null;
  follower_count?: number | null; is_verified?: boolean; is_initial?: boolean;
  tracked_profiles?: { username: string; avatar_url: string | null } | null;
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, showPaywall } = useSubscription();
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredProfileId, setHoveredProfileId] = useState<string | null>(null);

  const { data: profiles = [], isLoading: profilesLoading } = useTrackedProfiles();
  const moveSpy = useMoveSpy();
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const spyProfile = profiles.find((p) => p.has_spy === true) || null;
  const isPro = plan === "pro";

  const handleProfileTap = useCallback((profileId: string) => navigate(`/profile/${profileId}`), [navigate]);
  const handleMoveSpy = useCallback((profileId: string) => {
    moveSpy.mutate(profileId, {
      onSuccess: () => {
        const p = profiles.find(p => p.id === profileId);
        if (p) toast.success(`Spion überwacht jetzt @${p.username} 🕵️`);
        try { navigator.vibrate?.(50); } catch {}
      }
    });
  }, [moveSpy, profiles]);

  const followerCount = spyProfile?.follower_count ?? spyProfile?.last_follower_count;
  const followingCount = spyProfile?.following_count ?? spyProfile?.last_following_count;

  return (
    <div className="min-h-screen bg-background">
      <WelcomeDialog />

      {/* ═══ HEADER with curve ═══ */}
      <div className="relative" style={{ paddingBottom: '60px' }}>
        {/* Pink gradient area */}
        <div
          className="relative z-[1]"
          style={{
            background: 'linear-gradient(180deg, hsl(347 100% 65%), hsl(347 90% 50%))',
            paddingBottom: spyProfile ? '90px' : '50px',
          }}
        >
          {/* ── Greeting zone ── */}
          <div className="px-6 pt-[calc(env(safe-area-inset-top)+20px)] pb-4">
            <p className="text-center font-bold text-white/80 mb-1" style={{ fontSize: '0.8125rem', letterSpacing: '0.06em' }}>
              SpySecret
            </p>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <h1 className="font-bold text-white text-center" style={{ fontSize: '1.875rem', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                Hey {displayName}
              </h1>
            </motion.div>
            {profiles.length > 0 && (
              <p className="text-center text-white/55 mt-1.5" style={{ fontSize: '0.75rem' }}>
                {profiles.length} {profiles.length === 1 ? 'Account' : 'Accounts'} überwacht
              </p>
            )}
          </div>

          {/* ── Divider line between greeting & spy zone ── */}
          {isPro && spyProfile && (
            <>
              <div className="mx-8 border-t border-white/15" />

              {/* ── Spied account zone (inside pink) ── */}
              <button
                onClick={() => navigate(`/profile/${spyProfile.id}`)}
                className="w-full px-6 pt-4 pb-2 flex items-center gap-3.5 text-start"
              >
                <div className="relative">
                  <div className="rounded-full overflow-hidden border-2 border-white/25" style={{ width: 46, height: 46 }}>
                    <InstagramAvatar
                      src={spyProfile.avatar_url}
                      alt={spyProfile.username}
                      fallbackInitials={spyProfile.username}
                      size={46}
                    />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-white/60 font-bold uppercase tracking-wider block" style={{ fontSize: '0.5625rem' }}>
                    🕵️ Wird überwacht · Stündlich
                  </span>
                  <p className="font-bold text-white truncate" style={{ fontSize: '0.9375rem' }}>
                    @{spyProfile.username}
                  </p>
                  {(followerCount != null || followingCount != null) && (
                    <p className="text-white/50 mt-0.5" style={{ fontSize: '0.6875rem' }}>
                      {followerCount != null && <><span className="font-semibold text-white/80">{formatCount(followerCount)}</span> Follower</>}
                      {followerCount != null && followingCount != null && <span className="text-white/30"> · </span>}
                      {followingCount != null && <><span className="font-semibold text-white/80">{formatCount(followingCount)}</span> Following</>}
                    </p>
                  )}
                </div>
              </button>
            </>
          )}
        </div>

        {/* ── SVG Curve ── */}
        <div className="absolute bottom-[28px] left-0 w-full z-[2]" style={{ lineHeight: 0 }}>
          <svg
            viewBox="0 0 500 50"
            preserveAspectRatio="none"
            className="block w-full"
            style={{ height: '50px' }}
          >
            <path
              d="M0,0 C150,50 350,50 500,0 L500,50 L0,50 Z"
              fill="hsl(var(--background))"
            />
          </svg>
        </div>

        {/* ── Spy Icon floating on the curve ── */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[3]">
          {isPro ? (
            <SpyWidget
              spyProfile={spyProfile}
              onDragMoveSpy={handleMoveSpy}
              isDragging={isDragging}
              onDragStateChange={setIsDragging}
              onHoverProfileChange={setHoveredProfileId}
            />
          ) : (
            <button
              onClick={() => { haptic.light(); showPaywall("spy_agent"); }}
              className="relative flex flex-col items-center"
            >
              <div className="rounded-full p-1 bg-background shadow-lg border-2 border-border">
                <div className="relative">
                  <SpyIcon size={52} />
                  <div className="absolute -bottom-0.5 -right-0.5 rounded-full p-0.5 bg-muted">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <span className="text-muted-foreground font-semibold mt-1" style={{ fontSize: '0.5625rem' }}>
                PRO freischalten
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Unfollow hint banner */}
      {spyProfile && (spyProfile.pending_unfollow_hint ?? 0) > 0 && (
        <div className="px-5 mt-2">
          <button
            onClick={() => navigate(`/profile/${spyProfile.id}`)}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-destructive/20"
            style={{ background: 'hsl(var(--destructive) / 0.08)' }}
          >
            <span>⚠️</span>
            <span className="flex-1 text-start font-semibold text-foreground" style={{ fontSize: '0.8125rem' }}>
              ~{spyProfile.pending_unfollow_hint} {t("spy.unfollows_detected")}
            </span>
            <span className="text-primary font-semibold" style={{ fontSize: '0.8125rem' }}>
              🔍 {t("spy.reveal_now")}
            </span>
          </button>
        </div>
      )}

      {/* ═══ ACCOUNTS SECTION ═══ */}
      {profiles.length > 0 && (
        <div className="px-5 mt-4 pb-3 space-y-4">
          <div className="px-1 mb-1 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-bold text-foreground" style={{ fontSize: '1.125rem' }}>
                {t("spy.your_accounts", "Deine Accounts")}
              </p>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.8125rem' }}>
                {t("spy.daily_scan_subtitle", "Täglicher Basis-Scan")}
              </p>
            </div>
          </div>
          {profiles.map((profile, i) => (
            <ProfileCard key={profile.id} profile={profile} profileId={profile.id} hasSpy={profile.has_spy === true}
              onTap={handleProfileTap} onAssignSpy={handleMoveSpy} index={i} isDragging={isDragging} isHovered={hoveredProfileId === profile.id} />
          ))}
          <button onClick={() => navigate("/add-profile")}
            className="w-full py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 min-h-[44px] text-muted-foreground bg-card border border-border"
            style={{ fontSize: '0.875rem' }}>
            <Plus className="h-4 w-4" /> {t("nav.add")} ({profiles.length}/{isPro ? 5 : 1})
          </button>
        </div>
      )}

      {!profilesLoading && profiles.length === 0 && (
        <div className="text-center py-20 px-5">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <p className="font-semibold text-foreground" style={{ fontSize: '0.9375rem' }}>{t("dashboard.no_profiles")}</p>
            <p className="text-muted-foreground mt-1 mb-6" style={{ fontSize: '0.8125rem' }}>{t("dashboard.add_first")}</p>
            <button onClick={() => navigate("/add-profile")} className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl min-h-[44px]" style={{ fontSize: '0.9375rem' }}>
              <Plus className="h-4 w-4 inline me-2" />{t("nav.add")}
            </button>
          </motion.div>
        </div>
      )}

      <div className="pb-24" />
    </div>
  );
};

export default Dashboard;
