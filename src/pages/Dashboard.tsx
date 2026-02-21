import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Heart, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProfileCard } from "@/components/ProfileCard";
import { EventFeedItem } from "@/components/EventFeedItem";
import { AddProfileModal } from "@/components/AddProfileModal";
import { mockProfiles, mockEvents } from "@/lib/mockData";

type EventFilter = 'all' | 'follow' | 'unfollow';

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<EventFilter>('all');

  const filteredEvents = mockEvents.filter(e =>
    filter === 'all' ? true : e.eventType === filter
  );

  const totalFollows = mockEvents.filter(e => e.eventType === 'follow').length;
  const totalUnfollows = mockEvents.filter(e => e.eventType === 'unfollow').length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bubble-pattern" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/3 blur-[150px]" />
      </div>

      <main className="container relative py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Dein Dashboard 💅
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              {mockProfiles.length} Profile im Blick · Scanning aktiv ✨
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="gradient-bg px-4 py-2 rounded-full text-[13px] font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5 glow-pink"
          >
            <Plus className="h-3.5 w-3.5" />
            Stalken 👀
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { value: mockProfiles.length, label: "Profile", emoji: "👤" },
            { value: totalFollows, label: "Neue Follows", emoji: "💕" },
            { value: totalUnfollows, label: "Unfollows", emoji: "💔" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl surface-elevated border border-border/30 p-3.5 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 sparkle" />
              <span className="text-lg relative">{stat.emoji}</span>
              <p className="text-2xl font-bold relative mt-1">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground relative">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Profile Cards */}
        <div className="mb-8">
          <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Heart className="h-3 w-3 text-primary fill-primary" />
            Deine Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mockProfiles.map((profile, i) => (
              <ProfileCard key={profile.id} profile={profile} index={i} />
            ))}
          </div>
        </div>

        {/* Event Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-primary" />
              Was ist passiert? 👀
            </h2>
            <div className="flex items-center gap-0.5 surface-elevated rounded-full p-0.5 border border-border/25">
              {(['all', 'follow', 'unfollow'] as EventFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                    filter === f
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === 'all' ? 'Alles' : f === 'follow' ? 'Follows 💕' : 'Unfollows 💔'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filteredEvents.map((event, i) => (
              <EventFeedItem key={event.id} event={event} index={i} />
            ))}
          </div>
        </div>
      </main>

      <AddProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Dashboard;
