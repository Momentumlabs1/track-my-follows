import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Heart } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const plans = [
  { name: "Rookie", emoji: "🕵️", price: "0", features: ["1 Zielperson", "Updates alle 6h", "Basis Event-Feed", "7 Tage Verlauf"], cta: "Mission starten", highlighted: false },
  { name: "Agent", emoji: "🔍", price: "4.99", features: ["3 Zielpersonen", "Stündliche Scans", "Unfollow-Tracking", "30 Tage Verlauf", "Email-Alerts"], cta: "Agent werden 🔍", highlighted: true },
  { name: "Spymaster", emoji: "🎯", price: "9.99", features: ["5 Zielpersonen", "Stündliche Scans", "Push-Notifications", "Stats & Charts", "Priority-Scanning", "Unbegrenzter Verlauf"], cta: "Spymaster Plan 🎯", highlighted: false },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 aurora-bg opacity-40" />
        <div className="absolute inset-0 mesh-dots" />
      </div>

      <main className="container relative py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="tag-lavender mb-4">Geheim-Pläne</span>
          <h1 className="text-3xl md:text-5xl font-extrabold mt-4">
            Wähle deine <span className="gradient-text">Clearance</span> 🔐
          </h1>
          <p className="mt-4 text-muted-foreground text-sm max-w-md mx-auto">
            Starte kostenlos. Keine versteckten Kosten. Upgrade für mehr Zielpersonen.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-3xl p-7 transition-all overflow-hidden ${
                plan.highlighted
                  ? "glass-card gradient-border border-transparent glow-pink scale-[1.03]"
                  : "glass-card"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute inset-0 aurora-bg opacity-15" />
              )}
              {plan.highlighted && (
                 <span className="relative inline-block gradient-bg text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full mb-4">
                  Top-Agent 🔍
                </span>
              )}
              <div className="relative">
                <span className="text-3xl">{plan.emoji}</span>
                <h3 className="text-xl font-extrabold mt-2">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">€{plan.price}</span>
                  <span className="text-muted-foreground text-xs">/Monat</span>
                </div>
                <ul className="mt-7 space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-[13px]">
                      <div className="h-4 w-4 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className={`mt-8 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold transition-all ${
                    plan.highlighted
                      ? "pill-btn-primary w-full justify-center"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 w-full"
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
