import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Sparkles, Settings, Heart } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pricing", label: "Upgrade", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  if (isLanding) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/20 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full gradient-bg"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <item.icon
                className={`h-5 w-5 transition-colors ${
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
