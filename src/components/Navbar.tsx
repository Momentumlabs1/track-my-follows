import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, LayoutDashboard, Settings, Sparkles } from "lucide-react";
import { mockEvents } from "@/lib/mockData";
import { useTranslation } from "react-i18next";
import logoSquare from "@/assets/logo-square.png";

export function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const unreadCount = mockEvents.filter(e => !e.isRead).length;
  const isLanding = location.pathname === "/";

  const navItems = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/pricing", label: t("nav.upgrade"), icon: Sparkles },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/20">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src={logoSquare} alt="Spy-Secret" className="h-9 w-9 rounded-2xl shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow" />
          <span className="text-base font-extrabold tracking-tight">Spy-<span className="text-primary">Secret</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-1 glass-card rounded-full px-1.5 py-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to}
                className={`relative px-4 py-2 rounded-full text-[13px] font-medium transition-all ${isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {isActive && <motion.div layoutId="nav-pill" className="absolute inset-0 rounded-full gradient-bg" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />}
                <span className="relative flex items-center gap-1.5"><item.icon className="h-3.5 w-3.5" />{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2.5 rounded-2xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && <span className="absolute top-1.5 end-1.5 h-2.5 w-2.5 rounded-full gradient-bg ring-2 ring-background" />}
          </button>
          {isLanding && (
            <>
              <Link to="/login" className="px-4 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">{t("landing.nav_login")}</Link>
              <Link to="/signup" className="pill-btn-primary px-5 py-2 text-[13px]">{t("landing.nav_start")}</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
