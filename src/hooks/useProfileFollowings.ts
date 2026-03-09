import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useProfileFollowings(trackedProfileId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile_followings", trackedProfileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_followings")
        .select("following_display_name, following_username, following_avatar_url, gender_tag, first_seen_at")
        .eq("tracked_profile_id", trackedProfileId!)
        .eq("is_current", true);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!trackedProfileId,
  });
}

export function useRecentFollowings(profileId?: string) {
  return useQuery({
    queryKey: ["recent_followings", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_followings")
        .select("following_username, following_avatar_url, first_seen_at")
        .eq("tracked_profile_id", profileId!)
        .eq("is_current", true)
        .order("first_seen_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profileId,
  });
}
