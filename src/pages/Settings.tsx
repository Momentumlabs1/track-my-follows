import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { CreditCard, Bell, Trash2, ExternalLink, Heart, Sparkles } from "lucide-react";

const Settings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bubble-pattern" />
      </div>

      <main className="container relative max-w-2xl py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold mb-6">Einstellungen ⚙️</h1>

          <div className="space-y-4">
            {/* Subscription */}
            <div className="rounded-2xl surface-elevated border border-border/30 p-5 relative overflow-hidden">
              <div className="absolute inset-0 sparkle" />
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-4">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-sm">Dein Abo</h2>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">
                      Aktueller Plan:{" "}
                      <span className="font-bold text-primary">Free 🆓</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">1 Profil, Updates alle 6h</p>
                  </div>
                  <button className="gradient-bg px-4 py-2 rounded-full text-[13px] font-bold text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5">
                    Upgrade 💎
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="rounded-2xl surface-elevated border border-border/30 p-5 relative overflow-hidden">
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-4">
                  <Bell className="h-4 w-4 text-accent" />
                  <h2 className="font-semibold text-sm">Benachrichtigungen 🔔</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Neue Follows", desc: "Wenn er jemand neuem folgt 👀", on: true },
                    { label: "Unfollows", desc: "Wenn er jemanden entfolgt 💔", on: true },
                    { label: "Profil privat", desc: "Wenn ein Profil privat wird 🔒", on: false },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1.5">
                      <div>
                        <p className="text-[13px] font-medium">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                      </div>
                      <button className={`h-6 w-10 rounded-full relative transition-colors ${item.on ? 'gradient-bg' : 'bg-border'}`}>
                        <span className={`absolute top-1 h-4 w-4 rounded-full bg-foreground transition-all ${item.on ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-2xl surface-elevated border border-destructive/15 p-5 relative overflow-hidden">
              <div className="flex items-center gap-2.5 mb-3">
                <Trash2 className="h-4 w-4 text-destructive" />
                <h2 className="font-semibold text-sm">Danger Zone ⚠️</h2>
              </div>
              <p className="text-[13px] text-muted-foreground mb-3">
                Lösche dein Konto und alle Daten. Das geht nicht rückgängig!
              </p>
              <button className="px-4 py-2 rounded-full text-[13px] font-medium border border-destructive/20 text-destructive hover:bg-destructive/5 transition-colors">
                Konto löschen 😢
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Settings;
