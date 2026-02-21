import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Bell, Trash2, Sparkles, ChevronRight } from "lucide-react";

const Settings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 aurora-bg opacity-30" />
        <div className="absolute inset-0 mesh-dots" />
      </div>

      <main className="container relative max-w-2xl py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-extrabold mb-8">Einstellungen ⚙️</h1>

          <div className="space-y-5">
            {/* Subscription */}
            <div className="bento-card">
              <div className="absolute inset-0 aurora-bg opacity-10" />
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="font-bold text-sm">Dein Abo</h2>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Aktueller Plan:{" "}
                      <span className="font-extrabold text-primary">Free ✨</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">1 Profil, Updates alle 6h</p>
                  </div>
                  <button className="pill-btn-primary px-5 py-2.5 text-[13px]">
                    Upgrade 💎
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bento-card">
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-5">
                  <Bell className="h-4 w-4 text-accent" />
                  <h2 className="font-bold text-sm">Benachrichtigungen 🔔</h2>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Neue Follows", desc: "Wenn er jemand neuem folgt 👀", on: true },
                    { label: "Unfollows", desc: "Wenn er jemanden entfolgt 💔", on: true },
                    { label: "Profil privat", desc: "Wenn ein Profil privat wird 🔒", on: false },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-[13px] font-semibold">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                      </div>
                      <button className={`h-7 w-12 rounded-full relative transition-all ${item.on ? 'gradient-bg shadow-lg shadow-primary/20' : 'bg-muted'}`}>
                        <span className={`absolute top-1 h-5 w-5 rounded-full bg-foreground transition-all ${item.on ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bento-card border-destructive/15">
              <div className="flex items-center gap-2.5 mb-4">
                <Trash2 className="h-4 w-4 text-destructive" />
                <h2 className="font-bold text-sm">Danger Zone ⚠️</h2>
              </div>
              <p className="text-[13px] text-muted-foreground mb-4">
                Lösche dein Konto und alle Daten. Das geht nicht rückgängig!
              </p>
              <button className="px-5 py-2.5 rounded-2xl text-[13px] font-semibold border border-destructive/20 text-destructive hover:bg-destructive/5 transition-colors">
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
