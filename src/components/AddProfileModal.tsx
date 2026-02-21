import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Loader2, Radar } from "lucide-react";

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
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div className="rounded-2xl surface-elevated border border-border/40 p-6 noise overflow-hidden relative">
              {/* Decorative */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px gradient-bg opacity-60" />

              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Radar className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-sm">Track New Profile</h2>
                </div>
                <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <input
                    type="text"
                    placeholder="instagram username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg bg-background border border-border/60 pl-8 pr-4 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/30 transition-all"
                    autoFocus
                  />
                </div>

                <p className="mt-2.5 text-[11px] text-muted-foreground">
                  Profile must be public for tracking. Private profiles will be paused automatically.
                </p>

                <button
                  type="submit"
                  disabled={!username.trim() || loading}
                  className="mt-4 w-full gradient-bg rounded-lg py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Radar className="h-3.5 w-3.5" />
                      Start Tracking
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
