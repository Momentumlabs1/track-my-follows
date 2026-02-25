import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { useTranslation } from "react-i18next";
import type { TrackedProfile } from "@/hooks/useTrackedProfiles";

interface MoveSpySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profiles: TrackedProfile[];
  currentSpyId: string | null;
  onMove: (profileId: string) => void;
}

export function MoveSpySheet({ open, onOpenChange, profiles, currentSpyId, onMove }: MoveSpySheetProps) {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-8">
        <SheetHeader className="text-center mb-4">
          <div className="text-3xl mb-1">🕵️</div>
          <SheetTitle className="text-[16px] font-extrabold">{t("spy.move_your_spy")}</SheetTitle>
          <p className="text-[12px] text-muted-foreground">{t("spy.choose_profile_to_watch")}</p>
        </SheetHeader>

        <div className="space-y-2">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => {
                if (profile.id !== currentSpyId) {
                  onMove(profile.id);
                  onOpenChange(false);
                }
              }}
              disabled={profile.id === currentSpyId}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                profile.id === currentSpyId
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              <InstagramAvatar
                src={profile.avatar_url}
                alt={profile.username}
                fallbackInitials={profile.username}
                size={40}
              />
              <div className="flex-1 min-w-0 text-start">
                <p className="text-[13px] font-bold text-foreground">@{profile.username}</p>
                <p className="text-[11px] text-muted-foreground">
                  {profile.id === currentSpyId ? t("spy.currently_watching") : t("spy.tap_to_assign")}
                </p>
              </div>
              {profile.id === currentSpyId && <span className="text-lg">🕵️</span>}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
