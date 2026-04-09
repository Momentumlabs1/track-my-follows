import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Shield, Zap, Eye, Users, TrendingDown, BarChart3, ChevronDown, ArrowRight, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SpyIcon } from "@/components/SpyIcon";
import { InstagramAvatar } from "@/components/InstagramAvatar";
import { isNativeApp } from "@/lib/native";
import logoWide from "@/assets/logo-wide.png";

interface ProfilePreview {
  username: string;
  avatar_url: string | null;
  full_name: string | null;
  follower_count: number | null;
  following_count: number | null;
  is_private: boolean;
}

function formatCount(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [preview, setPreview] = useState<ProfilePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (loading) return;
    if (user) { navigate("/dashboard", { replace: true }); return; }
    if (isNativeApp()) { navigate("/onboarding", { replace: true }); return; }
  }, [user, loading, navigate]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setError(null);
    setPreview(null);
    setSearching(true);

    const clean = query.trim().toLowerCase().replace(/^@/, "");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("check-username", {
        body: { username: clean },
      });
      if (fnError) throw fnError;
      if (!data?.exists) { setError("Account not found. Check the username and try again."); return; }
      if (data.is_private) { setError("This account is private. Only public accounts can be tracked."); return; }
      setPreview({
        username: clean,
        avatar_url: data.avatar_url || null,
        full_name: data.full_name || null,
        follower_count: data.follower_count ?? null,
        following_count: data.following_count ?? null,
        is_private: false,
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleTrack = () => {
    if (!preview) return;
    sessionStorage.setItem("pending_track_username", preview.username);
    navigate("/login?mode=register");
  };

  if (loading) return <div className="min-h-screen bg-background" />;

  const features = [
    { icon: <Shield className="h-5 w-5" />, title: "100% Anonymous", desc: "No Instagram login required. They'll never know." },
    { icon: <Eye className="h-5 w-5" />, title: "New Follows", desc: "See who they follow in real-time." },
    { icon: <Users className="h-5 w-5" />, title: "New Followers", desc: "Track every new follower they get." },
    { icon: <TrendingDown className="h-5 w-5" />, title: "Unfollows", desc: "Catch unfollows instantly." },
    { icon: <BarChart3 className="h-5 w-5" />, title: "Gender Analysis", desc: "See gender distribution of follows." },
    { icon: <Zap className="h-5 w-5" />, title: "Suspicion Score", desc: "AI-powered activity analysis." },
  ];

  const tiers = [
    {
      name: "Free", price: "€0", period: "", badge: null,
      features: ["1 account", "One-time scan", "Blurred results", "Spy magnifying glass"],
      excluded: ["Auto-scans", "Gender analysis", "Unfollow detection", "Suspicion score"],
      cta: "Get Started", ctaStyle: "bg-card border border-border/50 text-foreground",
      cardStyle: "bg-card border-border/30",
    },
    {
      name: "Basic", price: "€3.99", period: "/week", badge: "MOST POPULAR",
      features: ["4 accounts", "Scan every 2 hours", "Full follower lists", "Active Spy Agent"],
      excluded: ["Gender analysis", "Unfollow detection", "Suspicion score"],
      cta: "Get Basic", ctaStyle: "bg-primary text-primary-foreground",
      cardStyle: "border-primary/50",
    },
    {
      name: "Pro", price: "€8.99", period: "/week", badge: null,
      features: ["4 accounts", "Hourly scans", "Full follower lists", "Active Spy Agent", "Gender analysis", "Unfollow detection", "Suspicion score", "4 push scans/day"],
      excluded: [],
      cta: "Get Pro", ctaStyle: "bg-gradient-to-r from-primary to-accent text-primary-foreground",
      cardStyle: "border-primary/30",
    },
  ];

  const faqs = [
    { q: "Is this really anonymous?", a: "Yes. We never log into any Instagram account. We only analyze publicly available data. The tracked person will never know." },
    { q: "Do I need their Instagram password?", a: "No. You only need their public username. We use Instagram's public API to track changes." },
    { q: "How often are accounts scanned?", a: "Free: one-time scan. Basic: every 2 hours. Pro: every hour. You'll see new follows and unfollows within minutes." },
    { q: "Can I track private accounts?", a: "No. Only public Instagram accounts can be tracked. If an account goes private, tracking pauses automatically." },
    { q: "How do I cancel?", a: "Cancel anytime from your account settings. No questions asked." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-5 py-20">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative z-10 w-full max-w-2xl mx-auto text-center">
          {/* Logo */}
          <motion.img
            src={logoWide}
            alt="SpySecret"
            className="h-8 mx-auto mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          />

          {/* Spy Icon */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="mb-6"
          >
            <SpyIcon size={64} glow />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-extrabold tracking-tight leading-tight mb-3"
            style={{ fontSize: "clamp(1.75rem, 5vw, 3rem)" }}
          >
            Track any Instagram account.
            <br />
            <span className="gradient-text">Secretly.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-8 max-w-md mx-auto"
            style={{ fontSize: "1.0625rem" }}
          >
            See who they follow, who follows them, unfollows, and more — without them ever knowing.
          </motion.p>

          {/* Search Bar */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative max-w-md mx-auto mb-4"
          >
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-bold" style={{ fontSize: "1.125rem" }}>@</span>
              <input
                type="text"
                placeholder="Enter Instagram username"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setError(null); setPreview(null); }}
                className="w-full rounded-2xl bg-card border-2 border-primary/30 pl-12 pr-28 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                style={{ fontSize: "1rem" }}
              />
              <button
                type="submit"
                disabled={searching || !query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-all hover:opacity-90"
                style={{ fontSize: "0.875rem" }}
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Scan
              </button>
            </div>
          </motion.form>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-destructive text-sm font-medium mb-4"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Preview Card */}
          <AnimatePresence>
            {preview && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="max-w-sm mx-auto native-card p-5 mb-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div style={{ padding: 2, borderRadius: 9999, background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--brand-rose)))" }}>
                    <div className="rounded-full bg-background p-[2px]">
                      <InstagramAvatar src={preview.avatar_url} alt={preview.username} fallbackInitials={preview.username} size={56} />
                    </div>
                  </div>
                  <div className="text-start min-w-0">
                    <p className="font-extrabold text-foreground truncate" style={{ fontSize: "1.0625rem" }}>@{preview.username}</p>
                    {preview.full_name && <p className="text-muted-foreground truncate" style={{ fontSize: "0.8125rem" }}>{preview.full_name}</p>}
                  </div>
                </div>
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 rounded-xl bg-muted p-3 text-center">
                    <p className="font-extrabold text-foreground tabular-nums" style={{ fontSize: "1.25rem" }}>{formatCount(preview.follower_count)}</p>
                    <p className="text-muted-foreground" style={{ fontSize: "0.6875rem" }}>Followers</p>
                  </div>
                  <div className="flex-1 rounded-xl bg-muted p-3 text-center">
                    <p className="font-extrabold text-foreground tabular-nums" style={{ fontSize: "1.25rem" }}>{formatCount(preview.following_count)}</p>
                    <p className="text-muted-foreground" style={{ fontSize: "0.6875rem" }}>Following</p>
                  </div>
                </div>
                <button
                  onClick={handleTrack}
                  className="w-full py-3.5 rounded-xl font-bold text-primary-foreground flex items-center justify-center gap-2 min-h-[44px]"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--brand-rose)))", boxShadow: "0 4px 20px hsl(var(--primary) / 0.4)" }}
                >
                  Start Tracking <ArrowRight className="h-4 w-4" />
                </button>
                <p className="text-muted-foreground text-center mt-2" style={{ fontSize: "0.6875rem" }}>
                  Free account required · No credit card needed
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social Proof */}
          {!preview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-center gap-6 text-muted-foreground"
              style={{ fontSize: "0.8125rem" }}
            >
              <span className="flex items-center gap-1.5"><span className="text-primary font-bold">5,000+</span> profiles tracked</span>
              <span className="h-3 w-px bg-border" />
              <span className="flex items-center gap-1.5"><span className="text-primary font-bold">100%</span> anonymous</span>
            </motion.div>
          )}
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground/40" />
        </motion.div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="py-20 px-5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-extrabold mb-3" style={{ fontSize: "1.75rem" }}>
              Everything you need to <span className="text-primary">know</span>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto" style={{ fontSize: "0.9375rem" }}>
              Track follows, unfollows, gender patterns, and suspicious activity — all anonymously.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="native-card p-5"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary mb-3">
                  {f.icon}
                </div>
                <h3 className="font-bold text-foreground mb-1" style={{ fontSize: "0.9375rem" }}>{f.title}</h3>
                <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="py-20 px-5" id="pricing">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-extrabold mb-3" style={{ fontSize: "1.75rem" }}>
              Choose your <span className="text-primary">plan</span>
            </h2>
            <p className="text-muted-foreground" style={{ fontSize: "0.9375rem" }}>
              Start free. Upgrade when you need more.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-5 border ${tier.cardStyle} ${tier.name === "Basic" ? "bg-card ring-1 ring-primary/20" : "bg-card"}`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground font-bold" style={{ fontSize: "0.625rem", letterSpacing: "0.05em" }}>
                    {tier.badge}
                  </div>
                )}
                <h3 className="font-bold text-foreground mb-1" style={{ fontSize: "1.125rem" }}>{tier.name}</h3>
                <div className="flex items-baseline gap-0.5 mb-4">
                  <span className="font-extrabold text-foreground" style={{ fontSize: "2rem" }}>{tier.price}</span>
                  {tier.period && <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{tier.period}</span>}
                </div>
                <div className="space-y-2 mb-5">
                  {tier.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-foreground" style={{ fontSize: "0.8125rem" }}>{f}</span>
                    </div>
                  ))}
                  {tier.excluded.map((f) => (
                    <div key={f} className="flex items-center gap-2 opacity-40">
                      <X className="h-4 w-4 flex-shrink-0" />
                      <span style={{ fontSize: "0.8125rem" }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate(`/login?mode=register&plan=${tier.name.toLowerCase()}`)}
                  className={`w-full py-3 rounded-xl font-bold text-sm min-h-[44px] transition-all hover:opacity-90 ${tier.ctaStyle}`}
                >
                  {tier.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-20 px-5">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-extrabold text-center mb-10"
            style={{ fontSize: "1.75rem" }}
          >
            Frequently asked questions
          </motion.h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="native-card overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-start min-h-[44px]"
                >
                  <span className="font-semibold text-foreground" style={{ fontSize: "0.9375rem" }}>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-muted-foreground" style={{ fontSize: "0.875rem" }}>{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-border/30 py-10 px-5">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <SpyIcon size={24} />
            <span className="font-bold text-foreground" style={{ fontSize: "0.875rem" }}>SpySecret</span>
            <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>by Smart Trading AI GmbH</span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
            <Link to="/legal/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
            <Link to="/legal/datenschutz" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/legal/agb" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/legal/widerruf" className="hover:text-foreground transition-colors">Cancellation</Link>
          </div>
          <a href="mailto:info@spy-secret.com" className="text-muted-foreground hover:text-primary transition-colors" style={{ fontSize: "0.8125rem" }}>
            info@spy-secret.com
          </a>
        </div>
      </footer>
    </div>
  );
}
