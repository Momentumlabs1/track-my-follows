import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Newspaper, Settings } from "lucide-react";
import { SpyIcon } from "@/components/SpyIcon";
import { useTranslation } from "react-i18next";
import { haptic } from "@/lib/native";

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const hiddenRoutes = ["/", "/splash", "/onboarding", "/login"];
  const isHidden = hiddenRoutes.includes(location.pathname) || location.pathname.startsWith("/analyzing") || location.pathname.startsWith("/legal") || location.pathname === "/spy";

  if (isHidden) return null;

  const navItems = [
    {
      to: "/feed",
      label: t("nav.feed", "Feed"),
      icon: (active: boolean) => <Newspaper className={`h-[22px] w-[22px] transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />,
      isActive: location.pathname === "/feed",
    },
    {
      to: "/dashboard",
      label: t("nav.spy", "Spy"),
      icon: (active: boolean) => <SpyIcon size={24} className={`transition-opacity ${active ? "" : "opacity-50"}`} />,
      isActive: location.pathname === "/dashboard" || location.pathname.startsWith("/profile/") || location.pathname === "/add-profile",
    },
    {
      to: "/settings",
      label: t("nav.settings"),
      icon: (active: boolean) => <Settings className={`h-[22px] w-[22px] transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />,
      isActive: location.pathname === "/settings",
    },
  ];

  return (
    <nav className="fixed bottom-0 start-0 end-0 z-50 glass-strong border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => haptic.light()}
            className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-h-[44px]"
          >
            {item.isActive && (
              <motion.div
                layoutId="bottom-nav-dot"
                className="absolute top-1.5 h-[3px] w-6 rounded-full gradient-pink"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
            {item.icon(item.isActive)}
            <span
              className={`text-[10px] font-semibold transition-colors ${
                item.isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
