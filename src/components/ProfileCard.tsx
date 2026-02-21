import { motion } from "framer-motion";
import { Eye, EyeOff, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { TrackedProfile } from "@/lib/mockData";

interface ProfileCardProps {
  profile: TrackedProfile;
  index: number;
}

export function ProfileCard({ profile, index }: ProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link to={`/profile/${profile.id}`} className="block group">
        <div className="relative rounded-xl surface-elevated border border-border/40 p-4 hover:border-primary/25 transition-all duration-300 group-hover:glow-primary noise overflow-hidden">
          {/* Scan line effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="absolute inset-x-0 h-px gradient-bg opacity-20 animate-scan" />
          </div>

          <div className="relative flex items-center gap-3.5">
            <div className="relative flex-shrink-0">
              <div className="gradient-border rounded-full p-[1px]">
                <img
                  src={profile.profilePicUrl}
                  alt={profile.username}
                  className="h-12 w-12 rounded-full object-cover"
                />
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 ${
                  profile.isActive
                    ? "border-card bg-primary"
                    : "border-card bg-muted-foreground"
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm truncate">@{profile.username}</h3>
                {profile.isPublic ? (
                  <Eye className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                ) : (
                  <EyeOff className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{profile.fullName}</p>
              <p className="text-mono text-[11px] text-muted-foreground mt-0.5">
                {profile.followingCount.toLocaleString()} following
              </p>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="mt-3 flex gap-2">
            {profile.newFollowsToday > 0 && (
              <div className="flex items-center gap-1 rounded-md bg-primary/8 border border-primary/15 px-2 py-0.5">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-mono text-[11px] font-medium text-primary">
                  +{profile.newFollowsToday}
                </span>
              </div>
            )}
            {profile.newUnfollowsToday > 0 && (
              <div className="flex items-center gap-1 rounded-md bg-brand-rose/8 border border-brand-rose/15 px-2 py-0.5">
                <TrendingDown className="h-3 w-3 text-brand-rose" />
                <span className="text-mono text-[11px] font-medium text-brand-rose">
                  -{profile.newUnfollowsToday}
                </span>
              </div>
            )}
            {profile.newFollowsToday === 0 && profile.newUnfollowsToday === 0 && (
              <span className="text-[11px] text-muted-foreground">No changes today</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
