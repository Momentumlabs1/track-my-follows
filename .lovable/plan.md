

## Fix: Label-Farbe & "Zuletzt gefolgt" Avatare

### 1. Label "Spion angesetzt auf" → Schwarz
**Problem:** `text-foreground/50` ist im Dark Mode weiß/grau, aber der Hintergrund ist rosa/weiß.

**Lösung:** Ändere zu `text-black/60` (hardcoded schwarz).

**Datei:** `src/pages/Dashboard.tsx` (Zeile ~192)

---

### 2. "Zuletzt gefolgt" zeigt nur 1 Avatar

**Problem:** `useFollowEvents` holt nur **Änderungen** aus `follow_events` — nicht die komplette Following-Baseline.

**Lösung:** 
- Neuen Hook `useRecentFollowings(profileId)` erstellen → holt aus `profile_followings` die letzten 6-10 Einträge sortiert nach `first_seen_at DESC`
- In `ProfileCard.tsx` diesen Hook nutzen statt `useFollowEvents`

**Dateien:**
- `src/hooks/useProfileFollowings.ts` — neuen Query hinzufügen
- `src/components/ProfileCard.tsx` — Hook austauschen

```typescript
// Neuer Hook
export function useRecentFollowings(profileId?: string) {
  return useQuery({
    queryKey: ["recent_followings", profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profile_followings")
        .select("username, avatar_url, first_seen_at")
        .eq("tracked_profile_id", profileId)
        .order("first_seen_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
    enabled: !!profileId,
  });
}
```

