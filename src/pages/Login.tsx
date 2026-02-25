import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import logoWide from "@/assets/logo-wide.png";

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSocialLogin = async (provider: "apple" | "google") => {
    setSocialLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) {
      toast.error(error.message);
      setSocialLoading(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Smart Auth: try login first, fallback to signup
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      if (loginError.message?.includes("Invalid login credentials")) {
        // User doesn't exist → auto signup
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          toast.error(signUpError.message);
          setLoading(false);
          return;
        }
        toast.success(t("auth.signup_success"));
        navigate("/verify-email", { state: { email } });
        return;
      }
      toast.error(loginError.message);
      setLoading(false);
      return;
    }

    toast.success(t("auth.login_success"));
    navigate("/dashboard");
  };

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

            {/* Email fallback */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
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
              <button type="submit" disabled={loading} className="w-full pill-btn-primary py-3.5 justify-center text-sm disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t("auth.continue_button")} <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <p className="text-center text-[12px] text-muted-foreground/70 mt-3">
              {t("auth.free_note")}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
