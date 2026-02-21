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
        .select("following_display_name, following_username")
        .eq("tracked_profile_id", trackedProfileId!)
        .eq("is_current", true);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!trackedProfileId,
  });
}
