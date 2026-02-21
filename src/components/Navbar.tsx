import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Bell, LayoutDashboard, Settings, Sparkles, Zap } from "lucide-react";
import { mockEvents } from "@/lib/mockData";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pricing", label: "Upgrade", icon: Zap },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const location = useLocation();
  const unreadCount = mockEvents.filter(e => !e.isRead).length;
  const isLanding = location.pathname === "/";

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/40">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative h-8 w-8 rounded-lg gradient-bg flex items-center justify-center overflow-hidden">
            <Activity className="h-4 w-4 text-primary-foreground relative z-10" />
            <div className="absolute inset-0 bg-background/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-base font-bold tracking-tight">
            track<span className="text-primary">iq</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-0.5">
          {navItems.map(item => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-md bg-primary/10 border-glow"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
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
          <button className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all">
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
                Sign in
              </Link>
              <Link
                to="/signup"
                className="gradient-bg px-3.5 py-1.5 rounded-md text-[13px] font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
