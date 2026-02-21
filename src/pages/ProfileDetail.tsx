import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Loader2, RefreshCw, Users, UserPlus, Activity } from "lucide-react";
import { useTrackedProfiles, useFollowEvents, useDeleteTrackedProfile } from "@/hooks/useTrackedProfiles";
import { useProfileFollowings } from "@/hooks/useProfileFollowings";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SuspicionMeter } from "@/components/SuspicionMeter";
import { analyzeSuspicion } from "@/lib/suspicionAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Nie";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Gerade eben";
  if (mins < 60) return `vor ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours}h`;
  return `vor ${Math.floor(hours / 24)}d`;
}

type DetailTab = "follows" | "unfollows" | "activity";

const TAB_CONFIG: { key: DetailTab; icon: typeof UserPlus; label: string }[] = [
  { key: "follows", icon: UserPlus, label: "Follows" },
  { key: "unfollows", icon: Users, label: "Unfollows" },
  { key: "activity", icon: Activity, label: "Aktivität" },
];

const ProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DetailTab>("follows");
  const [isScanning, setIsScanning] = useState(false);

  const { data: profiles = [], isLoading: profilesLoading } = useTrackedProfiles();
  const { data: events = [], isLoading: eventsLoading } = useFollowEvents(id);
  const { data: followings = [] } = useProfileFollowings(id);
  const deleteProfile = useDeleteTrackedProfile();

  const profile = profiles.find((p) => p.id === id);
  const follows = events.filter((e) => e.event_type === "follow");
  const unfollows = events.filter((e) => e.event_type === "unfollow");

  const isLoading = profilesLoading || eventsLoading;

  // Smart suspicion analysis
  const suspicionAnalysis = analyzeSuspicion(
    events,
    followings,
    profile?.follower_count ?? 0,
    profile?.following_count ?? 0,
  );

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("scan-profiles", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (res.error) throw res.error;
      toast.success("Scan abgeschlossen! 👀");
      queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
      queryClient.invalidateQueries({ queryKey: ["follow_events"] });
      queryClient.invalidateQueries({ queryKey: ["profile_followings"] });
    } catch (err) {
      toast.error("Scan fehlgeschlagen: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsScanning(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    deleteProfile.mutate(id, {
      onSuccess: () => navigate("/dashboard", { replace: true }),
    });
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
        <p className="text-muted-foreground text-sm">Profil nicht gefunden</p>
      </div>
    );
  }

  const displayEvents =
    activeTab === "follows" ? follows : activeTab === "unfollows" ? unfollows : events;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2 text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-base font-extrabold">
          Track<span className="text-primary">IQ</span>
        </span>
        <button onClick={handleDelete} className="p-2 -mr-2 text-destructive">
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-4"
      >
        <div className="ios-card flex items-center gap-4">
          <div className="avatar-ring flex-shrink-0 p-[3px]">
            <InstagramAvatar
              src={profile.avatar_url}
              alt={profile.username}
              fallbackInitials={profile.username}
              size={64}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-foreground">@{profile.username}</h2>
            {profile.display_name && (
              <p className="text-[12px] text-muted-foreground font-medium">{profile.display_name}</p>
            )}
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Tracking seit {new Date(profile.created_at).toLocaleDateString("de-DE")}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Aktualisiert {timeAgo(profile.last_scanned_at || profile.updated_at)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 grid grid-cols-3 gap-2.5 mb-4"
      >
        <div className="stat-box-blue">
          <p className="text-xl font-extrabold">{(profile.follower_count ?? 0).toLocaleString()}</p>
          <p className="text-[10px] font-medium opacity-70">Follower</p>
        </div>
        <div className="stat-box-purple">
          <p className="text-xl font-extrabold">{(profile.following_count ?? 0).toLocaleString()}</p>
          <p className="text-[10px] font-medium opacity-70">Following</p>
        </div>
        <div className="stat-box rounded-xl px-3 py-2 text-center" style={{ background: "hsl(330 100% 95%)", color: "hsl(330 100% 40%)" }}>
          <p className="text-xl font-extrabold">{events.length}</p>
          <p className="text-[10px] font-medium opacity-70">Events</p>
        </div>
      </motion.div>

      {/* Scan Button */}
      <div className="px-5 mb-4">
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="w-full pill-btn-primary py-3 justify-center text-[13px] disabled:opacity-50"
        >
          {isScanning ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</>
          ) : (
            <><RefreshCw className="h-4 w-4" /> Jetzt scannen</>
          )}
        </button>
      </div>

      {/* Suspicion Meter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 mb-5"
      >
        <SuspicionMeter analysis={suspicionAnalysis} />
      </motion.div>

      {/* Tabs & Event List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-5"
      >
        <div className="flex gap-0 border-b border-border mb-4">
          {TAB_CONFIG.map((tab) => {
            const count = tab.key === "follows" ? follows.length : tab.key === "unfollows" ? unfollows.length : events.length;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-1.5 px-3 pb-2.5 text-[12px] font-semibold transition-colors ${
                  activeTab === tab.key ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label} ({count})
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="profile-tab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-1">
          {displayEvents.length > 0 ? (
            displayEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 py-2.5 px-1"
              >
                <InstagramAvatar
                  src={event.target_avatar_url}
                  alt={event.target_username}
                  fallbackInitials={event.target_username}
                  size={40}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground">@{event.target_username}</p>
                  {event.target_display_name && (
                    <p className="text-[11px] text-muted-foreground">{event.target_display_name}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">{timeAgo(event.detected_at)}</p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                    event.event_type === "follow"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {event.event_type === "follow" ? "Follow" : "Unfollow"}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">🔍</span>
              <p className="text-[13px] text-muted-foreground">Noch keine Events</p>
              <p className="text-[11px] text-muted-foreground mt-1">Starte einen Scan um Aktivität zu erkennen</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileDetail;
