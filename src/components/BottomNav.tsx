import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Sparkles, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const hiddenRoutes = ["/", "/login", "/add-profile"];
  const isHidden = hiddenRoutes.includes(location.pathname) || location.pathname.startsWith("/analyzing");

  if (isHidden) return null;

  const navItems = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/pricing", label: t("nav.upgrade"), icon: Sparkles },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 start-0 end-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to === "/dashboard" && location.pathname.startsWith("/profile/"));
          return (
            <Link key={item.to} to={item.to} className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full">
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  className="absolute top-0 start-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full gradient-bg"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <item.icon className={`h-5 w-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] font-semibold transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
