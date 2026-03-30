import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Trash2, LogOut, Globe, Crown, Palette, Scale, RotateCcw, ExternalLink, Loader2, AlertTriangle, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
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
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2 | 3>(0); // 0=hidden, 1=warning, 2=type DELETE, 3=final
  const [deleteInput, setDeleteInput] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [restoreResult, setRestoreResult] = useState<"idle" | "loading" | "success" | "not_found" | "error" | "web_hint">("idle");

  useEffect(() => {
    getAppVersion().then(v => setAppVersion(`${v.versionNumber} (${v.bundleNumber})`));
  }, []);

  // --- LOGOUT with confirmation ---
  const handleLogoutClick = () => {
    haptic.light();
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    haptic.light();
    setShowLogoutConfirm(false);
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

  // --- RESTORE PURCHASES (improved) ---
  const handleRestore = async () => {
    if (!user) return;
    haptic.light();

    // Web users: show hint instead of attempting native restore
    if (!isNativeApp()) {
      setRestoreResult("web_hint");
      return;
    }

    setRestoreResult("loading");
    setRestoring(true);
    try {
      await restorePurchases(user.id);
      // Poll DB for up to 10 seconds
      let found = false;
      for (let i = 0; i < 7; i++) {
        await new Promise(r => setTimeout(r, 1500));
        const { data } = await supabase
          .from("subscriptions")
          .select("plan_type, status")
          .eq("user_id", user.id)
          .maybeSingle();
        const isPro = data?.plan_type === "pro" && ["active", "in_trial"].includes(data?.status ?? "");
        if (isPro) {
          found = true;
          break;
        }
      }
      await refetch();
      if (found) {
        haptic.success();
        setRestoreResult("success");
      } else {
        haptic.warning();
        setRestoreResult("not_found");
      }
    } catch {
      haptic.error();
      setRestoreResult("error");
    } finally {
      setRestoring(false);
    }
  };

  // --- DELETE ACCOUNT (3-step) ---
  const handleDeleteStart = () => {
    haptic.warning();
    if (plan === "pro") {
      setDeleteStep(1); // Show subscription warning first
    } else {
      setDeleteStep(2); // Skip to type DELETE
    }
  };

  const handleDeleteProceed = () => {
    haptic.light();
    setDeleteStep(2);
    setDeleteInput("");
  };

  const handleDeleteFinal = async () => {
    if (!user) return;
    if (deleteInput !== "DELETE") return;
    haptic.error();
    setDeleting(true);
    try {
      // Send deletion confirmation email
      try {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "account-deletion",
            recipientEmail: user.email,
            idempotencyKey: `account-delete-${user.id}-${Date.now()}`,
            templateData: { email: user.email },
          },
        });
      } catch (emailErr) {
        console.warn("[DeleteAccount] Email send failed:", emailErr);
        // Don't block deletion if email fails
      }

      const { error } = await supabase.rpc("delete_own_account");
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success(t("settings.account_deleted"));
      navigate("/onboarding");
    } catch {
      toast.error(t("common.error"));
    } finally {
      setDeleting(false);
      setDeleteStep(0);
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

                {/* Restore Result Feedback */}
                <AnimatePresence>
                  {restoreResult !== "idle" && restoreResult !== "loading" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      {restoreResult === "success" && (
                        <div className="p-3 rounded-xl bg-green-500/10 flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <p className="text-[12px] font-medium text-green-600 dark:text-green-400">{t("settings.subscription_restored")}</p>
                        </div>
                      )}
                      {restoreResult === "not_found" && (
                        <div className="p-3 rounded-xl bg-accent/50 flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[12px] font-semibold text-foreground">{t("settings.no_subscription_found")}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">{t("settings.restore_hint_native")}</p>
                          </div>
                        </div>
                      )}
                      {restoreResult === "error" && (
                        <div className="p-3 rounded-xl bg-destructive/10 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[12px] font-semibold text-destructive">{t("settings.restore_error")}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">{t("settings.restore_error_hint")}</p>
                          </div>
                        </div>
                      )}
                      {restoreResult === "web_hint" && (
                        <div className="p-3 rounded-xl bg-accent/50 flex items-start gap-2">
                          <ShieldAlert className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[12px] font-semibold text-foreground">{t("settings.restore_web_title")}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">{t("settings.restore_web_hint")}</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
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
              onClick={handleLogoutClick}
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
                onClick={handleDeleteStart}
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

      {/* ===== LOGOUT CONFIRMATION ===== */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            >
              <span className="text-4xl block text-center mb-3">👋</span>
              <h3 className="text-lg font-extrabold text-center text-foreground mb-2">{t("settings.logout")}</h3>
              <p className="text-[13px] text-muted-foreground text-center mb-6">{t("settings.logout_confirm_text")}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-2xl bg-secondary text-secondary-foreground text-[13px] font-semibold min-h-[44px]"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground text-[13px] font-semibold min-h-[44px]"
                >
                  {t("settings.logout")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== DELETE ACCOUNT MULTI-STEP DIALOG ===== */}
      <AnimatePresence>
        {deleteStep > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setDeleteStep(0); setDeleteInput(""); }} />
            <motion.div
              key={`delete-step-${deleteStep}`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            >
              {/* Step 1: Pro subscription warning */}
              {deleteStep === 1 && (
                <>
                  <span className="text-4xl block text-center mb-3">💎</span>
                  <h3 className="text-lg font-extrabold text-center text-foreground mb-2">{t("settings.delete_pro_warning_title")}</h3>
                  <p className="text-[13px] text-muted-foreground text-center mb-4">{t("settings.delete_pro_warning_text")}</p>
                  <div className="p-3 rounded-xl bg-destructive/10 mb-6">
                    <p className="text-[12px] text-destructive font-medium text-center">{t("settings.delete_pro_warning_note")}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setDeleteStep(0); }}
                      className="flex-1 py-3 rounded-2xl bg-secondary text-secondary-foreground text-[13px] font-semibold min-h-[44px]"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      onClick={handleDeleteProceed}
                      className="flex-1 py-3 rounded-2xl bg-destructive text-destructive-foreground text-[13px] font-semibold min-h-[44px]"
                    >
                      {t("settings.delete_continue")}
                    </button>
                  </div>
                </>
              )}

              {/* Step 2: Type DELETE */}
              {deleteStep === 2 && (
                <>
                  <span className="text-4xl block text-center mb-3">⚠️</span>
                  <h3 className="text-lg font-extrabold text-center text-foreground mb-2">{t("settings.delete_account")}</h3>
                  <p className="text-[13px] text-muted-foreground text-center mb-4">{t("settings.delete_type_instruction")}</p>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value.toUpperCase())}
                    placeholder="DELETE"
                    className="w-full rounded-2xl bg-background border-2 border-destructive/30 px-4 py-3 text-center text-base font-bold tracking-[0.3em] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-destructive mb-4"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setDeleteStep(0); setDeleteInput(""); }}
                      className="flex-1 py-3 rounded-2xl bg-secondary text-secondary-foreground text-[13px] font-semibold min-h-[44px]"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      onClick={handleDeleteFinal}
                      disabled={deleteInput !== "DELETE" || deleting}
                      className="flex-1 py-3 rounded-2xl bg-destructive text-destructive-foreground text-[13px] font-semibold min-h-[44px] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : t("settings.delete_final")}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
