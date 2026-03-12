import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ArrowRight, Loader2, CheckCircle, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import logoWide from "@/assets/logo-wide.png";

type Step = "request" | "update";

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Check if user arrived via recovery link (has access_token in hash)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setStep("update");
    }
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t("auth.passwords_dont_match"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("auth.password_too_short"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("auth.password_updated"));
      navigate("/dashboard");
    }
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
        <Link to="/login" className="flex items-center justify-center mb-10">
          <img src={logoWide} alt="Spy-Secret" className="h-12 drop-shadow-lg" />
        </Link>

        <div className="rounded-3xl glass-card p-7 overflow-hidden relative">
          <div className="absolute inset-0 aurora-bg opacity-20" />
          <div className="relative space-y-5">
            {step === "request" && !sent && (
              <>
                <div className="text-center space-y-2">
                  <h1 className="text-xl font-extrabold">{t("auth.forgot_password_title")}</h1>
                  <p className="text-sm text-muted-foreground">{t("auth.forgot_password_desc")}</p>
                </div>
                <form onSubmit={handleRequestReset} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder={t("auth.email_placeholder")}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full rounded-2xl bg-background/80 border border-border/50 ps-11 pe-4 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full pill-btn-primary py-3.5 justify-center text-sm disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>
                        {t("auth.send_reset_link")}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {step === "request" && sent && (
              <div className="text-center space-y-4 py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <h2 className="text-lg font-bold">{t("auth.reset_email_sent_title")}</h2>
                <p className="text-sm text-muted-foreground">{t("auth.reset_email_sent_desc")}</p>
              </div>
            )}

            {step === "update" && (
              <>
                <div className="text-center space-y-2">
                  <h1 className="text-xl font-extrabold">{t("auth.new_password_title")}</h1>
                  <p className="text-sm text-muted-foreground">{t("auth.new_password_desc")}</p>
                </div>
                <form onSubmit={handleUpdatePassword} className="space-y-3">
                  <div className="relative">
                    <Lock className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      placeholder={t("auth.new_password_placeholder")}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full rounded-2xl bg-background/80 border border-border/50 ps-11 pe-4 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      placeholder={t("auth.confirm_password_placeholder")}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full rounded-2xl bg-background/80 border border-border/50 ps-11 pe-4 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full pill-btn-primary py-3.5 justify-center text-sm disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>
                        {t("auth.update_password")}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            <div className="text-center">
              <Link to="/login" className="text-sm text-primary hover:underline">
                {t("auth.back_to_login")}
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
