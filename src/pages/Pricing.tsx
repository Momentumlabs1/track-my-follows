import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const plans = [
  {
    name: "Free",
    price: "0",
    features: ["1 profile", "6h scan interval", "Basic event feed", "7 day history"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Basic",
    price: "4.99",
    features: ["3 profiles", "1h scan interval", "Unfollow tracking", "30 day history", "Email alerts"],
    cta: "Get Basic",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "9.99",
    features: ["5 profiles", "1h scan interval", "Push notifications", "Analytics & Charts", "Priority scanning", "Unlimited history"],
    cta: "Go Pro",
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/3 blur-[150px]" />
      </div>

      <main className="container relative py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <h1 className="text-3xl md:text-4xl font-bold">
            Choose your <span className="gradient-text">plan</span>
          </h1>
          <p className="mt-3 text-muted-foreground text-sm max-w-md mx-auto">
            Start free. Upgrade anytime. No hidden fees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-xl p-5 border transition-all relative noise overflow-hidden ${
                plan.highlighted
                  ? "surface-elevated gradient-border border-transparent glow-primary"
                  : "surface-elevated border-border/40"
              }`}
            >
              {plan.highlighted && (
                <div className="flex items-center gap-1 mb-3">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-[10px] text-mono text-primary uppercase tracking-wider font-semibold">Most Popular</span>
                </div>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-0.5">
                <span className="text-3xl font-bold text-mono">€{plan.price}</span>
                <span className="text-muted-foreground text-xs">/mo</span>
              </div>
              <ul className="mt-6 space-y-2.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-[13px]">
                    <Check className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`mt-7 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                  plan.highlighted
                    ? "gradient-bg text-primary-foreground hover:opacity-90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Pricing;
