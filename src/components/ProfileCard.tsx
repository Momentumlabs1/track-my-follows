import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import type { TrackedProfile } from "@/hooks/useTrackedProfiles";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ProfileCardProps {
  profile: TrackedProfile;
  index: number;
}

export function ProfileCard({ profile, index }: ProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
    >
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
              Updated {timeAgo(profile.last_scanned_at || profile.updated_at)}
            </p>
          </div>
          <Link
            to={`/profile/${profile.id}`}
            className="pill-btn-primary px-4 py-1.5 text-[12px]"
          >
            View
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="stat-box-blue">
            <p className="text-lg font-extrabold">{(profile.follower_count ?? 0).toLocaleString()}</p>
            <p className="text-[10px] font-medium opacity-70">Followers</p>
          </div>
          <div className="stat-box-purple">
            <p className="text-lg font-extrabold">{(profile.following_count ?? 0).toLocaleString()}</p>
            <p className="text-[10px] font-medium opacity-70">Following</p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Tracking since {new Date(profile.created_at).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
}
