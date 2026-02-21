import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Heart, Sparkles } from "lucide-react";
import { useAddTrackedProfile } from "@/hooks/useTrackedProfiles";

interface AddProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddProfileModal({ isOpen, onClose }: AddProfileModalProps) {
  const [username, setUsername] = useState("");
  const addProfile = useAddTrackedProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    addProfile.mutate(username, {
      onSuccess: () => {
        setUsername("");
        onClose();
      },
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-xl"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div className="rounded-3xl glass-card p-7 overflow-hidden relative">
              <div className="absolute inset-0 aurora-bg opacity-30" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all z-10"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-center mb-6 relative">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl gradient-bg-aurora mb-4 shadow-lg shadow-primary/20">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <h2 className="font-bold text-lg">Wen willst du stalken? 👀</h2>
                <p className="text-[12px] text-muted-foreground mt-1.5">Gib den Instagram-Username ein</p>
              </div>

              <form onSubmit={handleSubmit} className="relative">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">@</span>
                  <input
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-2xl bg-background/80 border border-border/50 pl-9 pr-4 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                    autoFocus
                  />
                </div>

                <p className="mt-3 text-[11px] text-muted-foreground text-center">
                  Profil muss öffentlich sein 🔓
                </p>

                <button
                  type="submit"
                  disabled={!username.trim() || addProfile.isPending}
                  className="mt-5 w-full pill-btn-primary py-3.5 justify-center text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {addProfile.isPending ? (
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
