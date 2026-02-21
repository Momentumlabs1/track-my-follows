import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Loader2, RefreshCw } from "lucide-react";
import { useTrackedProfiles, useFollowEvents, useDeleteTrackedProfile } from "@/hooks/useTrackedProfiles";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type DetailTab = "follows" | "followers" | "activity";

const ProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DetailTab>("follows");
  const [isScanning, setIsScanning] = useState(false);

  const { data: profiles = [], isLoading: profilesLoading } = useTrackedProfiles();
  const { data: events = [], isLoading: eventsLoading } = useFollowEvents(id);
  const deleteProfile = useDeleteTrackedProfile();

  const profile = profiles.find((p) => p.id === id);
  const follows = events.filter((e) => e.event_type === "follow");
  const unfollows = events.filter((e) => e.event_type === "unfollow");

  const isLoading = profilesLoading || eventsLoading;

  // Suspicion level
  const followingCount = profile?.following_count ?? 1;
  const recentFollows = follows.length;
  const suspicionPercent = Math.min(100, Math.round((recentFollows / Math.max(followingCount, 1)) * 100));
  const suspicionLabel =
    suspicionPercent <= 20 ? "Very Safe" : suspicionPercent <= 50 ? "Getting Suspicious" : "Very Suspicious";
  const suspicionColor =
    suspicionPercent <= 20
      ? "text-green-600 bg-green-50 border-green-200"
      : suspicionPercent <= 50
      ? "text-yellow-600 bg-yellow-50 border-yellow-200"
      : "text-red-600 bg-red-50 border-red-200";
  const suspicionBarColor =
    suspicionPercent <= 20 ? "bg-green-500" : suspicionPercent <= 50 ? "bg-yellow-500" : "bg-red-500";

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("scan-profiles", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (res.error) throw res.error;
      toast.success("Scan complete! 👀");
      queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
      queryClient.invalidateQueries({ queryKey: ["follow_events"] });
    } catch (err) {
      toast.error("Scan failed: " + (err instanceof Error ? err.message : String(err)));
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
        <p className="text-muted-foreground text-sm">Profile not found</p>
      </div>
    );
  }

  const tabItems = follows; // default
  const displayEvents =
    activeTab === "follows" ? follows : activeTab === "followers" ? unfollows : events;

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

      {/* Profile banner */}
      <div className="px-5 py-4">
        <div className="ios-card flex items-center gap-4">
          <div className="avatar-ring flex-shrink-0 p-[3px]">
            <img
              src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}&background=random`}
              alt={profile.username}
              className="h-16 w-16 rounded-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-foreground">@{profile.username}</h2>
            <p className="text-[11px] text-muted-foreground">
              Tracking since {new Date(profile.created_at).toLocaleDateString()}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Updated {timeAgo(profile.last_scanned_at || profile.updated_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-4">
        <div className="stat-box-blue">
          <p className="text-xl font-extrabold">{(profile.follower_count ?? 0).toLocaleString()}</p>
          <p className="text-[10px] font-medium opacity-70">Followers</p>
        </div>
        <div className="stat-box-purple">
          <p className="text-xl font-extrabold">{(profile.following_count ?? 0).toLocaleString()}</p>
          <p className="text-[10px] font-medium opacity-70">Following</p>
        </div>
      </div>

      {/* Scan button */}
      <div className="px-5 mb-4">
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="w-full pill-btn-primary py-3 justify-center text-[13px] disabled:opacity-50"
        >
          {isScanning ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</>
          ) : (
            <><RefreshCw className="h-4 w-4" /> Scan Now</>
          )}
        </button>
      </div>

      {/* Suspicion Level */}
      <div className="px-5 mb-5">
        <div className={`ios-card border ${suspicionColor}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold">Suspicion Level</span>
            <span className="text-[12px] font-bold">{suspicionPercent}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
            <motion.div
              className={`h-full rounded-full ${suspicionBarColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${suspicionPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-[12px] font-semibold">{suspicionLabel}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5">
        <div className="flex gap-0 border-b border-border mb-4">
          {(["follows", "followers", "activity"] as DetailTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 pb-2.5 text-[12px] font-semibold transition-colors ${
                activeTab === tab ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {tab === "follows" ? `Last follows (${follows.length})` : tab === "followers" ? `Unfollows (${unfollows.length})` : `Activity (${events.length})`}
              {activeTab === tab && (
                <motion.div
                  layoutId="profile-tab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Event list */}
        <div className="space-y-2">
          {displayEvents.length > 0 ? (
            displayEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 py-2">
                <img
                  src={event.target_avatar_url || `https://ui-avatars.com/api/?name=${event.target_username}&background=random`}
                  alt={event.target_username}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground">@{event.target_username}</p>
                  <p className="text-[11px] text-muted-foreground">{timeAgo(event.detected_at)}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  event.event_type === "follow" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                }`}>
                  {event.event_type === "follow" ? "Follow" : "Unfollow"}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">🔍</span>
              <p className="text-[13px] text-muted-foreground">No events yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileDetail;
