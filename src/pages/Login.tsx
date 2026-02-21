import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Activity, Mail, Lock, ArrowRight } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute inset-0">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/3 blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <Activity className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold">track<span className="text-primary">iq</span></span>
        </Link>

        <div className="rounded-xl surface-elevated border border-border/40 p-6 noise overflow-hidden relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px gradient-bg opacity-40" />
          <h1 className="text-lg font-bold text-center mb-5">Welcome back</h1>

          <form onSubmit={e => e.preventDefault()} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg bg-background border border-border/60 pl-9 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/30 transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg bg-background border border-border/60 pl-9 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/30 transition-all"
              />
            </div>
            <button className="w-full gradient-bg py-2.5 rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 glow-primary">
              Sign In
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <p className="text-center text-[13px] text-muted-foreground mt-4">
            No account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
