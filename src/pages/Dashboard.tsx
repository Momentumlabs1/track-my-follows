import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Lock } from "lucide-react";
import { SpyAgentCard } from "@/components/SpyAgentCard";
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

// Unified event type for the feed (exported for FeedPage)
export interface UnifiedFeedEvent {
  id: string;
  tracked_profile_id: string;
  detected_at: string;
  is_read: boolean;
  source: "follow" | "follower";
  event_type: string;
  target_username?: string;
  target_avatar_url?: string | null;
  target_display_name?: string | null;
  target_follower_count?: number | null;
  target_is_private?: boolean | null;
  direction?: string;
  gender_tag?: string | null;
  is_mutual?: boolean | null;
  category?: string | null;
  username?: string;
  full_name?: string | null;
  profile_pic_url?: string | null;
  follower_count?: number | null;
  is_verified?: boolean;
  is_initial?: boolean;
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

  const handleProfileTap = useCallback((profileId: string) => {
    navigate(`/profile/${profileId}`);
  }, [navigate]);

  const handleMoveSpy = useCallback((profileId: string) => {
    moveSpy.mutate(profileId, {
      onSuccess: () => {
        const newProfile = profiles.find(p => p.id === profileId);
        if (newProfile) {
          toast.success(`Spion überwacht jetzt @${newProfile.username} 🕵️`);
        }
        try { navigator.vibrate?.(50); } catch {}
      }
    });
  }, [moveSpy, profiles]);

  return (
    <div className="min-h-screen bg-background">
      <WelcomeDialog />
      
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <img src={logoSquare} alt="Spy-Secret" className="h-9 w-9 drop-shadow-md" />
            <span className="font-extrabold text-foreground" style={{ fontSize: '1.125rem' }}>
              Spy<span className="text-primary">Secret</span>
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="font-extrabold text-foreground" style={{ fontSize: '1.75rem', letterSpacing: '-0.02em' }}>Hey {displayName}!</h1>
          {profiles.length > 0 && (
            <p className="text-muted-foreground mt-1" style={{ fontSize: '1rem' }}>
              {t("simple.tracking_count", { count: profiles.length })}
            </p>
          )}
        </motion.div>
      </div>

      {/* SPY AGENT CARD */}
      {isPro ? (
        <SpyAgentCard
          spyProfile={spyProfile}
          onDragMoveSpy={handleMoveSpy}
          isDragging={isDragging}
          onDragStateChange={setIsDragging}
          onHoverProfileChange={setHoveredProfileId}
        />
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.15 }} className="mx-5 mb-5">
          <button onClick={() => { haptic.light(); showPaywall("spy_agent"); }} className="w-full text-start relative overflow-hidden rounded-2xl">
            <div className="native-card p-5 opacity-30 blur-[2px] pointer-events-none select-none">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="section-header">{t("spy.spy_watching")}</span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 w-24 rounded bg-muted mb-1" />
                  <div className="h-3 w-32 rounded bg-muted/60" />
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl">
              <div className="flex items-center gap-3">
                <SpyIcon size={48} />
                <div>
                  <p className="font-bold text-foreground flex items-center gap-1.5" style={{ fontSize: '1rem' }}>
                    <Lock className="h-4 w-4 text-primary" />
                    {t("paywall.unlock_spy_agent", "🔒 Spy Agent freischalten")}
                  </p>
                  <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.8125rem' }}>{t("spy.spy_description")}</p>
                </div>
              </div>
            </div>
          </button>
        </motion.div>
      )}

      {/* Profile Cards */}
      {profiles.length > 0 && (
        <div className="px-5 py-4 space-y-4">
          <p className="section-header px-1">{t("spy.your_profiles", "Deine Profile")}</p>
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
            className="w-full py-4 rounded-2xl bg-card text-muted-foreground font-semibold transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            style={{ fontSize: '1rem' }}
          >
            <Plus className="h-5 w-5" /> {t("nav.add")} ({profiles.length}/{isPro ? 5 : 1})
          </button>
        </div>
      )}

      {/* Empty state */}
      {!profilesLoading && profiles.length === 0 && (
        <div className="text-center py-20 px-5">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <img src={logoSquare} alt="" className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="font-semibold text-foreground" style={{ fontSize: '1rem' }}>{t("dashboard.no_profiles")}</p>
            <p className="text-muted-foreground mt-1 mb-8" style={{ fontSize: '0.8125rem' }}>{t("dashboard.add_first")}</p>
            <button onClick={() => navigate("/add-profile")} className="bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-xl min-h-[44px]" style={{ fontSize: '1rem' }}>
              <Plus className="h-5 w-5 inline me-2" /> {t("nav.add")}
            </button>
          </motion.div>
        </div>
      )}

      <div className="pb-24" />
    </div>
  );
};

export default Dashboard;
