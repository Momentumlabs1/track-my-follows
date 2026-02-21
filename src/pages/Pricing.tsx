import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const plans = [
  {
    name: "Free",
    price: "0",
    period: "/Monat",
    features: ["1 Profil überwachen", "Updates alle 6 Stunden", "Basis Event-Feed", "7 Tage Verlauf"],
    cta: "Kostenlos starten",
    highlighted: false,
  },
  {
    name: "Basic",
    price: "4.99",
    period: "/Monat",
    features: ["3 Profile überwachen", "Stündliche Updates", "Unfollow-Tracking", "30 Tage Verlauf", "Event-Benachrichtigungen"],
    cta: "Basic wählen",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "9.99",
    period: "/Monat",
    features: ["5 Profile überwachen", "Stündliche Updates", "Push-Benachrichtigungen", "Statistiken & Charts", "Prioritäts-Scanning", "Unbegrenzter Verlauf"],
    cta: "Pro wählen",
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <h1 className="text-3xl md:text-5xl font-bold">
            Wähle deinen <span className="gradient-text">Plan</span>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Starte kostenlos und upgrade jederzeit. Keine versteckten Kosten.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-7 border transition-all ${
                plan.highlighted
                  ? "gradient-border bg-card glow border-transparent"
                  : "bg-card border-border/50"
              }`}
            >
              {plan.highlighted && (
                <span className="inline-block gradient-bg text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  Beliebtester Plan
                </span>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">€{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <ul className="mt-7 space-y-3.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`mt-8 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  plan.highlighted
                    ? "gradient-bg text-primary-foreground hover:opacity-90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Pricing;
