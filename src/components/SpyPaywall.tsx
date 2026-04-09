import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SpyIcon } from "@/components/SpyIcon";
import { isNativeApp, launchNativePaywall } from "@/lib/native";
import { useAuth } from "@/contexts/AuthContext";

interface SpyPaywallProps {
  open: boolean;
  onClose: () => void;
}

export function SpyPaywall({ open, onClose }: SpyPaywallProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSelect = (plan: string) => {
    onClose();
    if (isNativeApp() && user) {
      launchNativePaywall(user.id);
      return;
    }
    if (user) {
      // Existing user → go to Stripe checkout
      navigate(`/dashboard?upgrade=${plan}`);
    } else {
      // Guest → register first with plan intent
      navigate(`/login?mode=register&plan=${plan}`);
    }
  };

  const tiers = [
    {
      id: "free",
      name: "Free",
      price: "€0",
      period: "",
      highlight: false,
      features: [
        { text: "1 account", included: true },
        { text: "One-time scan", included: true },
        { text: "Spy magnifying glass", included: true },
        { text: "Follower lists visible", included: false },
        { text: "Auto-scans", included: false },
        { text: "Gender analysis", included: false },
        { text: "Unfollow detection", included: false },
      ],
    },
    {
      id: "basic",
      name: "Basic",
      price: "€3.99",
      period: "/week",
      highlight: true,
      badge: "POPULAR",
      features: [
        { text: "4 accounts", included: true },
        { text: "Scan every 2 hours", included: true },
        { text: "Full follower lists", included: true },
        { text: "Active Spy Agent", included: true },
        { text: "Gender analysis", included: false },
        { text: "Unfollow detection", included: false },
        { text: "Suspicion score", included: false },
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: "€8.99",
      period: "/week",
      highlight: false,
      features: [
        { text: "4 accounts", included: true },
        { text: "Hourly scans", included: true },
        { text: "Full follower lists", included: true },
        { text: "Active Spy Agent", included: true },
        { text: "Gender analysis", included: true },
        { text: "Unfollow detection", included: true },
        { text: "Suspicion score", included: true },
        { text: "4 push scans/day", included: true },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative z-10 w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground z-20">
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="text-center pt-2 pb-4">
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="mb-3"
              >
                <SpyIcon size={48} glow />
              </motion.div>
              <h2 className="font-extrabold text-foreground" style={{ fontSize: "1.375rem" }}>
                Unlock the Spy Agent
              </h2>
              <p className="text-muted-foreground mt-1" style={{ fontSize: "0.875rem" }}>
                Choose your plan to see everything
              </p>
            </div>

            {/* Tier Cards */}
            <div className="space-y-3 mb-4">
              {tiers.map((tier) => (
                <motion.div
                  key={tier.id}
                  whileTap={{ scale: 0.98 }}
                  className={`relative rounded-2xl p-4 border cursor-pointer transition-all ${
                    tier.highlight
                      ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/30 bg-card"
                  }`}
                  onClick={() => tier.id !== "free" ? handleSelect(tier.id) : handleSelect("free")}
                >
                  {tier.badge && (
                    <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold" style={{ fontSize: "0.5625rem", letterSpacing: "0.05em" }}>
                      {tier.badge}
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-foreground" style={{ fontSize: "1rem" }}>{tier.name}</h3>
                      <div className="flex items-baseline gap-0.5">
                        <span className="font-extrabold text-foreground" style={{ fontSize: "1.5rem" }}>{tier.price}</span>
                        {tier.period && <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{tier.period}</span>}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSelect(tier.id); }}
                      className={`px-4 py-2 rounded-xl font-bold text-sm min-h-[40px] transition-all ${
                        tier.highlight
                          ? "bg-primary text-primary-foreground"
                          : tier.id === "pro"
                          ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {tier.id === "free" ? "Continue free" : `Get ${tier.name}`}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {tier.features.map((f) => (
                      <div key={f.text} className={`flex items-center gap-1.5 ${f.included ? "" : "opacity-30"}`}>
                        <Check className={`h-3 w-3 flex-shrink-0 ${f.included ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-foreground" style={{ fontSize: "0.6875rem" }}>{f.text}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Legal */}
            <p className="text-center text-muted-foreground pb-2" style={{ fontSize: "0.6875rem" }}>
              Cancel anytime. Subscriptions auto-renew weekly.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
