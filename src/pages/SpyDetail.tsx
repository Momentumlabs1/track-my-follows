import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Pencil, Loader2, Search, Eye, ChevronRight, Clock, UserMinus, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { Progress } from "@/components/ui/progress";
import { useSpyProfile } from "@/hooks/useSpyProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { haptic } from "@/lib/native";
import { useSubscription } from "@/contexts/SubscriptionContext";
import spyGif from "@/assets/spy-logo-animated.gif";

export default function SpyDetail() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { spyProfile } = useSpyProfile();

  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [pushScanning, setPushScanning] = useState(false);
  const [unfollowScanning, setUnfollowScanning] = useState(false);

  if (!spyProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#000" }}>
        <div className="text-center">
          <img src={spyGif} alt="Spy" className="h-20 w-20 mx-auto mb-4" />
          <p style={{ color: "#8E8E93", fontSize: 14 }}>{t("spy.assign_your_spy")}</p>
          <button onClick={() => navigate("/dashboard")} className="mt-4 text-sm font-semibold" style={{ color: "#FF2D55" }}>
            {t("common.back")}
          </button>
        </div>
      </div>
    );
  }

  const profileAny = spyProfile as Record<string, unknown>;
  const spyName = (profileAny.spy_name as string) || t("dashboard.spy_default_name", "Spion 🕵️");
  const { isProMax } = useSubscription();
  const pushRemaining = isProMax ? 999 : ((profileAny.push_scans_today as number) ?? 4);
  const unfollowRemaining = Math.min((profileAny.unfollow_scans_today as number) ?? 1, 1);
  const spyAssignedAt = spyProfile.spy_assigned_at;

  const handleSaveName = async (newName: string) => {
    const trimmed = newName.trim();
    const finalName = trimmed || null;
    await supabase
      .from("tracked_profiles")
      .update({ spy_name: finalName } as Record<string, unknown>)
      .eq("id", spyProfile.id);
    queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
    queryClient.invalidateQueries({ queryKey: ["follow_events"] });
    queryClient.invalidateQueries({ queryKey: ["follower_events"] });
  };

  const handlePushScan = async () => {
    if (!isProMax && pushRemaining <= 0) {
      toast.error(t("spy_detail.no_scans_left"));
      return;
    }
    haptic.light();
    setPushScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("trigger-scan", {
        body: { profileId: spyProfile.id, scanType: "push" },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setPushScanning(false); return; }
      const newCount = (data?.results?.[0]?.new_follows || 0) + (data?.results?.[0]?.new_followers || 0);
      toast.success(t("spy_detail.scan_complete", { count: newCount }));
      invalidateAll();
      navigate(`/profile/${spyProfile.id}`);
    } catch {
      toast.error(t("spy_detail.scan_failed"));
      setPushScanning(false);
    }
  };

  const handleUnfollowScan = async () => {
    if (unfollowRemaining <= 0) {
      toast.error(t("spy_detail.no_unfollow_left"));
      return;
    }
    haptic.light();
    setUnfollowScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("unfollow-check", {
        body: { profileId: spyProfile.id },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setUnfollowScanning(false); return; }
      const total = (data?.unfollows_found || 0) + (data?.new_follows_found || 0) + (data?.new_followers_found || 0);
      toast.success(t("spy_detail.unfollow_complete", { count: total }));
      invalidateAll();
      navigate(`/profile/${spyProfile.id}`, { state: { activeTab: "unfollowed" } });
    } catch {
      toast.error(t("spy_detail.unfollow_failed"));
      setUnfollowScanning(false);
    }
  };

  const features = [
    { icon: Clock, label: t("spy_detail.feature_hourly"), desc: t("spy_detail.feature_hourly_desc") },
    { icon: UserMinus, label: t("spy_detail.feature_unfollow"), desc: t("spy_detail.feature_unfollow_desc") },
    { icon: BarChart3, label: t("spy_detail.feature_gender"), desc: t("spy_detail.feature_gender_desc") },
  ];

  return (
    <div className="min-h-screen pb-28" style={{ background: "#000" }}>
      {/* Header */}
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" style={{ color: "#fff" }} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{t("spy_detail.spy_profile")}</span>
        <div className="w-10" />
      </div>

      {/* Spy Identity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center px-4 mt-2 relative"
      >
        {/* Radial pink glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 50% 30%, rgba(255,45,85,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Spy GIF */}
        <motion.img
          src={spyGif}
          alt="Spy Agent"
          className="h-[120px] w-[120px] relative z-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 200 }}
        />

        {/* Editable name */}
        <div className="flex items-center gap-2 mt-3 relative z-10" id="spy-name-field">
          {editing ? (
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value.slice(0, 20))}
              onBlur={() => handleSaveName(nameValue)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName(nameValue);
                if (e.key === "Escape") handleCancel();
              }}
              className="bg-transparent text-center outline-none"
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#fff",
                width: 220,
                borderBottom: "2px solid rgba(255,45,85,0.5)",
                paddingBottom: 4,
              }}
              maxLength={20}
            />
          ) : (
            <button
              onClick={() => { setNameValue(spyName); setEditing(true); }}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <span style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{spyName}</span>
              <Pencil className="h-4 w-4" style={{ color: "#8E8E93", opacity: 0.6 }} />
            </button>
          )}
        </div>

        <p className="mt-1.5 relative z-10" style={{ fontSize: 13, color: "#8E8E93" }}>
          {t("spy_detail.spy_since")}: {spyAssignedAt ? new Date(spyAssignedAt).toLocaleDateString(i18n.language, { day: "numeric", month: "short", year: "numeric" }) : "—"}
        </p>
      </motion.div>

      {/* Current Assignment */}
      <div className="px-4 mt-8">
        <p className="px-1 mb-3 uppercase tracking-wider" style={{ fontSize: 12, color: "#8E8E93", fontWeight: 600, letterSpacing: "0.08em" }}>
          {t("spy_detail.current_mission")}
        </p>
        <button
          onClick={() => navigate(`/profile/${spyProfile.id}`)}
          className="w-full flex items-center gap-3 active:scale-[0.98] transition-transform"
          style={{
            background: "#1C1C1E",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: 20,
          }}
        >
          {/* Avatar with pink ring */}
          <div className="relative flex-shrink-0">
            <div
              className="rounded-full p-[2.5px]"
              style={{ background: "linear-gradient(135deg, #FF2D55, #FF6B8A)" }}
            >
              <div className="rounded-full p-[2px]" style={{ background: "#1C1C1E" }}>
                <InstagramAvatar
                  src={spyProfile.avatar_url}
                  alt={spyProfile.username}
                  fallbackInitials={spyProfile.username}
                  size={56}
                />
              </div>
            </div>
          </div>
          <div className="flex-1 text-start min-w-0">
            <p className="truncate" style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>@{spyProfile.username}</p>
            <p style={{ fontSize: 13, color: "#8E8E93", marginTop: 2 }}>
              {spyProfile.follower_count ? `${spyProfile.follower_count.toLocaleString()} Follower` : ""}
              {spyProfile.follower_count && spyProfile.following_count ? " · " : ""}
              {spyProfile.following_count ? `${spyProfile.following_count.toLocaleString()} ${t("dashboard.following", "Folgt")}` : ""}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "#8E8E93" }} />
        </button>
      </div>

      {/* Capabilities */}
      <div className="px-4 mt-6">
        <p className="px-1 mb-3 uppercase tracking-wider" style={{ fontSize: 12, color: "#8E8E93", fontWeight: 600, letterSpacing: "0.08em" }}>
          {t("spy_detail.capabilities")}
        </p>
        <div
          style={{
            background: "#1C1C1E",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: 20,
          }}
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="flex items-start gap-3"
              style={{
                paddingTop: i === 0 ? 0 : 14,
                paddingBottom: i === features.length - 1 ? 0 : 14,
                borderBottom: i < features.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}
            >
              <div
                className="mt-0.5 flex-shrink-0 flex items-center justify-center"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 9999,
                  background: "rgba(255,45,85,0.1)",
                }}
              >
                <f.icon className="h-5 w-5" style={{ color: "#FF2D55" }} />
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{f.label}</p>
                <p style={{ fontSize: 13, color: "#8E8E93", lineHeight: 1.4 }}>{f.desc}</p>
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
          disabled={(!isProMax && pushRemaining <= 0) || pushScanning}
          className="text-start transition-all active:scale-[0.97]"
          style={{
            background: "#1C1C1E",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 16,
            minHeight: 100,
            opacity: pushRemaining <= 0 && !isProMax ? 0.4 : 1,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {pushScanning ? (
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#FF2D55" }} />
              ) : (
                <Search className="h-5 w-5" style={{ color: "#FF2D55" }} />
              )}
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{t("spy_detail.push_scan_title")}</span>
            </div>
            <span
              style={{
                background: "rgba(255,45,85,0.15)",
                color: "#FF2D55",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 8,
                padding: "2px 8px",
              }}
            >
              {isProMax ? "∞" : `${pushRemaining}/4`}
            </span>
          </div>
          <p style={{ fontSize: 11, color: "#8E8E93", lineHeight: 1.4 }}>
            {pushRemaining > 0 || isProMax
              ? t("spy_detail.push_desc")
              : t("spy_detail.tomorrow")}
          </p>
        </button>

        {/* Unfollow Scan */}
        <button
          onClick={handleUnfollowScan}
          disabled={unfollowRemaining <= 0 || unfollowScanning}
          className="text-start transition-all active:scale-[0.97]"
          style={{
            background: "#1C1C1E",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 16,
            minHeight: 100,
            opacity: unfollowRemaining <= 0 ? 0.4 : 1,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {unfollowScanning ? (
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#FF2D55" }} />
              ) : (
                <Eye className="h-5 w-5" style={{ color: "#FF2D55" }} />
              )}
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{t("spy_detail.unfollow_scan_title")}</span>
            </div>
            <span
              style={{
                background: "rgba(255,45,85,0.15)",
                color: "#FF2D55",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 8,
                padding: "2px 8px",
              }}
            >
              {unfollowRemaining}/1
            </span>
          </div>
          <p style={{ fontSize: 11, color: "#8E8E93", lineHeight: 1.4 }}>
            {unfollowRemaining > 0
              ? t("spy_detail.unfollow_desc")
              : t("spy_detail.tomorrow")}
          </p>
        </button>
      </div>
    </div>
  );
}
