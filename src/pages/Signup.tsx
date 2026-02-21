import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, Mail, Lock, User, ArrowRight } from "lucide-react";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bubble-pattern" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-accent/4 blur-[150px]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <Heart className="h-5 w-5 text-primary fill-primary" />
          <span className="text-lg font-bold">Track<span className="text-primary">IQ</span></span>
        </Link>

        <div className="rounded-3xl surface-elevated border border-border/30 p-6 overflow-hidden relative">
          <div className="absolute inset-0 sparkle" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px gradient-bg opacity-40" />

          <div className="relative">
            <div className="text-center mb-5">
              <span className="text-3xl">🎀</span>
              <h1 className="text-lg font-bold mt-2">Join the Club!</h1>
            </div>

            <form onSubmit={e => e.preventDefault()} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Dein Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-2xl bg-background border border-border/50 pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Deine Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-2xl bg-background border border-border/50 pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Passwort"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-2xl bg-background border border-border/50 pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                />
              </div>
              <button className="w-full gradient-bg py-3 rounded-2xl text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 glow-pink">
                Account erstellen 💅
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="text-center text-[13px] text-muted-foreground mt-4">
              Schon dabei?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Einloggen 💕
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
