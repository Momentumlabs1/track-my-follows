import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Loader2, Heart, Sparkles } from "lucide-react";

interface AddProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddProfileModal({ isOpen, onClose }: AddProfileModalProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setUsername("");
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div className="rounded-3xl surface-elevated border border-border/30 p-6 overflow-hidden relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px gradient-bg opacity-50" />

              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl gradient-bg-soft mb-3">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <h2 className="font-bold text-base">Wen willst du stalken? 👀</h2>
                <p className="text-[12px] text-muted-foreground mt-1">Gib den Instagram-Username ein</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <input
                    type="text"
                    placeholder="username eingeben..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-2xl bg-background border border-border/50 pl-9 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                    autoFocus
                  />
                </div>

                <p className="mt-2.5 text-[11px] text-muted-foreground text-center">
                  Profil muss öffentlich sein 🔓
                </p>

                <button
                  type="submit"
                  disabled={!username.trim() || loading}
                  className="mt-4 w-full gradient-bg rounded-2xl py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Wird gesucht...
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4" />
                      Tracken starten 💕
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
