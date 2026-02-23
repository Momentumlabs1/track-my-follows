import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Loader2, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { useTrackedProfiles, useFollowEvents, useDeleteTrackedProfile } from "@/hooks/useTrackedProfiles";
import { useProfileFollowings } from "@/hooks/useProfileFollowings";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SuspicionMeter } from "@/components/SuspicionMeter";
import { analyzeSuspicion } from "@/lib/suspicionAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

function useTimeAgo() {
  const { t } = useTranslation();
  return (dateStr: string | null): string => {
    if (!dateStr) return t("dashboard.never_scanned");
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("dashboard.just_now");
    if (mins < 60) return t("dashboard.minutes_ago", { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("dashboard.hours_ago", { count: hours });
    return t("dashboard.days_ago", { count: Math.floor(hours / 24) });
  };
}

type DetailTab = "neu" | "weg";

const ProfileDetail = () => {
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DetailTab>("neu");
  const [isScanning, setIsScanning] = useState(false);

  const { data: profiles = [], isLoading: profilesLoading } = useTrackedProfiles();
  const { data: events = [], isLoading: eventsLoading } = useFollowEvents(id);
  const { data: followings = [] } = useProfileFollowings(id);
  const deleteProfile = useDeleteTrackedProfile();

  const profile = profiles.find((p) => p.id === id);
  const isLoading = profilesLoading || eventsLoading;

  const suspicionAnalysis = analyzeSuspicion(
    events, followings, profile?.follower_count ?? 0, profile?.following_count ?? 0,
  );

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("trigger-scan", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: { profileId: id },
      });
      if (res.error) throw res.error;
      const resData = res.data as { results?: Array<{ error?: string }> };
      if (resData?.results?.[0]?.error) {
        toast.error(t("profile_detail.scan_error", { error: resData.results[0].error }));
      } else {
        toast.success(t("profile_detail.scan_complete"));
      }
      queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
      queryClient.invalidateQueries({ queryKey: ["follow_events"] });
      queryClient.invalidateQueries({ queryKey: ["profile_followings"] });
    } catch (err) {
      toast.error(t("profile_detail.scan_failed", { error: err instanceof Error ? err.message : String(err) }));
    } finally {
      setIsScanning(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    deleteProfile.mutate(id, { onSuccess: () => navigate("/dashboard", { replace: true }) });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <span className="text-5xl mb-4">🥲</span>
        <p className="text-muted-foreground text-sm">{t("profile_detail.not_found")}</p>
      </div>
    );
  }

  const neuEvents = events.filter((e) => e.event_type === "follow").sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
  const wegEvents = events.filter((e) => e.event_type === "unfollow").sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
  const displayEvents = activeTab === "neu" ? neuEvents : wegEvents;

  const followerDelta = (profile as Record<string, unknown>).previous_follower_count != null
    ? (profile.follower_count ?? 0) - ((profile as Record<string, unknown>).previous_follower_count as number) : null;
  const followingDelta = (profile as Record<string, unknown>).previous_following_count != null
    ? (profile.following_count ?? 0) - ((profile as Record<string, unknown>).previous_following_count as number) : null;

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <button onClick={() => navigate("/dashboard")} className="p-2 -ms-2 text-foreground">
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </button>
        <span className="text-base font-extrabold">Spy-<span className="text-primary">Secret</span></span>
        <button onClick={handleDelete} className="p-2 -me-2 text-destructive">
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5 py-4">
        <div className="ios-card flex items-center gap-4">
          <div className="avatar-ring flex-shrink-0 p-[3px]">
            <InstagramAvatar src={profile.avatar_url} alt={profile.username} fallbackInitials={profile.username} size={64} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-foreground">@{profile.username}</h2>
            {profile.display_name && <p className="text-[12px] text-muted-foreground font-medium">{profile.display_name}</p>}
            <p className="text-[11px] text-muted-foreground mt-0.5">{t("profile_detail.tracking_since", { date: new Date(profile.created_at).toLocaleDateString() })}</p>
            <p className="text-[11px] text-muted-foreground">{timeAgo(profile.last_scanned_at || profile.updated_at)}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="px-5 grid grid-cols-3 gap-2.5 mb-4">
        <div className="stat-box-blue">
          <div className="flex items-baseline justify-center gap-1">
            <p className="text-xl font-extrabold">{(profile.follower_count ?? 0).toLocaleString()}</p>
            {followerDelta !== null && followerDelta !== 0 && (
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${followerDelta > 0 ? "text-emerald-600" : "text-red-500"}`}>
                {followerDelta > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {followerDelta > 0 ? `+${followerDelta}` : followerDelta}
              </span>
            )}
          </div>
          <p className="text-[10px] font-medium opacity-70">{t("dashboard.followers")}</p>
        </div>
        <div className="stat-box-purple">
          <div className="flex items-baseline justify-center gap-1">
            <p className="text-xl font-extrabold">{(profile.following_count ?? 0).toLocaleString()}</p>
            {followingDelta !== null && followingDelta !== 0 && (
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${followingDelta > 0 ? "text-emerald-600" : "text-red-500"}`}>
                {followingDelta > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {followingDelta > 0 ? `+${followingDelta}` : followingDelta}
              </span>
            )}
          </div>
          <p className="text-[10px] font-medium opacity-70">{t("dashboard.following")}</p>
        </div>
        <div className="stat-box rounded-xl px-3 py-2 text-center" style={{ background: "hsl(330 100% 95%)", color: "hsl(330 100% 40%)" }}>
          <p className="text-xl font-extrabold">{events.length}</p>
          <p className="text-[10px] font-medium opacity-70">{t("profile_detail.events")}</p>
        </div>
      </motion.div>

      <div className="px-5 mb-4">
        <button onClick={handleScan} disabled={isScanning} className="w-full pill-btn-primary py-3 justify-center text-[13px] disabled:opacity-50">
          {isScanning ? (<><Loader2 className="h-4 w-4 animate-spin" /> {t("profile_detail.scanning")}</>) : (<><RefreshCw className="h-4 w-4" /> {t("profile_detail.scan_now")}</>)}
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="px-5 mb-5">
        <SuspicionMeter analysis={suspicionAnalysis} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="px-5">
        <div className="flex gap-0 border-b border-border mb-4">
          <button
            onClick={() => setActiveTab("neu")}
            className={`relative flex items-center gap-1.5 px-4 pb-2.5 text-[13px] font-semibold transition-colors ${activeTab === "neu" ? "text-emerald-600" : "text-muted-foreground"}`}
          >
            🟢 {t("profile_detail.tab_new")} ({neuEvents.length})
            {activeTab === "neu" && <motion.div layoutId="profile-tab" className="absolute bottom-0 start-0 end-0 h-[2px] bg-emerald-500 rounded-full" transition={{ type: "spring", bounce: 0.15, duration: 0.4 }} />}
          </button>
          <button
            onClick={() => setActiveTab("weg")}
            className={`relative flex items-center gap-1.5 px-4 pb-2.5 text-[13px] font-semibold transition-colors ${activeTab === "weg" ? "text-red-500" : "text-muted-foreground"}`}
          >
            🔴 {t("profile_detail.tab_gone")} ({wegEvents.length})
            {activeTab === "weg" && <motion.div layoutId="profile-tab" className="absolute bottom-0 start-0 end-0 h-[2px] bg-red-500 rounded-full" transition={{ type: "spring", bounce: 0.15, duration: 0.4 }} />}
          </button>
        </div>

        <div className="space-y-1">
          {displayEvents.length > 0 ? displayEvents.map((event, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3 py-2.5 px-1">
              <InstagramAvatar src={event.target_avatar_url} alt={event.target_username} fallbackInitials={event.target_username} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground">@{event.target_username}</p>
                {event.target_display_name && <p className="text-[11px] text-muted-foreground">{event.target_display_name}</p>}
                <p className="text-[10px] text-muted-foreground">{timeAgo(event.detected_at)}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                activeTab === "neu"
                  ? (event.direction === "follower" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600")
                  : (event.direction === "follower" ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600")
              }`}>
                {activeTab === "neu"
                  ? (event.direction === "follower" ? t("profile_detail.new_follower") : t("profile_detail.new_following"))
                  : (event.direction === "follower" ? t("profile_detail.lost_follower") : t("profile_detail.unfollowed"))}
              </span>
            </motion.div>
          )) : (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">{activeTab === "neu" ? "✨" : "🔍"}</span>
              <p className="text-[13px] text-muted-foreground">{activeTab === "neu" ? t("profile_detail.no_new_events") : t("profile_detail.no_gone_events")}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{profile.last_scanned_at ? t("profile_detail.will_update") : t("profile_detail.start_scan")}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileDetail;
