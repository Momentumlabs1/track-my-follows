

## Plan: Unbegrenzte Unfollow-Scans für Pro-Max Accounts

Pro-Max Accounts (max_tracked_profiles >= 9999) haben bereits unbegrenzte Push-Scans. Unfollow-Scans sind aber noch auf 2/Tag (Backend) bzw. 1/Tag (SpyStatusCard UI) limitiert. Das muss für Pro-Max genauso bypassed werden.

### Datei 1: `supabase/functions/unfollow-check/index.ts` (Zeile ~252-267)

Pro-Max-Check einbauen: Wenn der User `max_tracked_profiles >= 9999` hat, Budget-Check überspringen.

```typescript
// Nach dem Profile-Fetch: Subscription prüfen
const { data: sub } = await supabase
  .from("subscriptions")
  .select("max_tracked_profiles")
  .eq("user_id", user.id)
  .in("status", ["active", "trialing"])
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

const isProMax = (sub?.max_tracked_profiles ?? 0) >= 9999;

// Budget-Check nur wenn NICHT ProMax
if (!isProMax) {
  // existing budget logic...
  if (unfollowRemaining <= 0) return LIMIT_REACHED;
  // decrement budget
}
```

### Datei 2: `src/components/UnfollowCheckButton.tsx`

- `useSubscription()` liefert bereits `isProMax` — nutzen
- `loadChecks`: Wenn `isProMax`, `checksRemaining` auf `null` setzen (= kein Limit)
- `handleCheck`: Budget-Guard überspringen wenn `isProMax`
- Badge: `∞` statt `2/2` anzeigen wenn `isProMax`
- Button disabled-Logik: ProMax nie wegen Budget disablen

### Datei 3: `src/components/SpyStatusCard.tsx` (Zeile ~296-323)

- Unfollow-Scan Button: `isProMax`-Bypass wie bei Push-Scans
- `unfollowRemaining` auf 999 setzen wenn `isProMax`
- Badge: `∞` statt `0/1` anzeigen
- Progress-Bar ausblenden wenn `isProMax`

### Datei 4: `src/pages/SpyDetail.tsx` (Zeile ~45)

- `unfollowRemaining`: `isProMax ? 999 : ...` analog zu `pushRemaining`

### Deployment

Edge Function `unfollow-check` neu deployen.

