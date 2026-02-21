import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { CreditCard, Bell, Trash2, Shield } from "lucide-react";

const Settings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-2xl py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-8">Einstellungen</h1>

          <div className="space-y-6">
            {/* Subscription */}
            <div className="rounded-xl bg-card border border-border/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="gradient-bg rounded-lg p-2">
                  <CreditCard className="h-4 w-4 text-primary-foreground" />
                </div>
                <h2 className="font-semibold">Abonnement</h2>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Aktueller Plan: <span className="font-semibold text-primary">Free</span></p>
                  <p className="text-xs text-muted-foreground mt-1">1 Profil, Updates alle 6 Stunden</p>
                </div>
                <button className="gradient-bg px-4 py-2 rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                  Upgraden
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="rounded-xl bg-card border border-border/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-secondary p-2">
                  <Bell className="h-4 w-4 text-foreground" />
                </div>
                <h2 className="font-semibold">Benachrichtigungen</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Neue Follows", desc: "Benachrichtigung bei erkannten Follows" },
                  { label: "Unfollows", desc: "Benachrichtigung bei erkannten Unfollows" },
                  { label: "Profil-Status", desc: "Wenn ein Profil privat wird" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <button className="h-6 w-11 rounded-full bg-primary relative transition-colors">
                      <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-primary-foreground transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl bg-card border border-destructive/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </div>
                <h2 className="font-semibold">Gefahrenzone</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Lösche dein Konto und alle zugehörigen Daten unwiderruflich.
              </p>
              <button className="px-4 py-2 rounded-lg text-sm font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
                Konto löschen
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Settings;
