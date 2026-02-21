import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, UserPlus, UserMinus, Radar, Activity, Clock } from "lucide-react";
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
          <p className="text-muted-foreground text-sm">Profile not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/3 blur-[150px]" />
      </div>

      <main className="container relative py-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl surface-elevated border border-border/40 p-5 md:p-6 mb-6 noise overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="relative flex-shrink-0">
              <div className="gradient-border rounded-full p-[2px]">
                <img
                  src={profile.profilePicUrl}
                  alt={profile.username}
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card bg-primary flex items-center justify-center">
                <Radar className="h-2 w-2 text-primary-foreground" />
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold">@{profile.username}</h1>
                <span className="flex items-center gap-1 text-[10px] text-mono rounded-md bg-primary/8 border border-primary/15 text-primary px-2 py-0.5 uppercase tracking-wider">
                  <Eye className="h-2.5 w-2.5" /> Public
                </span>
                <span className="flex items-center gap-1 text-[10px] text-mono rounded-md bg-primary/8 border border-primary/15 text-primary px-2 py-0.5 uppercase tracking-wider">
                  <Radar className="h-2.5 w-2.5" /> Active
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{profile.fullName}</p>
              <div className="flex gap-6 mt-3">
                <div>
                  <span className="text-lg font-bold text-mono">{profile.followerCount.toLocaleString()}</span>
                  <span className="text-[11px] text-muted-foreground ml-1.5">followers</span>
                </div>
                <div>
                  <span className="text-lg font-bold text-mono">{profile.followingCount.toLocaleString()}</span>
                  <span className="text-[11px] text-muted-foreground ml-1.5">following</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <StatsChart />
          </div>
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl surface-elevated border border-border/40 p-4 noise overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-primary/20 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-primary/10 border border-primary/15 p-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-mono">{follows.length}</p>
                  <p className="text-[11px] text-muted-foreground">new follows</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl surface-elevated border border-border/40 p-4 noise overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-brand-rose/20 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-brand-rose/10 border border-brand-rose/15 p-2">
                  <UserMinus className="h-4 w-4 text-brand-rose" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-mono">{unfollows.length}</p>
                  <p className="text-[11px] text-muted-foreground">unfollows</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl surface-elevated border border-border/40 p-4 noise overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-brand-gold/20 to-transparent" />
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-brand-gold/10 border border-brand-gold/15 p-2">
                  <Clock className="h-4 w-4 text-brand-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-mono">58<span className="text-sm text-muted-foreground">m</span></p>
                  <p className="text-[11px] text-muted-foreground">next scan</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
            <Activity className="h-3.5 w-3.5" />
            Timeline
          </h2>
          <div className="space-y-2">
            {events.length > 0 ? (
              events.map((event, i) => (
                <EventFeedItem key={event.id} event={event} index={i} />
              ))
            ) : (
              <div className="text-center py-12 surface-elevated rounded-xl border border-border/40">
                <Radar className="h-8 w-8 text-muted-foreground mx-auto mb-3 animate-pulse" />
                <p className="text-sm text-muted-foreground">No events detected yet.</p>
                <p className="text-[11px] text-muted-foreground mt-1">Scanning in progress...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileDetail;
