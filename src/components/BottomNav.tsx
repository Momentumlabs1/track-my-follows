import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, PlusCircle, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { haptic } from "@/lib/native";

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const hiddenRoutes = ["/", "/splash", "/onboarding", "/login", "/impressum", "/datenschutz"];
  const isHidden = hiddenRoutes.includes(location.pathname) || location.pathname.startsWith("/analyzing");

  if (isHidden) return null;

  const navItems = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: Home },
    { to: "/add-profile", label: t("nav.add"), icon: PlusCircle },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 start-0 end-0 z-50 glass-strong border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to === "/dashboard" && location.pathname.startsWith("/profile/"));
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => haptic.light()}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-h-[44px]"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-dot"
                  className="absolute top-1.5 h-[3px] w-6 rounded-full gradient-pink"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <item.icon
                className={`h-[22px] w-[22px] transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
