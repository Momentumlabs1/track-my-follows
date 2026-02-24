import { useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, Settings } from "lucide-react";
import { ProfileStoryRing } from "@/components/ProfileStoryRing";
import { EventFeedItem } from "@/components/EventFeedItem";
import { DaySeparator } from "@/components/DaySeparator";
import { useTrackedProfiles, useFollowEvents } from "@/hooks/useTrackedProfiles";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: profiles = [], isLoading: profilesLoading } = useTrackedProfiles();
  const { data: events = [], isLoading: eventsLoading } = useFollowEvents();

  const isLoading = profilesLoading || eventsLoading;

  // Group events by day
  const groupedEvents = useMemo(() => {
    const groups: { date: string; events: typeof events }[] = [];
    let currentDate = "";
    for (const event of events) {
      const eventDate = new Date(event.detected_at).toDateString();
      if (eventDate !== currentDate) {
        currentDate = eventDate;
        groups.push({ date: event.detected_at, events: [] });
      }
      groups[groups.length - 1].events.push(event);
    }
    return groups;
  }, [events]);

  // Check which profiles have new events (last 24h)
  const profilesWithNewEvents = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const ids = new Set<string>();
    events.forEach((e) => {
      if (new Date(e.detected_at).getTime() > cutoff) {
        ids.add(e.tracked_profile_id);
      }
    });
    return ids;
  }, [events]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-extrabold">
          Spy-<span className="gradient-text">Secret</span>
        </h1>
        <button
          onClick={() => navigate("/settings")}
          className="p-2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Story-style profile scroller */}
      {profiles.length > 0 && (
        <div className="px-4 py-3">
          <div className="flex gap-4 overflow-x-auto pb-1">
            {profiles.map((profile) => (
              <ProfileStoryRing
                key={profile.id}
                profile={profile}
                hasNewEvents={profilesWithNewEvents.has(profile.id)}
              />
            ))}
            <button
              onClick={() => navigate("/add-profile")}
              className="flex flex-col items-center gap-1.5 min-w-[68px]"
            >
              <div className="h-[57px] w-[57px] rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">{t("nav.add")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Event Feed */}
      <main className="px-4 pb-28">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-3">
            {groupedEvents.map((group, gi) => (
              <div key={group.date}>
                <DaySeparator date={group.date} />
                <div className="space-y-3">
                  {group.events.map((event, ei) => (
                    <EventFeedItem
                      key={event.id}
                      event={event}
                      index={gi * 10 + ei}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : profiles.length > 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">🔍</span>
            <p className="text-sm font-semibold text-foreground">{t("events.no_events")}</p>
            <p className="text-[12px] text-muted-foreground mt-1">{t("events.no_events_subtitle")}</p>
          </div>
        ) : (
          <div className="text-center py-20">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <span className="text-5xl block mb-4">👀</span>
              <p className="text-sm font-semibold text-foreground">{t("dashboard.no_profiles")}</p>
              <p className="text-[12px] text-muted-foreground mt-1 mb-6">{t("dashboard.add_first")}</p>
              <button
                onClick={() => navigate("/add-profile")}
                className="pill-btn-primary px-6 py-3 text-[14px]"
              >
                <Plus className="h-4 w-4" /> {t("nav.add")}
              </button>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
