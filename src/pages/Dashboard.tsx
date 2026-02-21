import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Radar, Activity } from "lucide-react";
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

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/2 blur-[150px]" />
      </div>

      <main className="container relative py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Radar className="h-5 w-5 text-primary" />
              Dashboard
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1 text-mono">
              {mockProfiles.length} profiles tracked · scanning active
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="gradient-bg px-3.5 py-2 rounded-lg text-[13px] font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5 glow-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Profile
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Tracked", value: mockProfiles.length, sub: "profiles" },
            { label: "Follows", value: totalFollows, sub: "detected" },
            { label: "Unfollows", value: totalUnfollows, sub: "detected" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg surface-elevated border border-border/40 p-3 text-center noise overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
              <p className="text-2xl font-bold text-mono">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Profile Cards */}
        <div className="mb-8">
          <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Tracked Profiles
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
              <Activity className="h-3.5 w-3.5" />
              Activity Feed
            </h2>
            <div className="flex items-center gap-0.5 surface-elevated rounded-md p-0.5 border border-border/30">
              {(['all', 'follow', 'unfollow'] as EventFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all text-mono ${
                    filter === f
                      ? "bg-primary/10 text-primary border-glow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === 'all' ? 'ALL' : f === 'follow' ? 'FOLLOWS' : 'UNFOLLOWS'}
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
