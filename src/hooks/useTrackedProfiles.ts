import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export type TrackedProfile = Tables<"tracked_profiles">;
export type FollowEvent = Tables<"follow_events"> & {
  tracked_profiles?: { username: string; avatar_url: string | null } | null;
};

export function useTrackedProfiles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tracked_profiles", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracked_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TrackedProfile[];
    },
    enabled: !!user,
  });
}

export function useFollowEvents(trackedProfileId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["follow_events", user?.id, trackedProfileId],
    queryFn: async () => {
      let query = supabase
        .from("follow_events")
        .select("*, tracked_profiles(username, avatar_url)")
        .order("detected_at", { ascending: false });
      if (trackedProfileId) {
        query = query.eq("tracked_profile_id", trackedProfileId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as FollowEvent[];
    },
    enabled: !!user,
  });
}

export function useAddTrackedProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (username: string) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("tracked_profiles")
        .insert({ username: username.toLowerCase().trim(), user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
      toast.success(t("toast.profileTracked"));
    },
    onError: (error: Error) => {
      if (error.message?.includes("row-level security")) {
        toast.error(t("toast.planLimitReached"));
      } else {
        toast.error(t("toast.error") + error.message);
      }
    },
  });
}

export function useDeleteTrackedProfile() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tracked_profiles")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
      queryClient.invalidateQueries({ queryKey: ["follow_events"] });
      toast.success(t("toast.profileRemoved"));
    },
  });
}

export function useUserPlan() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_plan", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, subscription_plans(*)")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
