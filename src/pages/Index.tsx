import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Activity, Bell, Eye, Shield, Zap, Radar, ChevronRight, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const features = [
  {
    icon: Eye,
    title: "No Instagram Login",
    desc: "Just enter a username. No passwords, no OAuth, no risk.",
    accent: "primary",
  },
  {
    icon: Radar,
    title: "Hourly Scanning",
    desc: "Our system checks every 60 minutes for new follows and unfollows.",
    accent: "primary",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    desc: "Get notified the moment something changes.",
    accent: "accent",
  },
  {
    icon: Shield,
    title: "100% Anonymous",
    desc: "Nobody will ever know you're watching.",
    accent: "accent",
  },
];

const plans = [
  {
    name: "Free",
    price: "0",
    features: ["1 profile", "6h scan interval", "Basic feed"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Basic",
    price: "4.99",
    features: ["3 profiles", "1h scan interval", "Unfollow tracking", "Event history"],
    cta: "Get Basic",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "9.99",
    features: ["5 profiles", "1h scan interval", "Push notifications", "Analytics", "Priority scanning"],
    cta: "Go Pro",
    highlighted: false,
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 grid-pattern opacity-40" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/3 blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-brand-cyan/3 blur-[120px]" />
          {/* Scan line */}
          <div className="absolute inset-x-0 h-px gradient-bg opacity-10 animate-scan" />
        </div>

        <div className="container relative pt-20 pb-24 md:pt-28 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 border border-primary/15 px-3 py-1 text-[11px] font-medium text-primary mb-8 text-mono tracking-wider uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Now in Beta
            </div>

            <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold tracking-tight leading-[1.05]">
              See who they
              <br />
              <span className="gradient-text">follow in real-time</span>
            </h1>

            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Track any public Instagram profile. Detect new follows & unfollows automatically. No login required.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/signup"
                className="gradient-bg px-6 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2 glow-primary"
              >
                Start Tracking
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/dashboard"
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground border border-border/60 hover:border-primary/25 transition-all group flex items-center gap-2"
              >
                View Demo
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Mock terminal */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-16 mx-auto max-w-md"
            >
              <div className="rounded-xl surface-elevated border border-border/40 overflow-hidden noise">
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/30">
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-rose/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-gold/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-primary/60" />
                  <span className="ml-2 text-[10px] text-muted-foreground text-mono">trackiq — scanner</span>
                </div>
                <div className="p-4 text-left font-mono text-[12px] leading-relaxed text-muted-foreground">
                  <p><span className="text-primary">$</span> scan @selenagomez</p>
                  <p className="text-foreground/60 mt-1">→ Fetching following list... <span className="text-primary">284 accounts</span></p>
                  <p className="text-foreground/60 mt-1">→ Comparing with last snapshot...</p>
                  <p className="mt-1"><span className="text-primary">✓</span> <span className="text-primary">+3 new follows</span> detected</p>
                  <p><span className="text-brand-rose">✕</span> <span className="text-brand-rose">-1 unfollow</span> detected</p>
                  <p className="mt-1 text-muted-foreground/60">→ Next scan in <span className="text-brand-gold">58m</span></p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20 relative">
        <div className="absolute inset-y-0 left-1/2 w-px bg-border/30 hidden lg:block" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              className="rounded-xl surface-elevated border border-border/40 p-5 hover:border-primary/20 transition-all noise overflow-hidden group relative"
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <f.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="container py-20" id="pricing">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">
            Simple <span className="gradient-text">pricing</span>
          </h2>
          <p className="mt-3 text-muted-foreground text-sm">Start free. Upgrade when you need more.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-xl p-5 border transition-all relative noise overflow-hidden ${
                plan.highlighted
                  ? "surface-elevated gradient-border border-transparent glow-primary"
                  : "surface-elevated border-border/40"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute top-3 right-3 gradient-bg text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md text-mono uppercase tracking-wider">
                  Popular
                </span>
              )}
              <h3 className="font-semibold">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-0.5">
                <span className="text-3xl font-bold">€{plan.price}</span>
                <span className="text-muted-foreground text-xs">/mo</span>
              </div>
              <ul className="mt-5 space-y-2.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <span className="h-1 w-1 rounded-full bg-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`mt-6 block text-center py-2 rounded-lg text-[13px] font-semibold transition-all ${
                  plan.highlighted
                    ? "gradient-bg text-primary-foreground hover:opacity-90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">track<span className="text-primary">iq</span></span>
          </div>
          <p className="text-[11px] text-muted-foreground text-mono">© 2026 TrackIQ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
