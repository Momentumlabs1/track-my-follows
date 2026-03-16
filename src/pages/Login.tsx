import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getOAuthRedirectUrl, shouldSkipBrowserRedirect, isValidOAuthUrl, isInIframe } from "@/lib/oauth";
import logoWide from "@/assets/logo-wide.png";

const SIGNUP_COOLDOWN_SECONDS = 60;
const COOLDOWN_KEY = "signup_cooldown_until";

const normalizeEmail = (e: string) => e.trim().toLowerCase();

function getCooldownRemaining(): number {
  const until = localStorage.getItem(COOLDOWN_KEY);
  if (!until) return 0;
  const remaining = Math.ceil((parseInt(until, 10) - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

function setCooldownUntil() {
  localStorage.setItem(COOLDOWN_KEY, String(Date.now() + SIGNUP_COOLDOWN_SECONDS * 1000));
}

const Login = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [signupCooldown, setSignupCooldown] = useState(getCooldownRemaining);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();

  const navigateToVerify = (normalizedEmail: string) => {
    navigate(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`, {
      state: { email: normalizedEmail },
    });
  };

  const handleSocialLogin = async (provider: "apple" | "google") => {
    setSocialLoading(provider);
    try {
      const redirectUrl = getOAuthRedirectUrl();
      const skipRedirect = shouldSkipBrowserRedirect();

      console.info("[auth/login] OAuth start", { provider, redirectUrl, skipRedirect });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: skipRedirect,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data?.url) {
        toast.error(t("auth.invalid_credentials"));
        return;
      }

      if (skipRedirect) {
        if (!isValidOAuthUrl(data.url)) {
          toast.error("Invalid OAuth redirect URL");
          return;
        }
        window.location.assign(data.url);
      }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSocialLoading(null);
    }
  };

  // Cooldown ticker
  useEffect(() => {
    if (signupCooldown <= 0) return;
    const timer = setTimeout(() => setSignupCooldown(getCooldownRemaining()), 1000);
    return () => clearTimeout(timer);
  }, [signupCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    setLoading(true);

    if (mode === "login") {
      // ─── LOGIN ONLY ───
      console.info("[auth] login attempt", { email: normalizedEmail.slice(0, 3) + "***" });

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!loginError) {
        toast.success(t("auth.login_success"));
        navigate("/dashboard");
        setLoading(false);
        return;
      }

      console.info("[auth] login failed", { code: loginError.message });

      if (loginError.message?.toLowerCase().includes("email not confirmed")) {
        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email: normalizedEmail,
        });
        if (resendError) {
          console.info("[auth] resend on unconfirmed failed", { code: resendError.message });
        }
        toast.info(t("auth.email_not_confirmed_action"));
        navigateToVerify(normalizedEmail);
        setLoading(false);
        return;
      }

      if (loginError.message?.toLowerCase().includes("rate limit")) {
        toast.error(t("auth.rate_limited"));
      } else {
        toast.error(t("auth.invalid_credentials"));
      }
      setLoading(false);
      return;
    }

    // ─── REGISTER ONLY ───
    console.info("[auth] register attempt", { email: normalizedEmail.slice(0, 3) + "***" });

    if (signupCooldown > 0) {
      toast.error(t("auth.signup_cooldown_active", { seconds: signupCooldown }));
      setLoading(false);
      return;
    }

    const { error: signupError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (signupError) {
      console.info("[auth] signup failed", { code: signupError.message });

      if (
        signupError.message?.toLowerCase().includes("rate limit") ||
        signupError.message?.toLowerCase().includes("over_email_send_rate_limit")
      ) {
        setCooldownUntil();
        setSignupCooldown(SIGNUP_COOLDOWN_SECONDS);
        toast.error(t("auth.rate_limit_explanation"));
      } else if (
        signupError.message?.toLowerCase().includes("already registered") ||
        signupError.message?.toLowerCase().includes("already been registered")
      ) {
        toast.error(t("auth.account_exists_check_password"));
      } else {
        toast.error(signupError.message);
      }
      setLoading(false);
      return;
    }

    console.info("[auth] signup success, redirecting to verify");
    toast.success(t("auth.signup_success"));
    navigateToVerify(normalizedEmail);
    setLoading(false);
  };

  const isRegister = mode === "register";
  const submitDisabled =
    loading ||
    (isRegister && (signupCooldown > 0 || !termsAccepted));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 aurora-bg" />
      <div className="absolute inset-0 mesh-dots" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm"
      >
        <Link to="/" className="flex items-center justify-center mb-10">
          <img src={logoWide} alt="Spy-Secret" className="h-12 drop-shadow-lg" />
        </Link>

        <div className="rounded-3xl glass-card p-7 overflow-hidden relative">
          <div className="absolute inset-0 aurora-bg opacity-20" />
          <div className="relative space-y-5">
            {/* Social login buttons */}
            <div className="space-y-3">
              <button
                onClick={() => handleSocialLogin("apple")}
                disabled={!!socialLoading}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-foreground text-background py-3.5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
              >
                {socialLoading === "apple" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    {t("auth.sign_in_apple")}
                  </>
                )}
              </button>

              <button
                onClick={() => handleSocialLogin("google")}
                disabled={!!socialLoading}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-background border border-border/50 py-3.5 text-sm font-semibold transition-all hover:bg-muted disabled:opacity-60"
              >
                {socialLoading === "google" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {t("auth.continue_google")}
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs text-muted-foreground font-medium">{t("auth.or_divider")}</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-xl bg-muted/50 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === "login"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {t("auth.tab_login", "Anmelden")}
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === "register"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {t("auth.tab_register", "Registrieren")}
              </button>
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" placeholder={t("auth.email_placeholder")} value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full rounded-2xl bg-background/80 border border-border/50 ps-11 pe-4 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all" />
              </div>
              <div className="relative">
                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="password" placeholder={t("auth.password_placeholder")} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full rounded-2xl bg-background/80 border border-border/50 ps-11 pe-4 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all" />
              </div>

              {/* Terms checkbox — only for register */}
              {isRegister && (
                <label className="flex items-start gap-2.5 text-[12px] text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={termsAccepted}
                    onCheckedChange={(v) => setTermsAccepted(v === true)}
                    className="mt-0.5"
                  />
                  <span>
                    {t("auth.terms_age_text")}{" "}
                    <Link to="/legal/agb" className="text-primary underline" target="_blank">AGB</Link>{" "}
                    {t("auth.terms_and")}{" "}
                    <Link to="/legal/datenschutz" className="text-primary underline" target="_blank">{t("auth.terms_privacy")}</Link>{" "}
                    {t("auth.terms_read")}.
                  </span>
                </label>
              )}

              {/* Cooldown warning inline */}
              {isRegister && signupCooldown > 0 && (
                <p className="text-xs text-destructive text-center">
                  {t("auth.rate_limit_explanation")} ({signupCooldown}s)
                </p>
              )}

              <button
                type="submit"
                disabled={submitDisabled}
                className="w-full pill-btn-primary py-3.5 justify-center text-sm disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isRegister
                      ? (signupCooldown > 0
                          ? t("auth.signup_waiting", { seconds: signupCooldown })
                          : t("auth.signup_button"))
                      : t("auth.continue_button")}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-between mt-3">
              <p className="text-[12px] text-muted-foreground/70">
                {t("auth.free_note")}
              </p>
              <Link to="/reset-password" className="text-[12px] text-primary hover:underline whitespace-nowrap">
                {t("auth.forgot_password")}
              </Link>
            </div>

            {/* Legal footer links */}
            <div className="flex items-center justify-center gap-2 mt-2 text-[11px] text-muted-foreground/50">
              <Link to="/legal/impressum" className="hover:text-muted-foreground transition-colors">Impressum</Link>
              <span>·</span>
              <Link to="/legal/datenschutz" className="hover:text-muted-foreground transition-colors">Datenschutz</Link>
              <span>·</span>
              <Link to="/legal/agb" className="hover:text-muted-foreground transition-colors">AGB</Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
