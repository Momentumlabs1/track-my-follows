import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import { ProfileCard } from "@/components/ProfileCard";
import { EventFeedItem } from "@/components/EventFeedItem";
import { useTrackedProfiles, useFollowEvents } from "@/hooks/useTrackedProfiles";
import { useNavigate } from "react-router-dom";

type Tab = "news" | "profiles";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("profiles");
  const navigate = useNavigate();

  const { data: profiles = [], isLoading: profilesLoading } = useTrackedProfiles();
  const { data: events = [], isLoading: eventsLoading } = useFollowEvents();

  const isLoading = profilesLoading || eventsLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-5 pt-4 pb-0">
          <h1 className="text-xl font-extrabold">
            Spy-<span className="text-primary">Secret</span>
          </h1>
          {/* Tabs */}
          <div className="flex gap-0 mt-3">
            {(["news", "profiles"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 pb-2.5 text-[13px] font-semibold transition-colors ${
                  activeTab === tab
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {tab === "news" ? "What's new?" : "Profiles"}
                {activeTab === tab && (
                  <motion.div
                    layoutId="dashboard-tab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="px-5 py-5 pb-28">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : activeTab === "profiles" ? (
          <>
            {profiles.length > 0 ? (
              <div className="space-y-4">
                {profiles.map((profile, i) => (
                  <ProfileCard key={profile.id} profile={profile} index={i} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <span className="text-5xl block mb-4">👀</span>
                <p className="text-sm font-medium text-foreground">No profiles yet</p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Tap + to start tracking someone
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event, i) => (
                  <EventFeedItem key={event.id} event={event} index={i} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <span className="text-5xl block mb-4">🔍</span>
                <p className="text-sm font-medium text-foreground">No events yet</p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  We'll notify you when something happens
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => navigate("/add-profile")}
        className="fixed bottom-20 right-5 z-50 h-14 w-14 rounded-full gradient-bg text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
};

export default Dashboard;
