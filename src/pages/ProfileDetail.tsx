import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, UserPlus, UserMinus, Heart, HeartCrack, Clock, Sparkles } from "lucide-react";
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
          <p className="text-muted-foreground text-sm">Profil nicht gefunden 🥲</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bubble-pattern" />
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/3 blur-[150px]" />
      </div>

      <main className="container relative py-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zurück
        </Link>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl surface-elevated border border-border/30 p-5 md:p-6 mb-6 overflow-hidden relative"
        >
          <div className="absolute inset-0 sparkle" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
          
          <div className="relative flex flex-col sm:flex-row items-start gap-5">
            <div className="relative flex-shrink-0">
              <div className="gradient-border rounded-full p-[2px]">
                <img
                  src={profile.profilePicUrl}
                  alt={profile.username}
                  className="h-20 w-20 rounded-full object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card gradient-bg flex items-center justify-center">
                <Heart className="h-2.5 w-2.5 text-primary-foreground fill-primary-foreground" />
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold">@{profile.username}</h1>
                <span className="flex items-center gap-1 text-[10px] rounded-full bg-primary/10 border border-primary/15 text-primary px-2.5 py-0.5 font-medium">
                  <Eye className="h-2.5 w-2.5" /> Öffentlich
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{profile.fullName}</p>
              <div className="flex gap-6 mt-3">
                <div>
                  <span className="text-lg font-bold">{profile.followerCount.toLocaleString()}</span>
                  <span className="text-[11px] text-muted-foreground ml-1.5">Follower</span>
                </div>
                <div>
                  <span className="text-lg font-bold">{profile.followingCount.toLocaleString()}</span>
                  <span className="text-[11px] text-muted-foreground ml-1.5">Following</span>
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
              className="rounded-2xl surface-elevated border border-border/30 p-4 relative overflow-hidden"
            >
              <div className="absolute inset-0 sparkle" />
              <div className="relative flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 border border-primary/15 p-2.5">
                  <Heart className="h-4 w-4 text-primary fill-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{follows.length}</p>
                  <p className="text-[11px] text-muted-foreground">Neue Follows 💕</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl surface-elevated border border-border/30 p-4 relative overflow-hidden"
            >
              <div className="relative flex items-center gap-3">
                <div className="rounded-xl bg-destructive/10 border border-destructive/15 p-2.5">
                  <HeartCrack className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unfollows.length}</p>
                  <p className="text-[11px] text-muted-foreground">Unfollows 💔</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl surface-elevated border border-border/30 p-4 relative overflow-hidden"
            >
              <div className="absolute inset-0 sparkle" />
              <div className="relative flex items-center gap-3">
                <div className="rounded-xl bg-accent/10 border border-accent/15 p-2.5">
                  <Clock className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">58<span className="text-sm text-muted-foreground">m</span></p>
                  <p className="text-[11px] text-muted-foreground">Nächster Scan ⏳</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
            <Sparkles className="h-3 w-3 text-primary" />
            Was er/sie so treibt 👀
          </h2>
          <div className="space-y-2">
            {events.length > 0 ? (
              events.map((event, i) => (
                <EventFeedItem key={event.id} event={event} index={i} />
              ))
            ) : (
              <div className="text-center py-12 surface-elevated rounded-2xl border border-border/30">
                <span className="text-4xl block mb-3">🔍</span>
                <p className="text-sm text-muted-foreground">Noch nix erkannt...</p>
                <p className="text-[11px] text-muted-foreground mt-1">Wir scannen weiter, keine Sorge babe 💕</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileDetail;
