import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FollowerEvent {
  id: string;
  profile_id: string;
  instagram_user_id: string;
  username: string;
  full_name: string | null;
  profile_pic_url: string | null;
  is_verified: boolean;
  follower_count: number | null;
  event_type: string; // 'gained' | 'lost'
  detected_at: string;
  is_read: boolean;
  gender_tag: string | null;
  category: string | null;
}

export function useFollowerEvents(trackedProfileId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["follower_events", user?.id, trackedProfileId],
    queryFn: async () => {
      let query = supabase
        .from("follower_events")
        .select("*")
        .order("detected_at", { ascending: false });
      if (trackedProfileId) {
        query = query.eq("profile_id", trackedProfileId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as FollowerEvent[];
    },
    enabled: !!user,
  });
}
