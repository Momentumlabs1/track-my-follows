import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Bell, Trash2, LogOut, Globe, Crown, Palette, Lock, Scale, FileText } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
];

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { plan, status, billingPeriod, maxProfiles, showPaywall, canUsePush } = useSubscription();
  const navigate = useNavigate();
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await signOut();
    toast.success(t("settings.logout_toast"));
    navigate("/");
  };

  const handleLanguageChange = async (langCode: string) => {
    i18n.changeLanguage(langCode);
    setCurrentLang(langCode);
    if (user) {
      await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, language: langCode }, { onConflict: "user_id" });
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    if (user) {
      await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, theme: newTheme }, { onConflict: "user_id" });
    }
  };

  const handleManageSubscription = () => {
    console.log("Manage subscription triggered");
    toast.info("Subscription management coming soon");
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm(t("settings.delete_confirm"))) return;
    try {
      await supabase.from("tracked_profiles").delete().eq("user_id", user.id);
      await supabase.from("user_settings").delete().eq("user_id", user.id);
      await supabase.auth.signOut();
      toast.success(t("settings.account_deleted"));
      navigate("/");
    } catch {
      toast.error(t("common.error"));
    }
  };

  const notifications = [
    { label: t("settings.notif_follows"), desc: t("settings.notif_follows_desc"), on: true },
    { label: t("settings.notif_unfollows"), desc: t("settings.notif_unfollows_desc"), on: true },
    { label: t("settings.notif_private"), desc: t("settings.notif_private_desc"), on: false },
  ];

  const themeOptions = [
    { value: "light", label: "☀️", name: t("settings.light") },
    { value: "dark", label: "🌙", name: t("settings.dark") },
    { value: "system", label: "⚙️", name: t("settings.system") },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <main className="container relative max-w-2xl py-6 px-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-extrabold mb-6">{t("settings.title")}</h1>

          <div className="space-y-4">
            {/* Account */}
            <div className="ios-card">
              <h2 className="font-bold text-sm mb-2">{t("settings.your_account")}</h2>
              <p className="text-[13px] text-muted-foreground">{user?.email}</p>
            </div>

            {/* Theme */}
            <div className="ios-card">
              <div className="flex items-center gap-2.5 mb-4">
                <Palette className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-sm">{t("settings.theme")}</h2>
              </div>
              <div className="flex gap-2">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleThemeChange(opt.value)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-semibold transition-all ${
                      theme === opt.value
                        ? "gradient-bg text-primary-foreground shadow-lg shadow-primary/20"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <span className="text-lg">{opt.label}</span>
                    <span>{opt.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="ios-card">
              <div className="flex items-center gap-2.5 mb-4">
                <Globe className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-sm">{t("settings.language")}</h2>
              </div>
              <div className="flex gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-semibold transition-all ${
                      currentLang === lang.code
                        ? "gradient-bg text-primary-foreground shadow-lg shadow-primary/20"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subscription */}
            <div className="ios-card relative overflow-hidden">
              <div className="absolute inset-0 aurora-bg opacity-10" />
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-4">
                  <Crown className="h-4 w-4 text-primary" />
                  <h2 className="font-bold text-sm">{t("settings.subscription")}</h2>
                </div>
                {status === "past_due" && (
                  <div className="mb-3 p-3 rounded-xl bg-destructive/10 text-destructive text-[12px] font-medium">
                    {t("settings.billing_issue")}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {t("settings.current_plan")}:{" "}
                      <span className="font-extrabold text-primary capitalize">
                        {plan === "pro" ? "Pro ✨" : "Free"}
                      </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {plan === "pro"
                        ? `${maxProfiles} ${t("settings.profiles_updates", { count: maxProfiles })}${billingPeriod ? ` · ${billingPeriod}` : ""}`
                        : t("settings.profiles_updates", { count: maxProfiles })}
                    </p>
                  </div>
                  {plan === "pro" ? (
                    <button onClick={handleManageSubscription} className="pill-btn-ghost px-4 py-2 text-[12px]">
                      {t("settings.manage_subscription")}
                    </button>
                  ) : (
                    <button onClick={() => showPaywall("settings")} className="pill-btn-primary px-5 py-2.5 text-[13px]">
                      {t("settings.upgrade")}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="ios-card">
              <div className="flex items-center gap-2.5 mb-4">
                <Bell className="h-4 w-4 text-accent" />
                <h2 className="font-bold text-sm">{t("settings.notifications")}</h2>
              </div>
              <div className="space-y-3">
                {notifications.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-[13px] font-semibold">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (!canUsePush) {
                          showPaywall("push");
                          return;
                        }
                      }}
                      className={`h-7 w-12 rounded-full relative transition-all ${
                        !canUsePush ? "bg-muted opacity-50" : item.on ? "gradient-bg shadow-lg shadow-primary/20" : "bg-muted"
                      }`}
                    >
                      {!canUsePush && <Lock className="h-3 w-3 text-muted-foreground absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2" />}
                      {canUsePush && (
                        <span className={`absolute top-1 h-5 w-5 rounded-full bg-card transition-all ${item.on ? "end-1" : "start-1"}`} />
                      )}
                    </button>
                  </div>
                ))}
                {!canUsePush && (
                  <p className="text-[10px] text-muted-foreground">{t("settings.pro_required_push")}</p>
                )}
              </div>
            </div>

            {/* Legal */}
            <div className="ios-card">
              <div className="flex items-center gap-2.5 mb-3">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-bold text-sm">{t("settings.legal")}</h2>
              </div>
              <div className="space-y-2">
                <a href="https://spy-secret.com/impressum" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors py-1">
                  <FileText className="h-3.5 w-3.5" />
                  {t("settings.impressum")}
                </a>
                <a href="https://spy-secret.com/datenschutz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors py-1">
                  <FileText className="h-3.5 w-3.5" />
                  {t("settings.privacy")}
                </a>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full ios-card flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-[13px] font-semibold">{t("settings.logout")}</span>
            </button>

            {/* Danger Zone */}
            <div className="ios-card border-destructive/15">
              <div className="flex items-center gap-2.5 mb-3">
                <Trash2 className="h-4 w-4 text-destructive" />
                <h2 className="font-bold text-sm">{t("settings.danger_zone")}</h2>
              </div>
              <p className="text-[13px] text-muted-foreground mb-3">{t("settings.danger_text")}</p>
              <button
                onClick={handleDeleteAccount}
                className="px-5 py-2.5 rounded-2xl text-[13px] font-semibold border border-destructive/20 text-destructive hover:bg-destructive/5 transition-colors"
              >
                {t("settings.delete_account")}
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Settings;
