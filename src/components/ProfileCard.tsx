import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import type { TrackedProfile } from "@/hooks/useTrackedProfiles";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Nie gescannt";
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Gerade eben";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Vor ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Vor ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Vor ${days}d`;
}

function CountDelta({ current, previous, label }: { current: number; previous?: number | null; label: string }) {
  const delta = previous != null ? current - previous : null;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-extrabold">{current.toLocaleString()}</span>
        {delta !== null && delta !== 0 && (
          <span className={`text-[10px] font-bold flex items-center gap-0.5 ${delta > 0 ? "text-emerald-600" : "text-red-500"}`}>
            {delta > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>
      <p className="text-[10px] font-medium opacity-70">{label}</p>
    </div>
  );
}

interface ProfileCardProps {
  profile: TrackedProfile & { previous_follower_count?: number | null; previous_following_count?: number | null };
  index: number;
}

export function ProfileCard({ profile, index }: ProfileCardProps) {
  const [isScanning, setIsScanning] = useState(false);
  const queryClient = useQueryClient();

  const handleQuickScan = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsScanning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("trigger-scan", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: { profileId: profile.id },
      });
      if (res.error) throw res.error;
      const resData = res.data as { results?: Array<{ error?: string }> };
      if (resData?.results?.[0]?.error) {
        toast.error(`Scan-Fehler: ${resData.results[0].error}`);
      } else {
        toast.success("Scan abgeschlossen! 👀");
      }
      queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
      queryClient.invalidateQueries({ queryKey: ["follow_events"] });
    } catch (err) {
      toast.error("Scan fehlgeschlagen: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
    >
      <Link to={`/profile/${profile.id}`} className="block">
        <div className="ios-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="avatar-ring flex-shrink-0">
              <InstagramAvatar
                src={profile.avatar_url}
                alt={profile.username}
                fallbackInitials={profile.username}
                size={44}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-foreground">@{profile.username}</h3>
              <p className="text-[11px] text-muted-foreground">
                {timeAgo(profile.last_scanned_at)}
              </p>
            </div>
            <button
              onClick={handleQuickScan}
              disabled={isScanning}
              className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isScanning ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="stat-box-blue">
              <CountDelta
                current={profile.follower_count ?? 0}
                previous={(profile as Record<string, unknown>).previous_follower_count as number | null | undefined}
                label="Followers"
              />
            </div>
            <div className="stat-box-purple">
              <CountDelta
                current={profile.following_count ?? 0}
                previous={(profile as Record<string, unknown>).previous_following_count as number | null | undefined}
                label="Following"
              />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Tracking seit {new Date(profile.created_at).toLocaleDateString("de-DE")}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
