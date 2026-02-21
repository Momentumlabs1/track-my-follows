import { motion } from "framer-motion";
import { Eye, EyeOff, TrendingUp, TrendingDown, ChevronRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import type { TrackedProfile } from "@/lib/mockData";

interface ProfileCardProps {
  profile: TrackedProfile;
  index: number;
}

export function ProfileCard({ profile, index }: ProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link to={`/profile/${profile.id}`} className="block group">
        <div className="relative rounded-2xl surface-elevated border border-border/30 p-4 hover:border-primary/25 transition-all duration-300 group-hover:glow-pink overflow-hidden">
          {/* Shimmer on hover */}
          <div className="absolute inset-0 sparkle opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative flex items-center gap-3.5">
            <div className="relative flex-shrink-0">
              <div className="gradient-border rounded-full p-[2px]">
                <img
                  src={profile.profilePicUrl}
                  alt={profile.username}
                  className="h-12 w-12 rounded-full object-cover"
                />
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                  profile.isActive ? "bg-primary" : "bg-muted-foreground"
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
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {profile.followingCount.toLocaleString()} Following
              </p>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="mt-3 flex gap-2">
            {profile.newFollowsToday > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-primary/10 border border-primary/15 px-2.5 py-0.5">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-medium text-primary">
                  +{profile.newFollowsToday} neue 👀
                </span>
              </div>
            )}
            {profile.newUnfollowsToday > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-destructive/10 border border-destructive/15 px-2.5 py-0.5">
                <TrendingDown className="h-3 w-3 text-destructive" />
                <span className="text-[11px] font-medium text-destructive">
                  -{profile.newUnfollowsToday} weg
                </span>
              </div>
            )}
            {profile.newFollowsToday === 0 && profile.newUnfollowsToday === 0 && (
              <span className="text-[11px] text-muted-foreground">Nichts neues heute 😌</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
