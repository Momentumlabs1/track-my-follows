import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SpyIcon } from "@/components/SpyIcon";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function WelcomeDialog() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const welcomeKey = user ? `welcome_shown_${user.id}` : null;

  useEffect(() => {
    if (!welcomeKey || localStorage.getItem(welcomeKey)) return;
    const timer = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(timer);
  }, [welcomeKey]);

  const handleClose = () => {
    if (welcomeKey) localStorage.setItem(welcomeKey, "1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-[340px] rounded-3xl border-primary/20 bg-card p-0 overflow-hidden">
        {/* Top glow */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

        <div className="relative px-6 pt-8 pb-6 text-center">
          {/* Animated spy icon */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
            className="flex justify-center mb-4"
          >
            <SpyIcon size={72} glow />
          </motion.div>

          <DialogTitle className="text-xl font-extrabold text-foreground mb-1">
            {t("welcome.title", "Willkommen bei Spy-Secret! 🕵️")}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground mb-5">
            {t("welcome.subtitle", "Dein geheimer Agent ist bereit.")}
          </DialogDescription>

          {/* 3 bullet points */}
          <div className="space-y-3 text-start mb-6">
            {[
              { emoji: "👀", text: t("welcome.point_1", "Sieh wem er/sie wirklich folgt – 100% anonym") },
              { emoji: "📊", text: t("welcome.point_2", "1 Profil kostenlos tracken mit täglichen Updates") },
              { emoji: "🚀", text: t("welcome.point_3", "Upgrade auf Pro für stündliche Scans & volle Insights") },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.12 }}
                className="flex items-start gap-3"
              >
                <span className="text-lg flex-shrink-0">{item.emoji}</span>
                <p className="text-[13px] text-foreground/80 leading-snug">{item.text}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            onClick={handleClose}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-[14px] font-bold active:scale-[0.97] transition-transform"
          >
            {t("welcome.cta", "Los geht's! 🚀")}
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
