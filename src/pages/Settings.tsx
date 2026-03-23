import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Trash2, LogOut, Globe, Crown, Palette, Scale, RotateCcw, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import { haptic, restorePurchases, manageSubscription, getAppVersion, isNativeApp } from "@/lib/native";

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
];

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { plan, status, billingPeriod, maxProfiles, showPaywall, refetch } = useSubscription();
  const navigate = useNavigate();
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const { theme, setTheme } = useTheme();
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("web");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    getAppVersion().then(v => setAppVersion(`${v.versionNumber} (${v.bundleNumber})`));
  }, []);

  const handleLogout = async () => {
    haptic.light();
    await signOut();
    toast.success(t("settings.logout_toast"));
    navigate("/onboarding");
  };

  const handleLanguageChange = async (langCode: string) => {
    haptic.light();
    i18n.changeLanguage(langCode);
    setCurrentLang(langCode);
    if (user) {
      await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, language: langCode }, { onConflict: "user_id" });
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    haptic.light();
    setTheme(newTheme);
    if (user) {
      await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, theme: newTheme }, { onConflict: "user_id" });
    }
  };

  const handleManageSubscription = () => {
    haptic.light();
    if (isNativeApp()) {
      manageSubscription();
    } else {
      window.open("https://apps.apple.com/account/subscriptions", "_blank", "noopener,noreferrer");
    }
  };

  const handleRestore = async () => {
    if (!user) return;
    haptic.light();
    setRestoring(true);
    try {
      await restorePurchases(user.id);
      await refetch();
      if (plan === "pro") {
        haptic.success();
        toast.success(t("settings.subscription_restored"));
      } else {
        toast.info(t("settings.no_subscription_found"));
      }
    } catch {
      toast.error(t("common.error"));
    } finally {
      setRestoring(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    haptic.error();
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_own_account");
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success(t("settings.account_deleted"));
      navigate("/onboarding");
    } catch {
      toast.error(t("common.error"));
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const themeOptions = [
    { value: "light", label: "☀️", name: t("settings.light") },
    { value: "dark", label: "🌙", name: t("settings.dark") },
    { value: "system", label: "⚙️", name: t("settings.system") },
  ];

  return (
    <div className="min-h-screen bg-background pb-[calc(env(safe-area-inset-bottom)+120px)] pt-[calc(env(safe-area-inset-top)+20px)]">
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
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-semibold transition-all min-h-[44px] ${
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
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-semibold transition-all min-h-[44px] ${
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
              <div className="absolute inset-0 aurora-bg opacity-10 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2.5 mb-4">
                  <Crown className="h-4 w-4 text-primary" />
                  <h2 className="font-bold text-sm">{t("settings.subscription")}</h2>
                </div>
                {status === "past_due" && (
                  <div className="mb-3 p-3 rounded-xl bg-destructive/10 text-destructive text-[12px] font-medium">
                    {t("settings.billing_issue")}
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
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
                    <button onClick={handleManageSubscription} className="pill-btn-ghost px-4 py-2 text-[12px] min-h-[44px] flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {t("settings.manage_subscription")}
                    </button>
                  ) : (
                    <button onClick={() => showPaywall("settings")} className="pill-btn-primary px-5 py-2.5 text-[13px] min-h-[44px]">
                      {t("settings.upgrade")}
                    </button>
                  )}
                </div>

                {/* Restore Purchases */}
                <button
                  onClick={handleRestore}
                  disabled={restoring}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-secondary text-secondary-foreground text-[13px] font-semibold min-h-[48px] active:scale-[0.97] transition-transform disabled:opacity-50"
                >
                  {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  {t("settings.restore_purchases")}
                </button>
              </div>
            </div>

            {/* Legal */}
            <div className="ios-card">
              <div className="flex items-center gap-2.5 mb-3">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-bold text-sm">{t("settings.legal")}</h2>
              </div>
              <div className="space-y-2">
                <button onClick={() => navigate("/legal/impressum")} className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors py-1 min-h-[44px] w-full text-start">
                  <span className="text-sm">📋</span>
                  Impressum
                </button>
                <button onClick={() => navigate("/legal/datenschutz")} className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors py-1 min-h-[44px] w-full text-start">
                  <span className="text-sm">🔒</span>
                  Datenschutzerklärung
                </button>
                <button onClick={() => navigate("/legal/agb")} className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors py-1 min-h-[44px] w-full text-start">
                  <span className="text-sm">📄</span>
                  AGB
                </button>
                <button onClick={() => navigate("/legal/widerruf")} className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors py-1 min-h-[44px] w-full text-start">
                  <span className="text-sm">↩️</span>
                  Widerrufsbelehrung
                </button>
              </div>
              {/* Instagram/Meta Disclaimer */}
              <p className="text-[10px] text-muted-foreground/60 mt-4 leading-relaxed">
                {t("settings.disclaimer", "Spy-Secret ist ein unabhängiges Produkt und ist in keiner Weise mit Instagram oder Meta Platforms, Inc. verbunden, assoziiert oder offiziell anerkannt.")}
              </p>
            </div>

            {/* Tutorial Restart */}
            <button
              onClick={() => {
                if (user) {
                  localStorage.removeItem(`tutorial_shown_${user.id}`);
                  haptic.success();
                  toast.success(t('settings.tutorial_reset'));
                }
              }}
              className="w-full ios-card flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="text-[13px] font-semibold">{t('settings.restart_tutorial')}</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full ios-card flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
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
                onClick={() => setShowDeleteConfirm(true)}
                className="px-5 py-2.5 rounded-2xl text-[13px] font-semibold border border-destructive/20 text-destructive hover:bg-destructive/5 transition-colors min-h-[44px]"
              >
                {t("settings.delete_account")}
              </button>
            </div>

            {/* App Version */}
            <p className="text-center text-[11px] text-muted-foreground/50 mt-4">
              Version {appVersion}
            </p>
          </div>
        </motion.div>
      </main>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-card rounded-3xl p-6 max-w-sm w-full shadow-2xl"
          >
            <span className="text-4xl block text-center mb-3">⚠️</span>
            <h3 className="text-lg font-extrabold text-center text-foreground mb-2">{t("settings.delete_account")}</h3>
            <p className="text-[13px] text-muted-foreground text-center mb-6">{t("settings.delete_confirm_detailed")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-secondary text-secondary-foreground text-[13px] font-semibold min-h-[44px]"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-3 rounded-2xl bg-destructive text-destructive-foreground text-[13px] font-semibold min-h-[44px] disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : t("settings.delete_account")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Settings;
