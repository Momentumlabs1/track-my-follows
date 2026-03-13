import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Pencil, Loader2, Search, Eye, ChevronRight, Clock, UserX, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SpyIcon } from "@/components/SpyIcon";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { Progress } from "@/components/ui/progress";
import { useSpyProfile } from "@/hooks/useSpyProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { haptic } from "@/lib/native";

export default function SpyDetail() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { spyProfile } = useSpyProfile();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [pushScanning, setPushScanning] = useState(false);
  const [unfollowScanning, setUnfollowScanning] = useState(false);

  if (!spyProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <SpyIcon size={64} glow />
          <p className="text-muted-foreground mt-4">{t("spy.assign_your_spy")}</p>
          <button onClick={() => navigate("/dashboard")} className="mt-4 text-primary text-sm font-semibold">
            {t("common.back")}
          </button>
        </div>
      </div>
    );
  }

  const profileAny = spyProfile as Record<string, unknown>;
  const spyName = (profileAny.spy_name as string) || "Spion 🕵️";
  const pushRemaining = (profileAny.push_scans_today as number) ?? 4;
  const unfollowRemaining = Math.min((profileAny.unfollow_scans_today as number) ?? 1, 1);
  const spyAssignedAt = spyProfile.spy_assigned_at;

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === spyName) {
      setEditingName(false);
      return;
    }
    await supabase.from("tracked_profiles").update({ spy_name: nameValue.trim().slice(0, 20) } as Record<string, unknown>).eq("id", spyProfile.id);
    queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
    setEditingName(false);
    toast.success(t("spy_detail.name_saved"));
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
    queryClient.invalidateQueries({ queryKey: ["follow_events"] });
    queryClient.invalidateQueries({ queryKey: ["follower_events"] });
  };

  const handlePushScan = async () => {
    if (pushRemaining <= 0) {
      toast.error(t("spy_detail.no_scans_left", "Keine Push-Scans mehr übrig heute ⏰"));
      return;
    }
    haptic.light();
    setPushScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("trigger-scan", {
        body: { profileId: spyProfile.id, scanType: "push" },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setPushScanning(false);
        return;
      }
      const newCount = (data?.results?.[0]?.new_follows || 0) + (data?.results?.[0]?.new_followers || 0);
      toast.success(t("spy_detail.scan_complete", { count: newCount }));
      invalidateAll();
      navigate(`/profile/${spyProfile.id}`);
    } catch {
      toast.error("Scan fehlgeschlagen");
      setPushScanning(false);
    }
  };

  const handleUnfollowScan = async () => {
    if (unfollowRemaining <= 0) {
      toast.error(t("spy_detail.no_unfollow_left", "Kein Unfollow-Scan mehr übrig heute ⏰"));
      return;
    }
    haptic.light();
    setUnfollowScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("unfollow-check", {
        body: { profileId: spyProfile.id },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setUnfollowScanning(false);
        return;
      }
      const total = (data?.unfollows_found || 0) + (data?.lost_followers || 0) + (data?.new_follows_found || 0) + (data?.new_followers_found || 0);
      toast.success(`Unfollow-Check fertig! ${total} Änderungen gefunden 👁`);
      invalidateAll();
      navigate(`/profile/${spyProfile.id}`, { state: { activeTab: "unfollowed" } });
    } catch {
      toast.error("Unfollow-Check fehlgeschlagen");
      setUnfollowScanning(false);
    }
  };

  const features = [
    { icon: <Clock className="h-4 w-4 text-primary" />, label: t("spy_detail.feature_hourly", "Stündliche Scans"), desc: t("spy_detail.feature_hourly_desc", "Automatisch jede Stunde neue Follows & Follower erkennen") },
    { icon: <UserX className="h-4 w-4 text-destructive" />, label: t("spy_detail.feature_unfollow", "Unfollow-Erkennung"), desc: t("spy_detail.feature_unfollow_desc", "Sofort wissen, wenn jemand entfolgt wird") },
    { icon: <Users className="h-4 w-4 text-brand-blue" />, label: t("spy_detail.feature_gender", "Geschlechteranalyse"), desc: t("spy_detail.feature_gender_desc", "Erfahre, wem dein Ziel wirklich folgt") },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <span className="text-[15px] font-bold text-foreground">{t("spy_detail.spy_profile", "Spion-Profil")}</span>
        <div className="w-10" />
      </div>

      {/* Spy Identity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center px-4 mt-4"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <SpyIcon size={80} glow />
        </motion.div>

        {/* Editable name */}
        <div className="flex items-center gap-2 mt-3">
          {editingName ? (
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value.slice(0, 20))}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              className="bg-muted rounded-lg px-3 py-1.5 text-[16px] font-bold text-foreground text-center outline-none focus:ring-2 focus:ring-primary w-48"
              maxLength={20}
            />
          ) : (
            <button
              onClick={() => { setNameValue(spyName); setEditingName(true); }}
              className="flex items-center gap-1.5 hover:opacity-80"
            >
              <span className="text-[18px] font-bold text-foreground">{spyName}</span>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <p className="text-[12px] text-muted-foreground mt-1">
          {t("spy_detail.spy_since", "Spion seit")}: {spyAssignedAt ? new Date(spyAssignedAt).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" }) : "—"}
        </p>
      </motion.div>

      {/* Current Assignment */}
      <div className="px-4 mt-6">
        <p className="section-header px-1 mb-3">{t("spy_detail.current_mission", "Aktueller Einsatz")}</p>
        <button
          onClick={() => navigate(`/profile/${spyProfile.id}`)}
          className="w-full native-card p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="relative">
            <div className="avatar-ring">
              <div className="rounded-full bg-background p-[2px]">
                <InstagramAvatar
                  src={spyProfile.avatar_url}
                  alt={spyProfile.username}
                  fallbackInitials={spyProfile.username}
                  size={48}
                />
              </div>
            </div>
          </div>
          <div className="flex-1 text-start">
            <p className="text-[14px] font-bold text-foreground">@{spyProfile.username}</p>
            <p className="text-[12px] text-muted-foreground">
              {spyProfile.follower_count ? `${spyProfile.follower_count.toLocaleString()} Follower` : ""} · {spyProfile.following_count ? `${spyProfile.following_count.toLocaleString()} Following` : ""}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </button>
      </div>

      {/* Storytelling: What can your spy do? */}
      <div className="px-4 mt-6">
        <p className="section-header px-1 mb-3">{t("spy_detail.capabilities", "Was kann dein Spion?")}</p>
        <div className="native-card p-4 space-y-3">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="flex items-start gap-3"
            >
              <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
                {f.icon}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-foreground">{f.label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scan Actions */}
      <div className="px-4 mt-6 grid grid-cols-2 gap-3">
        {/* Push Scan */}
        <button
          onClick={handlePushScan}
          disabled={pushRemaining <= 0 || pushScanning}
          className={`rounded-2xl border p-4 text-start transition-all active:scale-[0.97] ${
            pushRemaining > 0
              ? "border-primary/20 bg-gradient-to-br from-primary/10 to-card hover:from-primary/15"
              : "border-muted bg-muted/30 opacity-60"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {pushScanning ? (
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-primary" />
            )}
            <span className="text-[13px] font-bold text-foreground">Push Scan</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3">
            {pushRemaining > 0
              ? t("spy_detail.push_desc", "Sofort scannen wer neu gefolgt wird")
              : t("spy_detail.tomorrow", "Morgen wieder verfügbar ⏰")}
          </p>
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
            {pushRemaining} von 4 übrig
          </p>
          <Progress value={(pushRemaining / 4) * 100} className="h-1.5 bg-muted" />
        </button>

        {/* Unfollow Scan */}
        <button
          onClick={handleUnfollowScan}
          disabled={unfollowRemaining <= 0 || unfollowScanning}
          className={`rounded-2xl border p-4 text-start transition-all active:scale-[0.97] ${
            unfollowRemaining > 0
              ? "border-primary/20 bg-gradient-to-br from-primary/10 to-card hover:from-primary/15"
              : "border-muted bg-muted/30 opacity-60"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {unfollowScanning ? (
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            ) : (
              <Eye className="h-5 w-5 text-primary" />
            )}
            <span className="text-[13px] font-bold text-foreground">Unfollow Scan</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3">
            {unfollowRemaining > 0
              ? t("spy_detail.unfollow_desc", "Prüfe ob jemand entfolgt wurde")
              : t("spy_detail.tomorrow", "Morgen wieder verfügbar ⏰")}
          </p>
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
            {unfollowRemaining} von 1 übrig
          </p>
          <Progress value={(unfollowRemaining / 1) * 100} className="h-1.5 bg-muted" />
        </button>
      </div>
    </div>
  );
}
