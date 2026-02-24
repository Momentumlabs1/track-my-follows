import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import logoSquare from "@/assets/logo-square.png";

export default function Splash() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      navigate(user ? "/dashboard" : "/onboarding", { replace: true });
    }, 500);
    return () => clearTimeout(timer);
  }, [user, loading, navigate]);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/10 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center"
      >
        <img src={logoSquare} alt="TrackIQ" className="h-20 w-20 rounded-3xl shadow-xl shadow-primary/20 mb-5" />
        <h1 className="text-2xl font-extrabold text-foreground">
          Track<span className="text-primary">IQ</span>
        </h1>
        <p className="text-sm text-muted-foreground/40 mt-1.5">{t("splash.subtitle")}</p>
      </motion.div>
    </div>
  );
}
