import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTrackedProfiles } from "@/hooks/useTrackedProfiles";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function useSpyProfile() {
  const { data: profiles = [] } = useTrackedProfiles();
  const spyProfile = profiles.find((p) => p.has_spy === true) || null;
  return { spyProfile, profiles };
}

export function useMoveSpy() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (newProfileId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.rpc("move_spy", {
        p_user_id: user.id,
        p_new_profile_id: newProfileId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
      toast.success(t("spy.spy_moved", "🕵️ Spy verschoben!"));
    },
    onError: (error: Error) => {
      toast.error(t("toast.error") + error.message);
    },
  });
}
