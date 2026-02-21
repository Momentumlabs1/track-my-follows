import { motion } from "framer-motion";
import { Eye, EyeOff, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import type { TrackedProfile } from "@/lib/mockData";

interface ProfileCardProps {
  profile: TrackedProfile;
  index: number;
}

export function ProfileCard({ profile, index }: ProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Link
        to={`/profile/${profile.id}`}
        className="block group"
      >
        <div className="relative rounded-xl bg-card border border-border/50 p-5 hover:border-primary/30 transition-all duration-300 hover:glow">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="gradient-border rounded-full">
                <img
                  src={profile.profilePicUrl}
                  alt={profile.username}
                  className="h-14 w-14 rounded-full object-cover"
                />
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${
                  profile.isActive ? "bg-emerald-500" : "bg-muted-foreground"
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">@{profile.username}</h3>
                {profile.isPublic ? (
                  <Eye className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{profile.fullName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {profile.followingCount.toLocaleString()} Following
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            {profile.newFollowsToday > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">
                  +{profile.newFollowsToday} Follows
                </span>
              </div>
            )}
            {profile.newUnfollowsToday > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1">
                <TrendingDown className="h-3 w-3 text-destructive" />
                <span className="text-xs font-medium text-destructive">
                  -{profile.newUnfollowsToday} Unfollows
                </span>
              </div>
            )}
            {profile.newFollowsToday === 0 && profile.newUnfollowsToday === 0 && (
              <span className="text-xs text-muted-foreground">Keine Änderungen heute</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
