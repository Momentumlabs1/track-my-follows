import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, UserPlus, UserMinus, BadgeCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { EventFeedItem } from "@/components/EventFeedItem";
import { StatsChart } from "@/components/StatsChart";
import { mockProfiles, mockEvents } from "@/lib/mockData";

const ProfileDetail = () => {
  const { id } = useParams();
  const profile = mockProfiles.find(p => p.id === id);
  const events = mockEvents.filter(e => e.profileId === id);
  const follows = events.filter(e => e.eventType === 'follow');
  const unfollows = events.filter(e => e.eventType === 'unfollow');

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Profil nicht gefunden.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Dashboard
        </Link>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border/50 p-6 md:p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="gradient-border rounded-full">
              <img
                src={profile.profilePicUrl}
                alt={profile.username}
                className="h-20 w-20 rounded-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">@{profile.username}</h1>
                <span className="flex items-center gap-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 px-2.5 py-1">
                  <Eye className="h-3 w-3" /> Öffentlich
                </span>
              </div>
              <p className="text-muted-foreground mt-1">{profile.fullName}</p>
              <div className="flex gap-6 mt-4">
                <div>
                  <span className="text-xl font-bold">{profile.followerCount.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground ml-1">Follower</span>
                </div>
                <div>
                  <span className="text-xl font-bold">{profile.followingCount.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground ml-1">Following</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <StatsChart />
          </div>
          <div className="space-y-4">
            <div className="rounded-xl bg-card border border-border/50 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-emerald-500/10 p-2">
                  <UserPlus className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{follows.length}</p>
                  <p className="text-xs text-muted-foreground">Neue Follows erkannt</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-card border border-border/50 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-destructive/10 p-2">
                  <UserMinus className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unfollows.length}</p>
                  <p className="text-xs text-muted-foreground">Unfollows erkannt</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h2 className="text-lg font-semibold mb-5">Timeline</h2>
          <div className="space-y-3">
            {events.length > 0 ? (
              events.map((event, i) => (
                <EventFeedItem key={event.id} event={event} index={i} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">
                Noch keine Events für dieses Profil erkannt.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileDetail;
