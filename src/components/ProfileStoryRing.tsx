import { Link } from "react-router-dom";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import type { TrackedProfile } from "@/hooks/useTrackedProfiles";

interface ProfileStoryRingProps {
  profile: TrackedProfile;
  hasNewEvents?: boolean;
}

export function ProfileStoryRing({ profile, hasNewEvents = false }: ProfileStoryRingProps) {
  return (
    <Link to={`/profile/${profile.id}`} className="flex flex-col items-center gap-1.5 min-w-[68px]">
      <div className={hasNewEvents ? "avatar-ring" : "avatar-ring-inactive"}>
        <div className="rounded-full bg-background p-[2px]">
          <InstagramAvatar
            src={profile.avatar_url}
            alt={profile.username}
            fallbackInitials={profile.username}
            size={52}
          />
        </div>
      </div>
      <span className="text-[11px] font-medium text-foreground truncate max-w-[68px]">
        {profile.username}
      </span>
    </Link>
  );
}
