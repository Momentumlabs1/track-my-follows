import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import logoWide from "@/assets/logo-wide.png";

const COOLDOWN_SECONDS = 60;

const VerifyEmail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Read email from state OR query param (fallback for page reload)
  const email =
    (location.state as any)?.email ||
    searchParams.get("email") ||
    "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [rateLimitNotice, setRateLimitNotice] = useState<string | null>(null);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (!email) {
      navigate("/login", { replace: true });
    }
  }, [email, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = useCallback(async () => {
    const cleanCode = code.replace(/\D/g, "").trim();
    if (cleanCode.length !== 6 || loading || verifyingRef.current) return;

    verifyingRef.current = true;
    setLoading(true);

    console.info("[auth] verifyOtp", { email: email.slice(0, 3) + "***", codeLen: cleanCode.length });

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: cleanCode,
      type: "signup",
    });

    if (error) {
      console.info("[auth] verifyOtp error", { msg: error.message });

      // Handle expired/invalid token specifically
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("expired") || msg.includes("otp_expired")) {
        toast.error(t("auth.code_expired"));
      } else if (msg.includes("invalid") || msg.includes("token")) {
        toast.error(t("auth.code_invalid"));
      } else {
        toast.error(error.message);
      }

      setCode("");
      setLoading(false);
      verifyingRef.current = false;
      return;
    }

    toast.success(t("auth.verified_success"));
    navigate("/dashboard", { replace: true });
  }, [code, loading, email, navigate, t]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    const cleanCode = code.replace(/\D/g, "");
    if (cleanCode.length === 6 && !verifyingRef.current) {
      handleVerify();
    }
  }, [code, handleVerify]);

  const handleResend = async () => {
    if (cooldown > 0) return;

    setRateLimitNotice(null);
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
    });

    if (error) {
      if (error.message?.toLowerCase().includes("rate limit")) {
        setCooldown(COOLDOWN_SECONDS);
        setRateLimitNotice(t("auth.resend_rate_limit_active", { seconds: COOLDOWN_SECONDS }));
        toast.error(t("auth.rate_limited"));
      } else {
        toast.error(error.message);
      }
      setResending(false);
      return;
    }

    toast.success(t("auth.code_resent"));
    setRateLimitNotice(t("auth.only_latest_code_valid"));
    setCooldown(COOLDOWN_SECONDS);
    setResending(false);
    setCode("");
  };

  if (!email) return null;

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
        <div className="flex items-center justify-center mb-10">
          <img src={logoWide} alt="Logo" className="h-12 drop-shadow-lg" />
        </div>

        <div className="rounded-3xl glass-card p-7 overflow-hidden relative">
          <div className="absolute inset-0 aurora-bg opacity-20" />
          <div className="relative space-y-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-7 w-7 text-primary" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-foreground">
                {t("auth.verify_title")}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("auth.verify_subtitle_neutral", { email })}
              </p>
            </div>

            <div className="py-2">
              <InputOTP maxLength={6} value={code} onChange={setCode} disabled={loading}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-12 h-14 text-lg rounded-xl border-border/50 bg-background/80" />
                  <InputOTPSlot index={1} className="w-12 h-14 text-lg rounded-xl border-border/50 bg-background/80" />
                  <InputOTPSlot index={2} className="w-12 h-14 text-lg rounded-xl border-border/50 bg-background/80" />
                  <InputOTPSlot index={3} className="w-12 h-14 text-lg rounded-xl border-border/50 bg-background/80" />
                  <InputOTPSlot index={4} className="w-12 h-14 text-lg rounded-xl border-border/50 bg-background/80" />
                  <InputOTPSlot index={5} className="w-12 h-14 text-lg rounded-xl border-border/50 bg-background/80" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {rateLimitNotice ? (
              <div className="w-full rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {rateLimitNotice}
              </div>
            ) : null}

            <button
              onClick={handleVerify}
              disabled={code.replace(/\D/g, "").length !== 6 || loading}
              className="w-full pill-btn-primary py-3.5 justify-center text-sm disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {t("auth.verify_button")} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {resending ? (
                <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
              ) : null}
              {cooldown > 0
                ? t("auth.resend_cooldown", { seconds: cooldown })
                : t("auth.resend_code")}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
