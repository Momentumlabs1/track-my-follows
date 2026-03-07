import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Pencil, Loader2, Search, Eye, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SpyIcon } from "@/components/SpyIcon";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { Progress } from "@/components/ui/progress";
import { useSpyProfile } from "@/hooks/useSpyProfile";
import { useFollowEvents } from "@/hooks/useTrackedProfiles";
import { useFollowerEvents } from "@/hooks/useFollowerEvents";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { haptic } from "@/lib/native";

export default function SpyDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { spyProfile } = useSpyProfile();
  const { data: followEvents = [] } = useFollowEvents(spyProfile?.id);
  const { data: followerEvents = [] } = useFollowerEvents(spyProfile?.id);

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

  const spyName = (spyProfile as Record<string, unknown>).spy_name as string || "Spion 🕵️";
  const pushRemaining = spyProfile.push_scans_today ?? 4;
  const unfollowRemaining = spyProfile.unfollow_scans_today ?? 1;
  const totalScans = (spyProfile as Record<string, unknown>).total_scans_executed as number || 0;
  const totalFollows = (spyProfile as Record<string, unknown>).total_follows_detected as number || 0;
  const totalUnfollows = (spyProfile as Record<string, unknown>).total_unfollows_detected as number || 0;
  const spyAssignedAt = spyProfile.spy_assigned_at;
  const daysSince = spyAssignedAt ? Math.floor((Date.now() - new Date(spyAssignedAt).getTime()) / 86400000) : 0;

  // Recent events (last 5)
  const recentEvents = useMemo(() => {
    const allEvents = [
      ...followEvents.filter(e => !e.is_initial).map(e => ({
        id: e.id, detected_at: e.detected_at, type: e.event_type,
        username: e.target_username, source: "follow" as const,
      })),
      ...followerEvents.filter(e => !e.is_initial).map(e => ({
        id: e.id, detected_at: e.detected_at, type: e.event_type,
        username: e.username, source: "follower" as const,
      })),
    ];
    return allEvents
      .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
      .slice(0, 5);
  }, [followEvents, followerEvents]);

  const avgPerDay = daysSince > 0 ? ((totalFollows + totalUnfollows) / daysSince).toFixed(1) : "0";

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === spyName) {
      setEditingName(false);
      return;
    }
    await supabase.from("tracked_profiles").update({ spy_name: nameValue.trim().slice(0, 20) } as Record<string, unknown>).eq("id", spyProfile.id);
    queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
    setEditingName(false);
    toast.success("Name gespeichert ✅");
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
      } else {
        const newCount = (data?.results?.[0]?.new_follows || 0) + (data?.results?.[0]?.new_followers || 0);
        toast.success(`Scan abgeschlossen! ${newCount} neue Änderungen 🔍`);
      }
      queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
      queryClient.invalidateQueries({ queryKey: ["follow_events"] });
      queryClient.invalidateQueries({ queryKey: ["follower_events"] });
    } catch (err) {
      toast.error("Scan fehlgeschlagen");
    } finally {
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
      } else {
        const total = (data?.unfollows_found || 0) + (data?.lost_followers || 0) + (data?.new_follows_found || 0) + (data?.new_followers_found || 0);
        toast.success(`Unfollow-Check fertig! ${total} Änderungen gefunden 👁`);
      }
      queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
      queryClient.invalidateQueries({ queryKey: ["follow_events"] });
      queryClient.invalidateQueries({ queryKey: ["follower_events"] });
    } catch (err) {
      toast.error("Unfollow-Check fehlgeschlagen");
    } finally {
      setUnfollowScanning(false);
    }
  };

  const formatEventTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isYesterday = d.toDateString() === new Date(now.getTime() - 86400000).toDateString();
    const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `Heute ${time}`;
    if (isYesterday) return "Gestern";
    return d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
  };

  const getEventEmoji = (type: string, source: string) => {
    if (source === "follow") return type === "unfollow" ? "🔴" : "🟢";
    return type === "lost" ? "🟠" : "🔵";
  };

  const getEventLabel = (type: string, source: string) => {
    if (source === "follow") return type === "unfollow" ? "hat entfolgt" : "folgt jetzt";
    return type === "lost" ? "Follower verloren" : "neuer Follower";
  };

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

      {/* Spy Profile Header */}
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

        {/* Watched profile link */}
        <button
          onClick={() => navigate(`/profile/${spyProfile.id}`)}
          className="flex items-center gap-2 mt-3 bg-muted/50 rounded-full px-4 py-2 hover:bg-muted transition-colors"
        >
          <InstagramAvatar
            src={spyProfile.avatar_url}
            alt={spyProfile.username}
            fallbackInitials={spyProfile.username}
            size={24}
          />
          <span className="text-[13px] font-semibold text-foreground">@{spyProfile.username}</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </motion.div>

      {/* Action Buttons */}
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
            {pushRemaining} von 4 übrig heute
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
            {unfollowRemaining} von 1 übrig heute
          </p>
          <Progress value={(unfollowRemaining / 1) * 100} className="h-1.5 bg-muted" />
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 mt-6">
        <p className="section-header px-1 mb-3">📊 {t("spy_detail.spy_report", "Spion-Bericht")}</p>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
          <StatRow label={t("spy_detail.total_missions", "Gesamte Einsätze")} value={String(totalScans)} />
          <StatRow label={t("spy_detail.follows_detected", "Neue Follows erkannt")} value={String(totalFollows)} />
          <StatRow label={t("spy_detail.unfollows_detected", "Unfollows erkannt")} value={String(totalUnfollows)} />
          <StatRow label={t("spy_detail.active_days", "Aktiv seit")} value={`${daysSince} Tage`} />
          <StatRow label={t("spy_detail.avg_changes", "Durchschn. Änderungen/Tag")} value={avgPerDay} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 mt-6">
        <p className="section-header px-1 mb-3">{t("spy_detail.last_activity", "Letzte Aktivität")}</p>
        {recentEvents.length > 0 ? (
          <div className="space-y-2">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 rounded-xl bg-card border border-border p-3">
                <span className="text-[11px] text-muted-foreground w-16 flex-shrink-0">
                  {formatEventTime(event.detected_at)}
                </span>
                <span className="text-sm">{getEventEmoji(event.type, event.source)}</span>
                <span className="text-[12px] text-foreground font-medium truncate">
                  @{event.username} {getEventLabel(event.type, event.source)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-card border border-border p-6 text-center">
            <p className="text-[12px] text-muted-foreground">Noch keine Aktivität erkannt</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="text-[13px] font-bold text-foreground">{value}</span>
    </div>
  );
}
