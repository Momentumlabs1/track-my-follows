import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Builds a username → fresh avatar_url map from profile_followings + profile_followers.
 * These tables are updated on every scan, so their URLs are always current.
 * Used to override stale/expired CDN URLs stored in follow_events / follower_events.
 */
export function useFreshAvatarMap() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["fresh_avatars", user?.id],
    queryFn: async () => {
      const map = new Map<string, string>();

      // Fresh following avatars
      const { data: followings } = await supabase
        .from("profile_followings")
        .select("following_username, following_avatar_url")
        .eq("is_current", true)
        .not("following_avatar_url", "is", null);

      if (followings) {
        for (const f of followings) {
          if (f.following_avatar_url) {
            map.set(f.following_username, f.following_avatar_url);
          }
        }
      }

      // Fresh follower avatars
      const { data: followers } = await supabase
        .from("profile_followers")
        .select("follower_username, follower_avatar_url")
        .eq("is_current", true)
        .not("follower_avatar_url", "is", null);

      if (followers) {
        for (const f of followers) {
          if (f.follower_avatar_url) {
            map.set(f.follower_username, f.follower_avatar_url);
          }
        }
      }

      return map;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
