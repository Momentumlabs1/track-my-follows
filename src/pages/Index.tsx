import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Bell, Eye, Shield, Sparkles, ChevronRight, HeartCrack, Zap } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const features = [
  {
    icon: Eye,
    title: "Kein Instagram-Login",
    desc: "Einfach Username eingeben. Kein Passwort, kein Risiko.",
    emoji: "🔮",
  },
  {
    icon: Zap,
    title: "Stündliche Updates",
    desc: "Check alle 60 Min auf neue Follows & Unfollows.",
    emoji: "⚡",
  },
  {
    icon: Bell,
    title: "Sofort-Alerts",
    desc: "Du erfährst sofort wenn sich was tut.",
    emoji: "🔔",
  },
  {
    icon: Shield,
    title: "100% Anonym",
    desc: "Niemand erfährt, dass du stalkst. Versprochen. 🤫",
    emoji: "🫣",
  },
];

const plans = [
  {
    name: "Free",
    price: "0",
    features: ["1 Profil", "Updates alle 6h", "Basis-Feed"],
    cta: "Kostenlos starten",
    highlighted: false,
  },
  {
    name: "Bestie",
    price: "4.99",
    features: ["3 Profile", "Stündliche Updates", "Unfollow-Tracking", "Event-Verlauf"],
    cta: "Bestie werden 💕",
    highlighted: true,
  },
  {
    name: "Queen",
    price: "9.99",
    features: ["5 Profile", "Stündliche Updates", "Push-Alerts", "Stats & Charts", "Priority-Scanning"],
    cta: "Queen Plan 👑",
    highlighted: false,
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bubble-pattern" />
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-primary/4 blur-[150px]" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[120px]" />
        </div>

        <div className="container relative pt-20 pb-24 md:pt-28 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full bg-primary/8 border border-primary/15 px-4 py-1.5 text-[12px] font-medium text-primary mb-8"
            >
              <Sparkles className="h-3 w-3" />
              Jetzt in der Beta 🎀
            </motion.div>

            <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold tracking-tight leading-[1.05]">
              Wem folgt dein
              <br />
              <span className="gradient-text">Crush wirklich?</span> 👀
            </h1>

            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              Tracke jedes öffentliche Instagram-Profil und sieh sofort wem er oder sie neu folgt. Anonym & ohne Login.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/signup"
                className="gradient-bg px-7 py-3 rounded-full text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2 glow-pink"
              >
                Jetzt starten
                <Heart className="h-4 w-4 fill-primary-foreground" />
              </Link>
              <Link
                to="/dashboard"
                className="px-7 py-3 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:border-primary/25 transition-all group flex items-center gap-2"
              >
                Demo ansehen
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-14 inline-flex items-center gap-3 rounded-2xl surface-elevated border border-border/30 px-5 py-3"
            >
              <div className="flex -space-x-2">
                {[1, 5, 10, 15].map(i => (
                  <img
                    key={i}
                    src={`https://i.pravatar.cc/40?img=${i}`}
                    className="h-7 w-7 rounded-full ring-2 ring-card object-cover"
                    alt=""
                  />
                ))}
              </div>
              <div className="text-left">
                <p className="text-[12px] font-semibold">2.400+ Girls</p>
                <p className="text-[11px] text-muted-foreground">nutzen TrackIQ bereits 💅</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold">So funktioniert's ✨</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { step: "1", title: "Username eingeben", desc: "Tipp den Instagram-Username ein, den du im Auge behalten willst", emoji: "🔍" },
            { step: "2", title: "Wir scannen", desc: "Unser System checkt stündlich alle neuen Follows & Unfollows", emoji: "📡" },
            { step: "3", title: "Du siehst alles", desc: "Bekomm sofort eine Notification wenn er jemand neuem folgt 👀", emoji: "💅" },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl surface-elevated border border-border/30 p-6 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
              <span className="text-3xl mb-3 block">{item.emoji}</span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full gradient-bg text-[11px] font-bold text-primary-foreground mb-2">
                {item.step}
              </span>
              <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl surface-elevated border border-border/30 p-5 hover:border-primary/15 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 sparkle opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="text-2xl mb-3 block relative">{f.emoji}</span>
              <h3 className="font-semibold text-sm mb-1 relative">{f.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed relative">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="container py-20" id="pricing">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">
            Wähle deinen <span className="gradient-text">Plan</span> 💎
          </h2>
          <p className="mt-3 text-muted-foreground text-sm">Starte kostenlos, upgrade wenn du mehr willst.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-2xl p-5 border transition-all relative overflow-hidden ${
                plan.highlighted
                  ? "surface-elevated gradient-border border-transparent glow-pink"
                  : "surface-elevated border-border/30"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute top-3 right-3 gradient-bg text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  Beliebtester 💕
                </span>
              )}
              <h3 className="font-bold text-lg">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-0.5">
                <span className="text-3xl font-extrabold">€{plan.price}</span>
                <span className="text-muted-foreground text-xs">/Monat</span>
              </div>
              <ul className="mt-5 space-y-2.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <Heart className="h-3 w-3 text-primary fill-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`mt-6 block text-center py-2.5 rounded-full text-[13px] font-semibold transition-all ${
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
      <footer className="border-t border-border/20 py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary fill-primary" />
            <span className="font-bold text-sm">Track<span className="text-primary">IQ</span></span>
          </div>
          <p className="text-[11px] text-muted-foreground">© 2026 TrackIQ · Made with 💕</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
