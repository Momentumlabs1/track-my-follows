import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import spyLogoGif from "@/assets/spy-logo-animated.gif";

export default function Splash() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      navigate(user ? "/dashboard" : "/onboarding", { replace: true });
    }, 2200);
    return () => clearTimeout(timer);
  }, [user, loading, navigate]);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated glow rings */}
      <motion.div
        className="absolute w-72 h-72 rounded-full border border-primary/20"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.8], opacity: [0.4, 0] }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full border border-primary/30"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.5], opacity: [0.5, 0] }}
        transition={{ duration: 1.8, ease: "easeOut", delay: 0.5 }}
      />

      {/* Background glow */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-primary/15 blur-[100px]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      <div className="relative flex flex-col items-center">
        {/* Logo with bounce-in */}
        <motion.img
          src={spyLogoGif}
          alt="Spy-Secret"
          className="h-36 w-36 object-contain mb-6"
          initial={{ opacity: 0, scale: 0.3, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{
            duration: 0.7,
            ease: [0.16, 1.2, 0.3, 1],
            delay: 0.1,
          }}
        />

        {/* Brand name reveal */}
        <motion.div
          className="flex items-center gap-0.5"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <span className="text-2xl font-extrabold text-foreground tracking-tight">
            Spy
          </span>
          <span className="text-2xl font-extrabold text-primary tracking-tight">
            Secret
          </span>
        </motion.div>

        {/* Subtitle with staggered fade */}
        <motion.p
          className="text-sm text-muted-foreground mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          {t("splash.subtitle")}
        </motion.p>

        {/* Loading dots */}
        <motion.div
          className="flex gap-1.5 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
