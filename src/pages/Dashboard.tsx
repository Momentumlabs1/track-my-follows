import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Lock, Users } from "lucide-react";
import { SpyWidget } from "@/components/SpyAgentCard";
import { ProfileCard } from "@/components/ProfileCard";
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

  const { data: profiles = [], isLoading: profilesLoading } = useTrackedProfiles();
  const moveSpy = useMoveSpy();
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const spyProfile = profiles.find((p) => p.has_spy === true) || null;
  const isPro = plan === "pro";

  const handleProfileTap = useCallback((profileId: string) => navigate(`/profile/${profileId}`), [navigate]);
  const handleMoveSpy = useCallback((profileId: string) => {
    setJustAssigned(true);
    moveSpy.mutate(profileId, {
      onSuccess: () => {
        const p = profiles.find((profile) => profile.id === profileId);
        if (p) toast.success(`Spion überwacht jetzt @${p.username} 🕵️`);
        try { navigator.vibrate?.(50); } catch {}
        setTimeout(() => setJustAssigned(false), 600);
      },
      onError: () => setJustAssigned(false),
    });
  }, [moveSpy, profiles]);

  const { data: followings = [] } = useProfileFollowings(spyProfile?.id);
  const genderStats = useMemo(() => {
    if (!followings.length) return null;
    let f = 0, m = 0, u = 0;
    for (const fg of followings) {
      if (fg.gender_tag === "female") f++;
      else if (fg.gender_tag === "male") m++;
      else u++;
    }
    const total = f + m + u;
    return { fPct: Math.round((f / total) * 100), mPct: Math.round((m / total) * 100), uPct: Math.round((u / total) * 100), total };
  }, [followings]);

  return (
    <div className="min-h-screen bg-background">
      <WelcomeDialog />

      {/* ═══ HEADER ═══ */}
      <div className="relative z-20 gradient-pink" style={{ overflow: "visible" }}>
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

        {/* Wave separator */}
        <div className="relative w-full leading-[0] overflow-hidden">
          <svg viewBox="0 0 500 22" preserveAspectRatio="none" className="block w-full h-[22px]">
            <path d="M0,22 C170,0 330,0 500,22 L500,22 L0,22 Z" fill="hsl(var(--primary) / 0.15)" />
          </svg>
        </div>

        {/* Agent zone — overflow visible so drag works */}
        <div className="px-5 pt-3 pb-12" style={{ position: "relative", zIndex: 10 }}>
          <p className="uppercase tracking-[0.12em] text-primary-foreground/70 font-bold px-1 mb-2" style={{ fontSize: "0.625rem" }}>
            {t("spy.your_spy", "Dein Spion")}
          </p>

          {isPro ? (
            <div className="relative rounded-[1.75rem] overflow-hidden min-h-[140px]" style={{ boxShadow: "0 8px 32px -8px rgba(0,0,0,0.25)" }}>
              {/* LEFT — Light profile half */}
              <div
                className="absolute inset-0"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  clipPath: "polygon(0 0, 68% 0, 48% 100%, 0 100%)",
                }}
              />

              {/* RIGHT — Dark Spy half */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(135deg, hsl(340 30% 12%), hsl(340 40% 18%))",
                  clipPath: "polygon(64% 0, 100% 0, 100% 100%, 44% 100%)",
                }}
              />
              {/* Scan-line effect on dark side */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.06]"
                style={{
                  clipPath: "polygon(64% 0, 100% 0, 100% 100%, 44% 100%)",
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.15) 3px, rgba(255,255,255,0.15) 4px)",
                }}
              />

              {/* Diagonal glow line */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, transparent 53%, rgba(0,0,0,0.08) 55%, rgba(0,0,0,0.08) 57%, transparent 59%)",
                }}
              />

              {/* Content layer */}
              <div className="relative z-10 flex items-center p-4 gap-2">
                {/* Profile side (left, 60%) */}
                <motion.div
                  className="min-w-0"
                  style={{ width: "60%" }}
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
                        <span className="text-foreground/50 font-bold uppercase tracking-wider block" style={{ fontSize: "0.5625rem" }}>
                          🔒 Aktuell im Fokus
                        </span>
                        <div className="flex items-center gap-2.5 mt-1.5">
                          <InstagramAvatar
                            src={spyProfile.avatar_url}
                            alt={spyProfile.username}
                            fallbackInitials={spyProfile.username}
                            size={44}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-foreground truncate" style={{ fontSize: "0.9375rem" }}>
                              @{spyProfile.username}
                            </p>
                            {genderStats && genderStats.total > 0 && (
                              <>
                                <div className="flex h-1 w-full rounded-full overflow-hidden mt-1.5">
                                  {genderStats.fPct > 0 && <div style={{ width: `${genderStats.fPct}%` }} className="bg-pink-500" />}
                                  {genderStats.mPct > 0 && <div style={{ width: `${genderStats.mPct}%` }} className="bg-blue-500" />}
                                  {genderStats.uPct > 0 && <div style={{ width: `${genderStats.uPct}%` }} className="bg-muted-foreground/30" />}
                                </div>
                                <p className="text-muted-foreground mt-1" style={{ fontSize: "0.5625rem" }}>
                                  ♀ {genderStats.fPct}% · ♂ {genderStats.mPct}%
                                </p>
                              </>
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
                <div className="flex flex-col items-center justify-center" style={{ width: "40%" }}>
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
