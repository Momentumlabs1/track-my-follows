import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Filter } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mockProfiles.length} Profile werden überwacht
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="gradient-bg px-4 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Profil hinzufügen
          </button>
        </div>

        {/* Profile Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {mockProfiles.map((profile, i) => (
            <ProfileCard key={profile.id} profile={profile} index={i} />
          ))}
        </div>

        {/* Event Feed */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">Aktivitäts-Feed</h2>
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
              {(['all', 'follow', 'unfollow'] as EventFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    filter === f
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === 'all' ? 'Alle' : f === 'follow' ? 'Follows' : 'Unfollows'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
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
