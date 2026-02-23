import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Bell, Eye, Shield, Sparkles, ChevronRight, Zap, Star, Crown, Check, Lock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useRef } from "react";

const features = [
  { icon: Eye, title: "Kein Login nötig", desc: "Username eingeben – dein Agent startet sofort die Überwachung.", emoji: "🕵️", color: "from-brand-pink/20 to-brand-rose/10" },
  { icon: Zap, title: "Stündliche Scans", desc: "Dein Agent checkt alle 60 Min auf neue Follows & Unfollows.", emoji: "⚡", color: "from-brand-lavender/20 to-brand-pink/10" },
  { icon: Bell, title: "Geheim-Alerts", desc: "Sofortige Benachrichtigung wenn sich was tut.", emoji: "🔔", color: "from-brand-peach/20 to-brand-coral/10" },
  { icon: Shield, title: "100% Unsichtbar", desc: "Niemand erfährt von deiner Mission. Versprochen. 🤫", emoji: "🫣", color: "from-brand-mint/20 to-brand-lavender/10" },
];

const plans = [
  { name: "Rookie", emoji: "🕵️", price: "0", features: ["1 Zielperson", "Updates alle 6h", "Basis-Feed"], cta: "Mission starten", highlighted: false },
  { name: "Agent", emoji: "🔍", price: "4.99", features: ["3 Zielpersonen", "Stündliche Scans", "Unfollow-Tracking", "Event-Verlauf"], cta: "Agent werden", highlighted: true },
  { name: "Spymaster", emoji: "🎯", price: "9.99", features: ["5 Zielpersonen", "Stündliche Scans", "Push-Alerts", "Stats & Charts", "Priority-Scanning"], cta: "Spymaster Plan", highlighted: false },
];

const Landing = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center">
        {/* Animated aurora background */}
        <div className="absolute inset-0 aurora-bg" />
        <div className="absolute inset-0 mesh-dots" />
        
        {/* Floating orbs */}
        <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-primary/8 blur-[100px] animate-float" />
        <div className="absolute bottom-20 right-[15%] w-96 h-96 rounded-full bg-accent/6 blur-[120px] animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/5 animate-rotate-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-accent/5 animate-rotate-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl mx-auto text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full glass-card px-5 py-2 text-[12px] font-semibold text-primary mb-10"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 gradient-bg" />
              </span>
              Geheime Beta-Mission 🕵️
            </motion.div>

            <h1 className="text-[clamp(2.8rem,7vw,5.5rem)] font-extrabold tracking-tight leading-[0.95]">
              Wem folgt dein
              <br />
              <span className="gradient-text">Crush heimlich?</span>
            </h1>

            <p className="mt-7 text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Dein geheimer Agent überwacht jedes öffentliche Instagram-Profil und meldet dir <span className="text-foreground font-medium">sofort</span> neue Follows. Unsichtbar & ohne Login.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="pill-btn-primary px-8 py-3.5 text-sm"
              >
                Mission starten
                <Eye className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard"
                className="pill-btn-ghost px-8 py-3.5 text-sm group"
              >
                Demo ansehen
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-16 inline-flex items-center gap-4 glass-card rounded-2xl px-6 py-4"
            >
              <div className="flex -space-x-3">
                {[1, 5, 10, 15, 20].map(i => (
                  <div key={i} className="avatar-ring">
                    <img
                      src={`https://i.pravatar.cc/40?img=${i}`}
                      className="h-8 w-8 rounded-full object-cover"
                      alt=""
                    />
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="h-3 w-3 text-brand-peach fill-brand-peach" />
                  ))}
                </div>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  <span className="text-foreground font-semibold">2.400+</span> Agentinnen im Einsatz 🕵️‍♀️
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* How it works - Bento Grid */}
      <section className="container py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="tag-pink mb-4">Deine Mission</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4">Drei Steps zur <span className="gradient-text">Geheim-Mission</span> 🕵️</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { step: "01", title: "Zielperson eingeben", desc: "Tipp den Instagram-Username deiner Zielperson ein", emoji: "🎯" },
            { step: "02", title: "Agent überwacht", desc: "Dein Agent scannt stündlich alle neuen Follows & Unfollows", emoji: "🕵️" },
            { step: "03", title: "Du weißt alles", desc: "Geheim-Alert sobald deine Zielperson jemand neuem folgt", emoji: "🔓" },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="bento-card group text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="text-4xl mb-4 block relative">{item.emoji}</span>
              <span className="inline-block gradient-text text-xs font-black tracking-widest mb-2">{item.step}</span>
              <h3 className="font-bold text-base mb-2 relative">{item.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed relative">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features - Bento Layout */}
      <section className="container py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bento-card group flex items-start gap-4"
            >
              <div className={`flex-shrink-0 rounded-2xl bg-gradient-to-br ${f.color} p-3.5 border border-primary/10`}>
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="relative">
                <h3 className="font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="container py-24" id="pricing">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="tag-lavender mb-4">Geheim-Pläne</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-4">
            Wähle deine <span className="gradient-text">Clearance</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-sm">Starte kostenlos, upgrade für mehr Zielpersonen.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-3xl p-6 transition-all overflow-hidden ${
                plan.highlighted
                  ? "glass-card gradient-border border-transparent glow-pink scale-[1.03]"
                  : "glass-card"
              }`}
            >
              {plan.highlighted && (
               <span className="absolute top-4 right-4 gradient-bg text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full">
                  Top-Agent 🔍
                </span>
              )}
              <span className="text-3xl">{plan.emoji}</span>
              <h3 className="text-lg font-bold mt-2">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">€{plan.price}</span>
                <span className="text-muted-foreground text-xs">/Monat</span>
              </div>
              <ul className="mt-6 space-y-3">
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
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-3xl mx-auto rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 gradient-bg opacity-90" />
          <div className="absolute inset-0 mesh-dots opacity-20" />
          <div className="relative text-center py-16 px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">
              Bereit für deine Mission? 🕵️
            </h2>
            <p className="mt-3 text-primary-foreground/70 text-sm max-w-md mx-auto">
              Starte jetzt kostenlos und überwache in Echtzeit, wem dein Crush folgt.
            </p>
            <Link
              to="/signup"
              className="mt-8 inline-flex items-center gap-2 bg-primary-foreground text-primary px-8 py-3.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Mission starten
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/15 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl gradient-bg flex items-center justify-center">
              <Eye className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Spy-<span className="text-primary">Secret</span></span>
          </div>
          <p className="text-[11px] text-muted-foreground">© 2026 Spy-Secret · Made with 🕵️</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
