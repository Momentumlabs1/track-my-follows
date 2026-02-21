import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, Heart, HeartCrack, Clock, Sparkles } from "lucide-react";
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
          <span className="text-5xl block mb-4">🥲</span>
          <p className="text-muted-foreground text-sm">Profil nicht gefunden</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: Heart, value: follows.length, label: "Neue Follows", color: "from-brand-pink/20 to-brand-rose/10", iconClass: "text-primary fill-primary" },
    { icon: HeartCrack, value: unfollows.length, label: "Unfollows", color: "from-brand-coral/20 to-destructive/10", iconClass: "text-destructive" },
    { icon: Clock, value: "58m", label: "Nächster Scan", color: "from-brand-lavender/20 to-accent/10", iconClass: "text-accent" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 aurora-bg opacity-40" />
        <div className="absolute inset-0 mesh-dots" />
      </div>

      <main className="container relative py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zurück
        </Link>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-card p-6 md:p-8 mb-6"
        >
          <div className="absolute inset-0 aurora-bg opacity-20" />

          <div className="relative flex flex-col sm:flex-row items-start gap-6">
            <div className="relative flex-shrink-0">
              <div className="avatar-ring p-[3px]">
                <img
                  src={profile.profilePicUrl}
                  alt={profile.username}
                  className="h-24 w-24 rounded-full object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-card gradient-bg flex items-center justify-center">
                <Heart className="h-3 w-3 text-primary-foreground fill-primary-foreground" />
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold">@{profile.username}</h1>
                <span className="tag-pink">
                  <Eye className="h-2.5 w-2.5" /> Öffentlich
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{profile.fullName}</p>
              <div className="flex gap-8 mt-4">
                <div>
                  <span className="text-xl font-extrabold">{profile.followerCount.toLocaleString()}</span>
                  <span className="text-[11px] text-muted-foreground ml-1.5">Follower</span>
                </div>
                <div>
                  <span className="text-xl font-extrabold">{profile.followingCount.toLocaleString()}</span>
                  <span className="text-[11px] text-muted-foreground ml-1.5">Following</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2">
            <StatsChart />
          </div>
          <div className="space-y-4">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bento-card"
              >
                <div className="relative flex items-center gap-4">
                  <div className={`rounded-2xl bg-gradient-to-br ${stat.color} p-3 border border-primary/10`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconClass}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
            <Sparkles className="h-3 w-3 text-primary" />
            Was er/sie so treibt 👀
          </h2>
          <div className="space-y-3">
            {events.length > 0 ? (
              events.map((event, i) => (
                <EventFeedItem key={event.id} event={event} index={i} />
              ))
            ) : (
              <div className="text-center py-16 bento-card">
                <span className="text-5xl block mb-4">🔍</span>
                <p className="text-sm text-muted-foreground font-medium">Noch nix erkannt...</p>
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
