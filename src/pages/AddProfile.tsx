import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Loader2, Search } from "lucide-react";
import { useAddTrackedProfile, useTrackedProfiles, useUserPlan } from "@/hooks/useTrackedProfiles";

const AddProfile = () => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const addProfile = useAddTrackedProfile();
  const { data: profiles = [] } = useTrackedProfiles();
  const { data: userPlan } = useUserPlan();

  const maxProfiles = (userPlan as any)?.subscription_plans?.max_tracked_profiles ?? 5;
  const currentCount = profiles.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    addProfile.mutate(username, {
      onSuccess: (data) => {
        navigate(`/analyzing/${data.id}/${username.trim().toLowerCase()}`);
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-[13px] font-semibold text-primary">
          {currentCount}/{maxProfiles}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-8">
        <h1 className="text-2xl font-extrabold text-foreground leading-tight">
          Who do you want<br />to track?
        </h1>
        <p className="text-[13px] text-muted-foreground mt-2">
          Enter the Instagram username
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          {/* Input */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-base">@</span>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-2xl bg-card border-2 border-primary/30 pl-10 pr-4 py-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
          </div>

          {/* Secure info */}
          <div className="mt-6 flex items-start gap-3 bg-muted rounded-2xl p-4">
            <div className="p-2 bg-card rounded-xl flex-shrink-0">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">Secure & Anonymous</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                We never access your account. The profile must be public.
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!username.trim() || addProfile.isPending}
            className="mt-8 w-full pill-btn-primary py-4 justify-center text-[15px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {addProfile.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                Start The Search
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProfile;
