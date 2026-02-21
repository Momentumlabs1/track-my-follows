import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Heart, Sparkles, TrendingUp, TrendingDown, Users, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProfileCard } from "@/components/ProfileCard";
import { EventFeedItem } from "@/components/EventFeedItem";
import { AddProfileModal } from "@/components/AddProfileModal";
import { useTrackedProfiles, useFollowEvents } from "@/hooks/useTrackedProfiles";

type EventFilter = 'all' | 'follow' | 'unfollow';

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<EventFilter>('all');

  const { data: profiles = [], isLoading: profilesLoading } = useTrackedProfiles();
  const { data: events = [], isLoading: eventsLoading } = useFollowEvents();

  const filteredEvents = events.filter(e =>
    filter === 'all' ? true : e.event_type === filter
  );

  const totalFollows = events.filter(e => e.event_type === 'follow').length;
  const totalUnfollows = events.filter(e => e.event_type === 'unfollow').length;

  const stats = [
    { value: profiles.length, label: "Profile", icon: Users, color: "from-brand-lavender/20 to-brand-pink/10" },
    { value: totalFollows, label: "Neue Follows", icon: TrendingUp, color: "from-brand-pink/20 to-brand-rose/10" },
    { value: totalUnfollows, label: "Unfollows", icon: TrendingDown, color: "from-brand-coral/20 to-brand-peach/10" },
  ];

  const isLoading = profilesLoading || eventsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 aurora-bg opacity-50" />
        <div className="absolute inset-0 mesh-dots" />
      </div>

      <main className="container relative py-8 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              Dashboard 💅
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1.5">
              {profiles.length} Profile im Blick · Scanning aktiv
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="pill-btn-primary px-5 py-2.5 text-[13px]"
          >
            <Plus className="h-3.5 w-3.5" />
            Stalken 👀
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats - Bento */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bento-card text-center group"
                >
                  <div className={`inline-flex items-center justify-center h-10 w-10 rounded-2xl bg-gradient-to-br ${stat.color} border border-primary/10 mb-3 mx-auto`}>
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-3xl font-extrabold">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Profile Cards */}
            <div className="mb-10">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <Heart className="h-3 w-3 text-primary fill-primary" />
                Deine Profile
              </h2>
              {profiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profiles.map((profile, i) => (
                    <ProfileCard key={profile.id} profile={profile} index={i} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bento-card">
                  <span className="text-5xl block mb-4">👀</span>
                  <p className="text-sm font-medium">Noch keine Profile?</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Fang an zu stalken, babe! 💕</p>
                </div>
              )}
            </div>

            {/* Event Feed */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Was ist passiert? 👀
                </h2>
                <div className="flex items-center gap-1 glass-card rounded-full p-1">
                  {(['all', 'follow', 'unfollow'] as EventFilter[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                        filter === f
                          ? "gradient-bg text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f === 'all' ? 'Alles' : f === 'follow' ? 'Follows 💕' : 'Unfollows 💔'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event, i) => (
                    <EventFeedItem key={event.id} event={event} index={i} />
                  ))
                ) : (
                  <div className="text-center py-16 bento-card">
                    <span className="text-5xl block mb-4">🔍</span>
                    <p className="text-sm font-medium">Noch keine Events</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Wir scannen weiter, keine Sorge 💕</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <AddProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Dashboard;
