import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Lock, Users } from "lucide-react";
import { SpyWidget } from "@/components/SpyAgentCard";
import { ProfileCard } from "@/components/ProfileCard";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { useTrackedProfiles } from "@/hooks/useTrackedProfiles";
import { useMoveSpy } from "@/hooks/useSpyProfile";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { haptic } from "@/lib/native";
import { toast } from "sonner";

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
        const p = profiles.find((profile) => profile.id === profileId);
        if (p) toast.success(`Spion überwacht jetzt @${p.username} 🕵️`);
        try { navigator.vibrate?.(50); } catch {}
      },
    });
  }, [moveSpy, profiles]);

  const followerCount = spyProfile?.follower_count ?? spyProfile?.last_follower_count;
  const followingCount = spyProfile?.following_count ?? spyProfile?.last_following_count;

  return (
    <div className="min-h-screen bg-background">
      <WelcomeDialog />

      {/* ═══ HEADER (separated zones + curve) ═══ */}
      <div className="relative overflow-hidden gradient-pink">
        {/* Greeting zone */}
        <div className="px-6 pt-[calc(env(safe-area-inset-top)+20px)] pb-4 text-center">
          <p className="font-bold text-primary-foreground/85 mb-1" style={{ fontSize: "0.8125rem", letterSpacing: "0.06em" }}>
            SpySecret
          </p>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <h1 className="font-bold text-primary-foreground" style={{ fontSize: "1.9rem", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Hey {displayName}
            </h1>
          </motion.div>
          <p className="text-primary-foreground/70 mt-1" style={{ fontSize: "0.75rem" }}>
            {t("dashboard.spy_briefing", "Heute hält dein Agent alles im Blick.")}
          </p>
        </div>

        {/* Separator between greeting and agent zone */}
        <div className="mx-6 h-px bg-primary-foreground/20" />

        {/* Agent zone */}
        <div className="px-5 pt-4 pb-12">
          <p className="uppercase tracking-[0.12em] text-primary-foreground/70 font-bold px-1" style={{ fontSize: "0.625rem" }}>
            {t("spy.your_spy", "Dein Spion")}
          </p>

          <div className="mt-2 rounded-3xl border border-primary-foreground/25 bg-primary-foreground/10 backdrop-blur-sm p-4">
            {isPro ? (
              <div className="flex items-center gap-4">
                <SpyWidget
                  spyProfile={spyProfile}
                  onDragMoveSpy={handleMoveSpy}
                  isDragging={isDragging}
                  onDragStateChange={setIsDragging}
                  onHoverProfileChange={setHoveredProfileId}
                />

                {spyProfile ? (
                  <button
                    onClick={() => navigate(`/profile/${spyProfile.id}`)}
                    className="min-w-0 flex-1 rounded-2xl border border-primary-foreground/25 bg-primary-foreground/10 p-3.5 text-start"
                  >
                    <span className="text-primary-foreground/75 font-bold uppercase tracking-wider block" style={{ fontSize: "0.5625rem" }}>
                      🔒 Aktuell im Fokus
                    </span>
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <InstagramAvatar
                        src={spyProfile.avatar_url}
                        alt={spyProfile.username}
                        fallbackInitials={spyProfile.username}
                        size={44}
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-primary-foreground truncate" style={{ fontSize: "0.9375rem" }}>
                          @{spyProfile.username}
                        </p>
                        {(followerCount != null || followingCount != null) && (
                          <p className="text-primary-foreground/70 mt-0.5" style={{ fontSize: "0.6875rem" }}>
                            {followerCount != null && (
                              <>
                                <span className="font-semibold text-primary-foreground">{formatCount(followerCount)}</span> Follower
                              </>
                            )}
                            {followerCount != null && followingCount != null && (
                              <span className="text-primary-foreground/40"> · </span>
                            )}
                            {followingCount != null && (
                              <>
                                <span className="font-semibold text-primary-foreground">{formatCount(followingCount)}</span> Following
                              </>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="min-w-0 flex-1 rounded-2xl border border-primary-foreground/25 bg-primary-foreground/10 p-3.5">
                    <p className="font-bold text-primary-foreground" style={{ fontSize: "0.875rem" }}>
                      {t("spy.assign_your_spy")}
                    </p>
                    <p className="text-primary-foreground/70 mt-1" style={{ fontSize: "0.75rem" }}>
                      {t("spy.spy_description")}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => { haptic.light(); showPaywall("spy_agent"); }}
                className="w-full rounded-2xl p-3.5 flex items-center gap-3 border border-primary-foreground/25 bg-primary-foreground/10"
              >
                <div className="rounded-full p-2 border border-primary-foreground/30 bg-primary-foreground/10">
                  <Lock className="h-5 w-5 text-primary-foreground/85" />
                </div>
                <div className="text-start">
                  <p className="font-semibold text-primary-foreground" style={{ fontSize: "0.875rem" }}>
                    {t("paywall.unlock_spy_agent", "Spy Agent freischalten")}
                  </p>
                  <p className="text-primary-foreground/70 mt-0.5" style={{ fontSize: "0.75rem" }}>
                    {t("spy.spy_description")}
                  </p>
                </div>
              </button>
            )}
          </div>

          {profiles.length > 0 && (
            <p className="text-primary-foreground/65 mt-3 text-center" style={{ fontSize: "0.75rem" }}>
              {profiles.length} {profiles.length === 1 ? "Account" : "Accounts"}
              {spyProfile?.last_scanned_at && (
                <>
                  {" "}· Letzter Scan: {new Date(spyProfile.last_scanned_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                </>
              )}
            </p>
          )}
        </div>

        {/* curved bottom */}
        <div className="absolute bottom-0 left-0 w-full leading-[0]">
          <svg viewBox="0 0 500 38" preserveAspectRatio="none" className="block w-full h-[38px]">
            <path d="M0,0 C170,36 330,36 500,0 L500,38 L0,38 Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </div>

      {/* Unfollow hint banner */}
      {spyProfile && (spyProfile.pending_unfollow_hint ?? 0) > 0 && (
        <div className="px-5 mt-3">
          <button
            onClick={() => navigate(`/profile/${spyProfile.id}`)}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-destructive/20"
            style={{ background: "hsl(var(--destructive) / 0.08)" }}
          >
            <span>⚠️</span>
            <span className="flex-1 text-start font-semibold text-foreground" style={{ fontSize: "0.8125rem" }}>
              ~{spyProfile.pending_unfollow_hint} {t("spy.unfollows_detected")}
            </span>
            <span className="text-primary font-semibold" style={{ fontSize: "0.8125rem" }}>
              🔍 {t("spy.reveal_now")}
            </span>
          </button>
        </div>
      )}

      {/* Accounts section */}
      {profiles.length > 0 && (
        <div className="px-5 mt-5 pb-3 space-y-4">
          <div className="px-1 mb-1 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-bold text-foreground" style={{ fontSize: "1.125rem" }}>
                {t("spy.your_accounts", "Deine Accounts")}
              </p>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.8125rem" }}>
                {t("spy.daily_scan_subtitle", "Täglicher Basis-Scan")}
              </p>
            </div>
          </div>

          {profiles.map((profile, i) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              profileId={profile.id}
              hasSpy={profile.has_spy === true}
              onTap={handleProfileTap}
              onAssignSpy={handleMoveSpy}
              index={i}
              isDragging={isDragging}
              isHovered={hoveredProfileId === profile.id}
            />
          ))}

          <button
            onClick={() => navigate("/add-profile")}
            className="w-full py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 min-h-[44px] text-muted-foreground bg-card border border-border"
            style={{ fontSize: "0.875rem" }}
          >
            <Plus className="h-4 w-4" /> {t("nav.add")} ({profiles.length}/{isPro ? 5 : 1})
          </button>
        </div>
      )}

      {!profilesLoading && profiles.length === 0 && (
        <div className="text-center py-20 px-5">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <p className="font-semibold text-foreground" style={{ fontSize: "0.9375rem" }}>{t("dashboard.no_profiles")}</p>
            <p className="text-muted-foreground mt-1 mb-6" style={{ fontSize: "0.8125rem" }}>{t("dashboard.add_first")}</p>
            <button
              onClick={() => navigate("/add-profile")}
              className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl min-h-[44px]"
              style={{ fontSize: "0.9375rem" }}
            >
              <Plus className="h-4 w-4 inline me-2" />
              {t("nav.add")}
            </button>
          </motion.div>
        </div>
      )}

      <div className="pb-24" />
    </div>
  );
};

export default Dashboard;
