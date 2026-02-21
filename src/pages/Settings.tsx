import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { CreditCard, Bell, Trash2, ExternalLink } from "lucide-react";

const Settings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-pattern opacity-20" />
      </div>

      <main className="container relative max-w-2xl py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold mb-6">Settings</h1>

          <div className="space-y-4">
            {/* Subscription */}
            <div className="rounded-xl surface-elevated border border-border/40 p-5 noise overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-primary/20 to-transparent" />
              <div className="flex items-center gap-2.5 mb-4">
                <CreditCard className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">Subscription</h2>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    Current plan:{" "}
                    <span className="font-semibold text-primary text-mono">FREE</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">1 profile, 6h scan interval</p>
                </div>
                <button className="gradient-bg px-3.5 py-1.5 rounded-md text-[13px] font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5">
                  Upgrade
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="rounded-xl surface-elevated border border-border/40 p-5 noise overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-brand-gold/20 to-transparent" />
              <div className="flex items-center gap-2.5 mb-4">
                <Bell className="h-4 w-4 text-brand-gold" />
                <h2 className="font-semibold text-sm">Notifications</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: "New Follows", desc: "Alert when new follows are detected" },
                  { label: "Unfollows", desc: "Alert when unfollows are detected" },
                  { label: "Profile Status", desc: "Alert when a profile goes private" },
                ].map((item, i) => (
                  <div key={item.label} className="flex items-center justify-between py-1.5">
                    <div>
                      <p className="text-[13px] font-medium">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <button className={`h-5 w-9 rounded-full relative transition-colors ${i < 2 ? 'bg-primary' : 'bg-border'}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-primary-foreground transition-all ${i < 2 ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl surface-elevated border border-destructive/15 p-5 noise overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-destructive/20 to-transparent" />
              <div className="flex items-center gap-2.5 mb-3">
                <Trash2 className="h-4 w-4 text-destructive" />
                <h2 className="font-semibold text-sm">Danger Zone</h2>
              </div>
              <p className="text-[13px] text-muted-foreground mb-3">
                Permanently delete your account and all associated data.
              </p>
              <button className="px-3 py-1.5 rounded-md text-[13px] font-medium border border-destructive/20 text-destructive hover:bg-destructive/5 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Settings;
