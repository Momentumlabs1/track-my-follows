import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,    
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, RefreshCw, Search, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";

const ADMIN_EMAIL = "info@spy-secret.com";
const SUPABASE_URL = "https://bqqmfajowxzkdcvmrtyd.supabase.co";

const isAdminUser = (email?: string | null) =>
  (email ?? "").trim().toLowerCase() === ADMIN_EMAIL;

interface AdminData {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  totalTrackedProfiles: number;
  totalSpyProfiles: number;
  apiCallsToday: number;
  apiCostToday: number;
  apiCallsThisMonth: number;
  apiCostThisMonth: number;
  callsByFunction: { function_name: string; count: number }[];
  callsPerHour: { hour: string; count: number }[];
  users: {
    id: string;
    email: string;
    created_at: string;
    plan: "free" | "pro";
    subscription_status: string | null;
    current_period_end: string | null;
    tracked_profiles_count: number;
    spy_profiles_count: number;
    total_follow_events: number;
    last_active: string | null;
  }[];
  profiles: {
    id: string;
    instagram_username: string;
    owner_email: string;
    has_spy: boolean;
    baseline_complete: boolean;
    following_count: number;
    follower_count: number;
    last_scanned_at: string | null;
    follow_events_count: number;
    is_private: boolean;
  }[];
  recentCalls: {
    created_at: string;
    function_name: string;
    profile_username: string | null;
    status_code: number | null;
  }[];
  dailyBudget: number;
  budgetUsed: number;
  budgetRemaining: number;
  projectedMonthlyCost: number;
  avgDailyCalls: number;
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-4 text-center">
      <div className="text-[28px] font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function relativeTime(dateStr: string | null) {
  if (!dateStr) return "—";
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: de });
}

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [profileSearch, setProfileSearch] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{
    type: "user" | "profile";
    id: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !isAdminUser(user.email)) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-stats`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setData(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdminUser(user?.email)) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const endpoint =
        deleteDialog.type === "user" ? "admin-delete-user" : "admin-delete-profile";
      const body =
        deleteDialog.type === "user"
          ? { userId: deleteDialog.id }
          : { profileId: deleteDialog.id };

      const res = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `HTTP ${res.status}`);
      }
      setDeleteDialog(null);
      fetchData();
    } catch (err: any) {
      alert("Fehler: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (!user || !isAdminUser(user.email)) return null;

  const budgetPercent = data
    ? Math.min(100, Math.round((data.budgetUsed / data.dailyBudget) * 100))
    : 0;
  const budgetColor =
    budgetPercent < 50
      ? "bg-green-500"
      : budgetPercent < 80
      ? "bg-yellow-500"
      : "bg-red-500";

  const maxCallsPerHour = data
    ? Math.max(...data.callsPerHour.map((h) => h.count), 1)
    : 1;

  const filteredUsers = data?.users.filter((u) =>
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  ) || [];

  const filteredProfiles = data?.profiles.filter((p) =>
    p.instagram_username.toLowerCase().includes(profileSearch.toLowerCase())
  ) || [];

  return (
    <motion.div
      className="min-h-screen bg-background pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3 pt-[calc(env(safe-area-inset-top)+12px)]">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Spy Secret Admin</h1>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 -mr-2"
          >
            <RefreshCw
              className={`h-5 w-5 text-muted-foreground ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <Tabs defaultValue="overview" className="px-4 mt-4">
        <TabsList className="w-full grid grid-cols-4 h-10 rounded-xl">
          <TabsTrigger value="overview" className="text-xs rounded-lg">Übersicht</TabsTrigger>
          <TabsTrigger value="users" className="text-xs rounded-lg">Users</TabsTrigger>
          <TabsTrigger value="profiles" className="text-xs rounded-lg">Profile</TabsTrigger>
          <TabsTrigger value="api" className="text-xs rounded-lg">API</TabsTrigger>
        </TabsList>

        {/* TAB 1: ÜBERSICHT */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : data ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <StatCard value={data.totalUsers} label="Users" />
                <StatCard value={data.proUsers} label="Pro" />
                <StatCard value={data.freeUsers} label="Free" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatCard value={data.totalTrackedProfiles} label="Profile" />
                <StatCard value={data.totalSpyProfiles} label="Spies" />
              </div>

              {/* API Kosten heute */}
              <div className="rounded-2xl border border-border/40 bg-card p-4">
                <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                  API-Kosten Heute
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xl font-bold">{data.apiCallsToday} Calls</span>
                  <span className="text-muted-foreground text-sm">
                    · ${data.apiCostToday.toFixed(2)}
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${budgetColor}`}
                    style={{ width: `${budgetPercent}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {budgetPercent}% vom Budget ({data.dailyBudget})
                </div>
              </div>

              {/* API Kosten Monat */}
              <div className="rounded-2xl border border-border/40 bg-card p-4">
                <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                  API-Kosten Monat
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold">
                    {data.apiCallsThisMonth.toLocaleString()} Calls
                  </span>
                  <span className="text-muted-foreground text-sm">
                    · ${data.apiCostThisMonth.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Calls per hour chart */}
              <div className="rounded-2xl border border-border/40 bg-card p-4">
                <div className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
                  Calls/Stunde (24h)
                </div>
                <div className="flex items-end gap-[2px] h-16">
                  {data.callsPerHour.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/70 rounded-t-sm min-h-[2px]"
                      style={{
                        height: `${(h.count / maxCallsPerHour) * 100}%`,
                      }}
                      title={`${new Date(h.hour).getHours()}:00 — ${h.count} Calls`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  {data.callsPerHour.length > 0 && (
                    <>
                      <span>{new Date(data.callsPerHour[0].hour).getHours()}:00</span>
                      <span>
                        {new Date(
                          data.callsPerHour[data.callsPerHour.length - 1].hour
                        ).getHours()}:00
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Calls by function */}
              <div className="rounded-2xl border border-border/40 bg-card p-4">
                <div className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
                  Calls nach Function
                </div>
                <div className="space-y-2">
                  {data.callsByFunction.map((f) => {
                    const maxFunc = Math.max(
                      ...data.callsByFunction.map((x) => x.count),
                      1
                    );
                    return (
                      <div key={f.function_name} className="flex items-center gap-2">
                        <span className="text-xs text-foreground w-28 truncate font-mono">
                          {f.function_name}
                        </span>
                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${(f.count / maxFunc) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {f.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </TabsContent>

        {/* TAB 2: USERS */}
        <TabsContent value="users" className="mt-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm font-semibold text-foreground">
              Users ({filteredUsers.length})
            </div>
            <div className="flex-1" />
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="E-Mail suchen..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="h-8 pl-8 pr-3 text-xs rounded-lg bg-muted border-none outline-none text-foreground placeholder:text-muted-foreground w-44"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : (
            filteredUsers
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              )
              .map((u) => (
                <div
                  key={u.id}
                  className="rounded-2xl border border-border/40 bg-card p-4"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="text-sm font-medium text-foreground truncate flex-1 mr-2">
                      {u.email}
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        u.plan === "pro"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {u.plan}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>
                      {u.tracked_profiles_count} Profile · {u.spy_profiles_count} Spy ·{" "}
                      {relativeTime(u.last_active)}
                    </div>
                    {u.subscription_status && (
                      <div>Status: {u.subscription_status}</div>
                    )}
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs"
                      onClick={() =>
                        setDeleteDialog({
                          type: "user",
                          id: u.id,
                          label: u.email,
                        })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Löschen
                    </Button>
                  </div>
                </div>
              ))
          )}
        </TabsContent>

        {/* TAB 3: PROFILE */}
        <TabsContent value="profiles" className="mt-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm font-semibold text-foreground">
              Profile ({filteredProfiles.length})
            </div>
            <div className="flex-1" />
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Username suchen..."
                value={profileSearch}
                onChange={(e) => setProfileSearch(e.target.value)}
                className="h-8 pl-8 pr-3 text-xs rounded-lg bg-muted border-none outline-none text-foreground placeholder:text-muted-foreground w-44"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : (
            filteredProfiles.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-border/40 bg-card p-4"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="text-sm font-medium text-foreground">
                    @{p.instagram_username}
                  </div>
                  {p.has_spy && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                      🕵️ SPY
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div className="truncate">Owner: {p.owner_email}</div>
                  <div>
                    {formatCount(p.following_count)} Following ·{" "}
                    {formatCount(p.follower_count)} Follower
                  </div>
                  <div>
                    Baseline: {p.baseline_complete ? "✅" : "❌"} · Scan:{" "}
                    {relativeTime(p.last_scanned_at)}
                  </div>
                  <div>Events: {p.follow_events_count}{p.is_private ? " · 🔒 Privat" : ""}</div>
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs"
                    onClick={() =>
                      setDeleteDialog({
                        type: "profile",
                        id: p.id,
                        label: `@${p.instagram_username}`,
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Löschen
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* TAB 4: API-CALLS */}
        <TabsContent value="api" className="mt-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : data ? (
            <>
              {/* Budget */}
              <div className="rounded-2xl border border-border/40 bg-card p-4">
                <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                  Budget
                </div>
                <div className="text-xl font-bold mb-1">
                  {data.budgetUsed.toLocaleString()} / {data.dailyBudget.toLocaleString()}
                </div>
                <div className="relative h-2 rounded-full bg-muted overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full transition-all ${budgetColor}`}
                    style={{ width: `${budgetPercent}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Verbleibend: {data.budgetRemaining.toLocaleString()} · Kosten: $
                  {data.apiCostToday.toFixed(2)}
                </div>
              </div>

              {/* Prognose */}
              <div className="rounded-2xl border border-border/40 bg-card p-4">
                <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                  Kosten-Prognose
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>
                    Ø {data.avgDailyCalls} Calls/Tag →{" "}
                    <span className="text-foreground font-semibold">
                      ~${data.projectedMonthlyCost.toFixed(2)}/Monat
                    </span>
                  </div>
                  <div>
                    Budget reicht für: ~
                    {data.avgDailyCalls > 0
                      ? Math.floor(
                          data.dailyBudget /
                            (data.avgDailyCalls / (data.totalUsers || 1))
                        )
                      : "∞"}{" "}
                    User
                  </div>
                </div>
              </div>

              {/* Recent calls */}
              <div className="rounded-2xl border border-border/40 bg-card p-4">
                <div className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
                  Letzte Calls
                </div>
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                  {data.recentCalls.map((c, i) => {
                    const time = new Date(c.created_at);
                    const timeStr = `${time.getHours().toString().padStart(2, "0")}:${time
                      .getMinutes()
                      .toString()
                      .padStart(2, "0")}`;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs font-mono"
                      >
                        <span className="text-muted-foreground w-10">{timeStr}</span>
                        <span className="text-foreground truncate flex-1">
                          {c.function_name}
                        </span>
                        <span className="text-muted-foreground truncate max-w-20">
                          {c.profile_username ? `@${c.profile_username}` : "—"}
                        </span>
                        <span
                          className={`w-7 text-right ${
                            c.status_code && c.status_code >= 400
                              ? "text-destructive"
                              : "text-green-400"
                          }`}
                        >
                          {c.status_code || "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDialog?.type === "user" ? "User löschen?" : "Profil löschen?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-foreground">
                {deleteDialog?.label}
              </span>{" "}
              und alle zugehörigen Daten werden unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Löscht..." : "Endgültig löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
