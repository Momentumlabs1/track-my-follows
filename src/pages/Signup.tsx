import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const Signup = () => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: name }, emailRedirectTo: window.location.origin },
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success(t("auth.signup_success"));
    navigate("/dashboard");
  };

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
            <Eye className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-extrabold">Spy-<span className="text-primary">Secret</span></span>
        </Link>

        <div className="rounded-3xl glass-card p-7 overflow-hidden relative">
          <div className="absolute inset-0 aurora-bg opacity-20" />
          <div className="relative">
            <div className="text-center mb-6">
              <span className="text-4xl">🎀</span>
              <h1 className="text-xl font-extrabold mt-3">{t("auth.signup_title")}</h1>
              <p className="text-[13px] text-muted-foreground mt-1">{t("auth.signup_subtitle")}</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-3.5">
              <div className="relative">
                <User className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" placeholder={t("auth.name_placeholder")} value={name} onChange={e => setName(e.target.value)} required
                  className="w-full rounded-2xl bg-background/80 border border-border/50 ps-11 pe-4 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all" />
              </div>
              <div className="relative">
                <Mail className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" placeholder={t("auth.email_placeholder")} value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full rounded-2xl bg-background/80 border border-border/50 ps-11 pe-4 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all" />
              </div>
              <div className="relative">
                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="password" placeholder={t("auth.password_min")} value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                  className="w-full rounded-2xl bg-background/80 border border-border/50 ps-11 pe-4 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all" />
              </div>
              <button type="submit" disabled={loading} className="w-full pill-btn-primary py-3.5 justify-center text-sm disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t("auth.signup_button")} <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <p className="text-center text-[13px] text-muted-foreground mt-5">
              {t("auth.have_account")}{" "}
              <Link to="/login" className="text-primary hover:underline font-semibold">{t("auth.login_link")}</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
