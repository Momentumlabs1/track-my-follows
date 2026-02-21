import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, Bell, Home, Settings, Zap } from "lucide-react";
import { mockEvents } from "@/lib/mockData";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/pricing", label: "Pricing", icon: Zap },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const location = useLocation();
  const unreadCount = mockEvents.filter(e => !e.isRead).length;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="gradient-bg rounded-lg p-1.5">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">TrackIQ</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-secondary"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full gradient-bg text-[10px] font-bold flex items-center justify-center text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </button>
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="gradient-bg px-4 py-2 rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Registrieren
          </Link>
        </div>
      </div>
    </nav>
  );
}
