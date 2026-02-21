import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, Heart, LayoutDashboard, Settings, Sparkles, Zap } from "lucide-react";
import { mockEvents } from "@/lib/mockData";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pricing", label: "Upgrade", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const location = useLocation();
  const unreadCount = mockEvents.filter(e => !e.isRead).length;
  const isLanding = location.pathname === "/";

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/30">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative h-8 w-8 rounded-xl gradient-bg flex items-center justify-center">
            <Heart className="h-4 w-4 text-primary-foreground fill-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight">
            Track<span className="text-primary">IQ</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-0.5">
          {navItems.map(item => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-primary/10 border border-primary/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full gradient-bg" />
            )}
          </button>
          {isLanding && (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Einloggen
              </Link>
              <Link
                to="/signup"
                className="gradient-bg px-4 py-1.5 rounded-full text-[13px] font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Starten ✨
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
