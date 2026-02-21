import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Bell, Eye, Shield, Zap } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const features = [
  {
    icon: Eye,
    title: "Kein Instagram-Login",
    desc: "Gib einfach einen Username ein – kein Passwort, kein OAuth nötig.",
  },
  {
    icon: Zap,
    title: "Stündliche Updates",
    desc: "Unser System prüft alle 60 Minuten auf neue Follows und Unfollows.",
  },
  {
    icon: Bell,
    title: "Sofort-Benachrichtigungen",
    desc: "Werde sofort informiert, wenn sich etwas ändert.",
  },
  {
    icon: Shield,
    title: "100% Anonym",
    desc: "Niemand erfährt, dass du ein Profil überwachst.",
  },
];

const plans = [
  {
    name: "Free",
    price: "0",
    features: ["1 Profil", "Updates alle 6 Stunden", "Basis-Feed"],
    cta: "Kostenlos starten",
    highlighted: false,
  },
  {
    name: "Basic",
    price: "4.99",
    features: ["3 Profile", "Stündliche Updates", "Unfollow-Tracking", "Event-Verlauf"],
    cta: "Basic wählen",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "9.99",
    features: ["5 Profile", "Stündliche Updates", "Push-Benachrichtigungen", "Statistiken & Charts", "Prioritäts-Scanning"],
    cta: "Pro wählen",
    highlighted: false,
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] animate-pulse-glow" />
        </div>

        <div className="container relative pt-24 pb-20 md:pt-32 md:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary/80 px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6 border border-border/50">
              <span className="h-1.5 w-1.5 rounded-full gradient-bg" />
              Jetzt in der Beta
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Sieh in Echtzeit,{" "}
              <span className="gradient-text">wem jemand folgt</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Tracke öffentliche Instagram-Profile und erkenne neue Follows & Unfollows – ohne Login, 100% anonym.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="gradient-bg px-8 py-3.5 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2 glow"
              >
                Kostenlos starten
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard"
                className="px-8 py-3.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:border-border transition-all"
              >
                Demo ansehen
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="rounded-xl bg-card border border-border/50 p-6 hover:border-primary/20 transition-colors"
            >
              <div className="gradient-bg rounded-lg p-2 w-fit mb-4">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="container py-20" id="pricing">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">
            Einfache <span className="gradient-text">Preise</span>
          </h2>
          <p className="mt-3 text-muted-foreground">Starte kostenlos, upgrade wenn du mehr brauchst.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-6 border transition-all ${
                plan.highlighted
                  ? "gradient-border bg-card glow border-transparent"
                  : "bg-card border-border/50"
              }`}
            >
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold">€{plan.price}</span>
                <span className="text-muted-foreground text-sm">/Monat</span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full gradient-bg flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`mt-6 block text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${
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
      <footer className="border-t border-border/50 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="gradient-bg rounded-lg p-1.5">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">TrackIQ</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 TrackIQ. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
