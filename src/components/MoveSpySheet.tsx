import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { SpyIcon } from "@/components/SpyIcon";
import { useTranslation } from "react-i18next";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { TrackedProfile } from "@/hooks/useTrackedProfiles";

interface MoveSpySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profiles: TrackedProfile[];
  currentSpyId: string | null;
  viewingProfileId?: string | null;
  onMove: (profileId: string) => void;
}

function SwipeableProfileRow({
  profile,
  isCurrent,
  isViewing,
  onMove,
  t,
}: {
  profile: TrackedProfile;
  isCurrent: boolean;
  isViewing: boolean;
  onMove: (id: string) => void;
  t: (key: string) => string;
}) {
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [0, 100], [0, 0.15]);
  const iconOpacity = useTransform(x, [0, 60, 100], [0, 0.3, 1]);
  const iconScale = useTransform(x, [0, 80, 120], [0.5, 0.8, 1]);

  if (isCurrent) {
    return (
      <div className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/30">
        <InstagramAvatar src={profile.avatar_url} alt={profile.username} fallbackInitials={profile.username} size={40} />
        <div className="flex-1 min-w-0 text-start">
          <p className="text-[13px] font-bold text-foreground">@{profile.username}</p>
          <p className="text-[11px] text-muted-foreground">{t("spy.currently_watching")}</p>
        </div>
        <SpyIcon size={28} />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Spy icon reveal on swipe */}
      <motion.div
        className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none"
        style={{ opacity: iconOpacity, scale: iconScale }}
      >
        <SpyIcon size={28} glow />
      </motion.div>

      <motion.button
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.4 }}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 80) {
            onMove(profile.id);
          }
        }}
        onClick={() => onMove(profile.id)}
        className={`relative z-10 w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
          isViewing
            ? "bg-primary/10 border-2 border-primary ring-2 ring-primary/20"
            : "bg-secondary hover:bg-secondary/80"
        }`}
      >
        <InstagramAvatar src={profile.avatar_url} alt={profile.username} fallbackInitials={profile.username} size={40} />
        <div className="flex-1 min-w-0 text-start">
          <p className="text-[13px] font-bold text-foreground">@{profile.username}</p>
          <p className={`text-[11px] ${isViewing ? "text-primary font-semibold" : "text-muted-foreground"}`}>
            {isViewing ? t("spy.move_here") : t("spy.tap_to_assign")}
          </p>
        </div>
        {isViewing && <SpyIcon size={22} className="opacity-40" />}
      </motion.button>

      {/* Green tint overlay on swipe */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-primary pointer-events-none"
        style={{ opacity: bgOpacity }}
      />
    </div>
  );
}

export function MoveSpySheet({ open, onOpenChange, profiles, currentSpyId, viewingProfileId, onMove }: MoveSpySheetProps) {
  const { t } = useTranslation();

  const handleMove = (profileId: string) => {
    if (profileId !== currentSpyId) {
      onMove(profileId);
      onOpenChange(false);
    }
  };

  // Sort: viewing profile first (if not current spy), then rest
  const sortedProfiles = [...profiles].sort((a, b) => {
    if (a.id === currentSpyId) return -1;
    if (b.id === currentSpyId) return 1;
    if (a.id === viewingProfileId) return -1;
    if (b.id === viewingProfileId) return 1;
    return 0;
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-8">
        <SheetHeader className="text-center mb-4">
          <div className="mb-1"><SpyIcon size={48} /></div>
          <SheetTitle className="text-[16px] font-extrabold">{t("spy.move_your_spy")}</SheetTitle>
          <p className="text-[12px] text-muted-foreground">{t("spy.slide_to_assign")}</p>
        </SheetHeader>

        <div className="space-y-2">
          {sortedProfiles.map((profile) => (
            <SwipeableProfileRow
              key={profile.id}
              profile={profile}
              isCurrent={profile.id === currentSpyId}
              isViewing={profile.id === viewingProfileId && profile.id !== currentSpyId}
              onMove={handleMove}
              t={t}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
