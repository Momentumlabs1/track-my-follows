import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Lock } from "lucide-react";
import { SpyWidget } from "@/components/SpyAgentCard";
import { ProfileCard } from "@/components/ProfileCard";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { SpyIcon } from "@/components/SpyIcon";
import { useTrackedProfiles } from "@/hooks/useTrackedProfiles";
import { useMoveSpy } from "@/hooks/useSpyProfile";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { haptic } from "@/lib/native";
import { toast } from "sonner";
import logoSquare from "@/assets/logo-square.png";

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

  return (
    <div className="min-h-screen bg-background">
      <WelcomeDialog />
      
      {/* Zone 1 – Pink Hero with integrated Spy */}
      <div
        className="rounded-b-3xl pb-10"
        style={{
          background: 'linear-gradient(180deg, hsl(347 100% 45%), hsl(347 80% 28%))',
        }}
      >
        <div className="px-6 pt-[calc(env(safe-area-inset-top)+16px)]">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-6">
            <img src={logoSquare} alt="Spy-Secret" className="h-8 w-8" />
            <span className="font-bold text-white" style={{ fontSize: '1.125rem' }}>
              Spy<span className="text-white/80">Secret</span>
            </span>
          </div>

          {/* Greeting */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <h1 className="font-bold text-white" style={{ fontSize: '1.75rem', letterSpacing: '-0.03em' }}>
              Hey {displayName}! ❤️
            </h1>
            {spyProfile && (
              <p className="text-white/70 mt-1" style={{ fontSize: '0.875rem' }}>
                {t("spy.spy_is_active", "Dein Spion ist aktiv.")}
              </p>
            )}
          </motion.div>
        </div>

        {/* Spy Widget – centered in hero */}
        <div className="mt-6">
          {isPro ? (
            <SpyWidget
              spyProfile={spyProfile}
              onDragMoveSpy={handleMoveSpy}
              isDragging={isDragging}
              onDragStateChange={setIsDragging}
              onHoverProfileChange={setHoveredProfileId}
            />
          ) : (
            <div className="flex flex-col items-center py-4">
              <button
                onClick={() => { haptic.light(); showPaywall("spy_agent"); }}
                className="flex flex-col items-center gap-3"
              >
                <div className="relative">
                  <SpyIcon size={80} />
                  <div className="absolute -bottom-1 -right-1 bg-white/20 backdrop-blur-sm rounded-full p-1">
                    <Lock className="h-4 w-4 text-white" />
                  </div>
                </div>
                <p className="text-white/80 font-medium" style={{ fontSize: '0.8125rem' }}>
                  {t("paywall.unlock_spy_agent", "Spy Agent freischalten")}
                </p>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Unfollow hint – outside hero as banner */}
      {spyProfile && (spyProfile.pending_unfollow_hint ?? 0) > 0 && (
        <div className="px-5 mt-4">
          <button
            onClick={() => navigate(`/profile/${spyProfile.id}`)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: 'hsl(347 80% 20% / 0.5)' }}
          >
            <span>⚠️</span>
            <div className="flex-1 text-start">
              <span className="font-semibold text-foreground" style={{ fontSize: '0.8125rem' }}>
                ~{spyProfile.pending_unfollow_hint} {t("spy.unfollows_detected")}
              </span>
            </div>
            <span className="text-primary font-semibold" style={{ fontSize: '0.8125rem' }}>
              🔍 {t("spy.reveal_now")}
            </span>
          </button>
        </div>
      )}

      {/* Zone 3 – Deine Profile */}
      {profiles.length > 0 && (
        <div className="px-5 pt-6 pb-3 space-y-3">
          <p className="section-header px-1">{t("spy.your_profiles", "Deine Profile")}</p>
          {profiles.map((profile, i) => (
            <ProfileCard key={profile.id} profile={profile} profileId={profile.id} hasSpy={profile.has_spy === true}
              onTap={handleProfileTap} onAssignSpy={handleMoveSpy} index={i} isDragging={isDragging} isHovered={hoveredProfileId === profile.id} />
          ))}
          <button onClick={() => navigate("/add-profile")}
            className="w-full py-3 rounded-2xl bg-card text-muted-foreground font-semibold flex items-center justify-center gap-2 min-h-[44px]" style={{ fontSize: '0.875rem' }}>
            <Plus className="h-4 w-4" /> {t("nav.add")} ({profiles.length}/{isPro ? 5 : 1})
          </button>
        </div>
      )}

      {!profilesLoading && profiles.length === 0 && (
        <div className="text-center py-20 px-5">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <img src={logoSquare} alt="" className="h-14 w-14 mx-auto mb-4 opacity-25" />
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
