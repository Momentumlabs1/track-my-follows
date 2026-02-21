import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles, Heart, Crown } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const plans = [
  {
    name: "Free",
    emoji: "🆓",
    price: "0",
    features: ["1 Profil", "Updates alle 6h", "Basis Event-Feed", "7 Tage Verlauf"],
    cta: "Kostenlos starten",
    highlighted: false,
  },
  {
    name: "Bestie",
    emoji: "💕",
    price: "4.99",
    features: ["3 Profile", "Stündliche Updates", "Unfollow-Tracking", "30 Tage Verlauf", "Email-Alerts"],
    cta: "Bestie werden 💕",
    highlighted: true,
  },
  {
    name: "Queen",
    emoji: "👑",
    price: "9.99",
    features: ["5 Profile", "Stündliche Updates", "Push-Notifications", "Stats & Charts", "Priority-Scanning", "Unbegrenzter Verlauf"],
    cta: "Queen Plan 👑",
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bubble-pattern" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/3 blur-[150px]" />
      </div>

      <main className="container relative py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <h1 className="text-3xl md:text-4xl font-bold">
            Wähle deinen <span className="gradient-text">Plan</span> 💎
          </h1>
          <p className="mt-3 text-muted-foreground text-sm max-w-md mx-auto">
            Starte kostenlos. Keine versteckten Kosten. Upgrade wann du willst.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-3xl p-6 border transition-all relative overflow-hidden ${
                plan.highlighted
                  ? "surface-elevated gradient-border border-transparent glow-pink"
                  : "surface-elevated border-border/30"
              }`}
            >
              <div className="absolute inset-0 sparkle" />
              {plan.highlighted && (
                <span className="relative inline-block gradient-bg text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full mb-3">
                  Beliebtester 💕
                </span>
              )}
              <div className="relative">
                <span className="text-2xl">{plan.emoji}</span>
                <h3 className="text-lg font-bold mt-1">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-0.5">
                  <span className="text-3xl font-extrabold">€{plan.price}</span>
                  <span className="text-muted-foreground text-xs">/Monat</span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[13px]">
                      <Heart className="h-3 w-3 text-primary fill-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className={`mt-7 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[13px] font-bold transition-all ${
                    plan.highlighted
                      ? "gradient-bg text-primary-foreground hover:opacity-90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Pricing;
