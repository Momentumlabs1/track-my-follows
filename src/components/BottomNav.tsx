import { Link, useLocation } from "react-router-dom";
import { Newspaper, Settings } from "lucide-react";
import { SpyIcon } from "@/components/SpyIcon";
import { useTranslation } from "react-i18next";
import { haptic } from "@/lib/native";

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const hiddenRoutes = ["/", "/splash", "/onboarding", "/login"];
  const isHidden = hiddenRoutes.includes(location.pathname) || location.pathname.startsWith("/analyzing") || location.pathname.startsWith("/legal") || location.pathname.startsWith("/oauth") || location.pathname === "/spy";

  if (isHidden) return null;

  const navItems = [
    {
      to: "/feed",
      label: t("nav.feed", "Feed"),
      icon: (active: boolean) => <Newspaper className="h-8 w-8" strokeWidth={active ? 2 : 1.5} />,
      isActive: location.pathname === "/feed",
    },
    {
      to: "/dashboard",
      label: t("nav.spy", "Spy"),
      icon: (active: boolean) => <SpyIcon size={32} className={active ? "" : "opacity-50"} />,
      isActive: location.pathname === "/dashboard" || location.pathname.startsWith("/profile/") || location.pathname === "/add-profile",
    },
    {
      to: "/settings",
      label: t("nav.settings"),
      icon: (active: boolean) => <Settings className="h-7 w-7" strokeWidth={active ? 2 : 1.5} />,
      isActive: location.pathname === "/settings",
    },
  ];

  return (
    <nav className="fixed bottom-0 start-0 end-0 z-50 bg-background pb-[env(safe-area-inset-bottom)]" style={{ borderTop: '0.5px solid hsl(var(--hairline))' }}>
      <div className="flex items-center justify-around pt-2" style={{ height: '72px' }}>
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => haptic.light()}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full min-h-[48px]"
          >
            <span className={item.isActive ? "text-primary" : "text-muted-foreground"}>
              {item.icon(item.isActive)}
            </span>
            <span className={`font-medium ${item.isActive ? "text-primary" : "text-muted-foreground"}`} style={{ fontSize: '0.75rem' }}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
