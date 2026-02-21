import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, Mail, Lock, ArrowRight } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 aurora-bg" />
      <div className="absolute inset-0 mesh-dots" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm"
      >
        <Link to="/" className="flex items-center gap-2.5 justify-center mb-10">
          <div className="h-9 w-9 rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/20">
            <Heart className="h-4 w-4 text-primary-foreground fill-primary-foreground" />
          </div>
          <span className="text-lg font-extrabold">Track<span className="text-primary">IQ</span></span>
        </Link>

        <div className="rounded-3xl glass-card p-7 overflow-hidden relative">
          <div className="absolute inset-0 aurora-bg opacity-20" />

          <div className="relative">
            <div className="text-center mb-6">
              <span className="text-4xl">💕</span>
              <h1 className="text-xl font-extrabold mt-3">Willkommen zurück!</h1>
              <p className="text-[13px] text-muted-foreground mt-1">Log dich ein um weiterzustalken</p>
            </div>

            <form onSubmit={e => e.preventDefault()} className="space-y-3.5">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Deine Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-2xl bg-background/80 border border-border/50 pl-11 pr-4 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Passwort"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-2xl bg-background/80 border border-border/50 pl-11 pr-4 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                />
              </div>
              <button className="w-full pill-btn-primary py-3.5 justify-center text-sm">
                Einloggen
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="text-center text-[13px] text-muted-foreground mt-5">
              Noch kein Konto?{" "}
              <Link to="/signup" className="text-primary hover:underline font-semibold">
                Registrieren ✨
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
