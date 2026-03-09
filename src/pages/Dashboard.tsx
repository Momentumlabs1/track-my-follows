import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Lock, Users } from "lucide-react";
import { SpyWidget } from "@/components/SpyAgentCard";
import { ProfileCard } from "@/components/ProfileCard";
import { SpyIcon } from "@/components/SpyIcon";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { useTrackedProfiles } from "@/hooks/useTrackedProfiles";
import { useMoveSpy } from "@/hooks/useSpyProfile";
import { useFollowerEvents } from "@/hooks/useFollowerEvents";
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
  const [justAssigned, setJustAssigned] = useState(false);
  const [droppedOnProfileId, setDroppedOnProfileId] = useState<string | null>(null);
  const [showSpyConnected, setShowSpyConnected] = useState(false);
  const [connectedUsername, setConnectedUsername] = useState("");

  const { data: profiles = [], isLoading: profilesLoading } = useTrackedProfiles();
  const moveSpy = useMoveSpy();
  const spyNumber = useMemo(() => {
    if (!user?.id) return "0000";
    let hash = 0;
    for (let i = 0; i < user.id.length; i++) {
      hash = ((hash << 5) - hash) + user.id.charCodeAt(i);
      hash |= 0;
    }
    return String(Math.abs(hash) % 10000).padStart(4, "0");
  }, [user?.id]);
  const spyProfile = profiles.find((p) => p.has_spy === true) || null;
  const isPro = plan === "pro";

  const handleProfileTap = useCallback((profileId: string) => navigate(`/profile/${profileId}`), [navigate]);
  const handleMoveSpy = useCallback((profileId: string) => {
    setJustAssigned(true);
    setDroppedOnProfileId(profileId);
    const targetProfile = profiles.find((profile) => profile.id === profileId);
    if (targetProfile) setConnectedUsername(targetProfile.username);
    setShowSpyConnected(true);
    moveSpy.mutate(profileId, {
      onSuccess: () => {
        if (targetProfile) toast.success(`Tracking aktiv für @${targetProfile.username} 🕵️`);
        try { navigator.vibrate?.(50); } catch {}
        setTimeout(() => setJustAssigned(false), 600);
        setTimeout(() => setDroppedOnProfileId(null), 800);
        setTimeout(() => setShowSpyConnected(false), 1800);
      },
      onError: () => { setJustAssigned(false); setDroppedOnProfileId(null); setShowSpyConnected(false); },
    });
  }, [moveSpy, profiles]);

  const { data: followerEvents = [] } = useFollowerEvents(spyProfile?.id);
  const recentEvents = useMemo(() => {
    const nonInitial = followerEvents.filter((e) => !e.is_initial);
    const gained = nonInitial.filter((e) => e.event_type === "gained").length;
    const lost = nonInitial.filter((e) => e.event_type === "lost").length;
    const avatars = nonInitial.slice(0, 4);
    return { gained, lost, avatars, total: nonInitial.length };
  }, [followerEvents]);

  return (
    <div className="min-h-screen bg-background">
      <WelcomeDialog />

      {/* ═══ HEADER ═══ */}
      <div className="relative z-20 gradient-pink" style={{ overflow: "visible" }}>
        {/* Top bar */}
        <div className="px-6 pt-[calc(env(safe-area-inset-top)+16px)] pb-2 flex items-center justify-between">
          <span className="text-primary-foreground/60 font-bold tracking-wider uppercase" style={{ fontSize: "0.625rem" }}>
            Spy-Secret
          </span>
          {profiles.length > 0 && (
            <span className="text-primary-foreground/50" style={{ fontSize: "0.625rem" }}>
              {profiles.length} {profiles.length === 1 ? "Account" : "Accounts"}
            </span>
          )}
        </div>
        {/* Greeting */}
        <div className="px-6 pb-2">
          <motion.h1 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
            className="font-bold text-primary-foreground" style={{ fontSize: "1.75rem", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Willkommen zurück
          </motion.h1>
          <p className="text-primary-foreground/80 font-mono font-bold mt-1" style={{ fontSize: "0.875rem", letterSpacing: "0.05em" }}>
            Spy-{spyNumber}
          </p>
          <p className="text-primary-foreground/55 mt-1" style={{ fontSize: "0.8125rem" }}>
            {t("dashboard.greeting_subtitle", "Dein Spion ist aktiv – hier ist dein Überblick.")}
          </p>
        </div>

        {/* ─── Spy Agent Zone ─── */}
        <div className="px-5 pt-4 pb-12" style={{ position: "relative", zIndex: 10 }}>
          <span className="text-primary-foreground/40 font-bold uppercase tracking-widest block mb-2 px-1" style={{ fontSize: "0.5625rem", letterSpacing: "0.12em" }}>
            {t("spy.agent_zone", "🕵️ Dein Spion")}
          </span>
          {isPro ? (
            <div className="relative rounded-[1.75rem]" style={{ background: "linear-gradient(135deg, hsl(340 30% 12%), hsl(340 40% 18%))", boxShadow: "0 6px 24px -6px rgba(0,0,0,0.2)", overflow: "visible" }}>
              {/* Scan-line effect on full dark bg */}
              <div
                className="absolute inset-0 rounded-[1.75rem] pointer-events-none opacity-[0.06]"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.15) 3px, rgba(255,255,255,0.15) 4px)",
                }}
              />

              {/* LEFT — Light profile area with border from dark bg */}
              <div
                className="absolute inset-y-2 left-2 rounded-[1.25rem]"
                style={{ width: "62%", background: "rgba(255,240,245,0.95)", boxShadow: "0 2px 12px -4px rgba(0,0,0,0.15)" }}
              />

              {/* ═══ "Spy Connected" overlay animation ═══ */}
              <AnimatePresence>
                {showSpyConnected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 z-30 rounded-[1.75rem] flex flex-col items-center justify-center overflow-hidden"
                    style={{ background: "linear-gradient(135deg, hsl(340 40% 14%), hsl(340 50% 22%))" }}
                  >
                    {/* Radial pulse */}
                    <motion.div
                      className="absolute inset-0 rounded-[1.75rem]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.3] }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.5), transparent 70%)" }}
                    />
                    {/* Spy icon bounce */}
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: [0, 1.3, 1], rotate: [-30, 10, 0] }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <SpyIcon size={40} glow />
                    </motion.div>
                    {/* Connection line */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "60%" }}
                      transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
                      className="h-[2px] mt-2 rounded-full"
                      style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)" }}
                    />
                    {/* Text */}
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                      className="text-primary-foreground font-bold mt-2 text-center"
                      style={{ fontSize: "0.75rem" }}
                    >
                      🕵️ Spion verbunden mit @{connectedUsername}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Content layer */}
              <div className="relative z-10 flex items-center px-2 py-2 gap-1">
                {/* Profile side (left, 60%) */}
                <motion.div
                  className="rounded-[1.25rem] px-3 py-2.5"
                  style={{ width: "65%", background: "rgba(255,240,245,0.95)" }}
                  animate={{
                    opacity: isDragging ? 0.3 : 1,
                    filter: isDragging ? "grayscale(1)" : "grayscale(0)",
                  }}
                  transition={{ duration: 0.2 }}
                >
                    <AnimatePresence mode="wait">
                      {spyProfile ? (
                        <motion.button
                          key={spyProfile.id}
                          initial={justAssigned ? { opacity: 0, y: 30, scale: 0.95 } : false}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          onClick={() => navigate(`/profile/${spyProfile.id}`)}
                          className="w-full text-start"
                        >
                          <div className="flex items-center gap-3">
                            <InstagramAvatar
                              src={spyProfile.avatar_url}
                              alt={spyProfile.username}
                              fallbackInitials={spyProfile.username}
                              size={54}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-extrabold text-foreground truncate" style={{ fontSize: "1.125rem", letterSpacing: "-0.02em" }}>
                                @{spyProfile.username}
                              </p>
                              {spyProfile.follower_count != null && (
                                <p className="text-muted-foreground/70 mt-0.5" style={{ fontSize: "0.75rem" }}>
                                  {formatCount(spyProfile.follower_count)} Follower
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.button>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <p className="font-bold text-foreground" style={{ fontSize: "0.875rem" }}>
                          {t("spy.assign_your_spy")}
                        </p>
                        <p className="text-muted-foreground mt-1" style={{ fontSize: "0.75rem" }}>
                          {t("spy.spy_description")}
                        </p>
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Spy side (right, 40%) */}
                  <div className="flex flex-col items-center justify-center" style={{ width: "35%" }}>
                    <SpyWidget
                      spyProfile={spyProfile}
                      onDragMoveSpy={handleMoveSpy}
                      isDragging={isDragging}
                      onDragStateChange={setIsDragging}
                      onHoverProfileChange={setHoveredProfileId}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { haptic.light(); showPaywall("spy_agent"); }}
              className="w-full relative rounded-[1.75rem] overflow-hidden min-h-[100px] flex items-center gap-3 p-4"
              style={{ background: "linear-gradient(135deg, hsl(340 30% 12%), hsl(340 40% 22%))", boxShadow: "0 8px 32px -8px rgba(0,0,0,0.25)" }}
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

        {/* curved bottom — clipped independently */}
        <div className="absolute bottom-0 left-0 w-full leading-[0] overflow-hidden" style={{ zIndex: 1 }}>
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

      {/* Accounts section — lower z-index so dragged icon floats above */}
      {profiles.length > 0 && (
        <div className="relative z-10 px-5 mt-5 pb-3 space-y-4">
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
              isDropped={droppedOnProfileId === profile.id}
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
