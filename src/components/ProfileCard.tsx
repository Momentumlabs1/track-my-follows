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
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link to={`/profile/${profile.id}`} className="block group">
        <div className="bento-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="avatar-ring">
                <img
                  src={profile.profilePicUrl}
                  alt={profile.username}
                  className="h-12 w-12 rounded-full object-cover"
                />
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${
                  profile.isActive ? "gradient-bg" : "bg-muted-foreground"
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm truncate">@{profile.username}</h3>
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

          <div className="mt-3.5 flex gap-2 relative">
            {profile.newFollowsToday > 0 && (
              <div className="tag-pink">
                <TrendingUp className="h-3 w-3" />
                +{profile.newFollowsToday} neue 👀
              </div>
            )}
            {profile.newUnfollowsToday > 0 && (
              <div className="tag-red">
                <TrendingDown className="h-3 w-3" />
                -{profile.newUnfollowsToday} weg
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
