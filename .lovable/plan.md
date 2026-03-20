
Ziel: Diego-Seite bereinigen und Logik so umbauen, dass „Entfolgt“ nur noch echte **Outgoing-Unfollows** zeigt (wen der getrackte Account entfolgt hat), nicht „Follower verloren“.

1) Aktueller Stand (für deinen anderen Chat, exakt)
- DB für `53a7b35e-6d18-4a2d-96ae-f98a8c043665`:
  - `follow_events`: nur `follow` (58), **keine** `unfollow`.
  - `follower_events`: `lost` = 11.
- UI mischt beides:
  - `ProfileDetail.tsx`: Tab-Count `Entfolgt` = `unfollowedByThem.length + lostFollowerEvents.length`.
  - Darum siehst du 11 im Entfolgt-Tab, obwohl es keine outgoing unfollows gibt.
- Unfollow-Check mischt ebenfalls:
  - `unfollow-check` liefert `unfollows_found` **und** `lost_followers`.
  - Frontend summiert das als „Unfollows“.

2) Gewünschtes Verhalten (Fix-Ziel)
- „Entfolgt“ zeigt nur: `follow_events` mit `event_type in ('unfollow','unfollowed')` und `direction='following'`.
- „Follower verloren“ wird nicht mehr als „Entfolgt“ dargestellt.
- Diego-Seite soll danach nicht mehr die 11 als Entfolgt anzeigen.

3) Konkreter Umsetzungsplan
A. Profile-UI entkoppeln (`src/pages/ProfileDetail.tsx`)
- Tab-Count für `unfollowed` nur noch `unfollowedByThem.length`.
- Block „Follower verloren“ aus `unfollowed`-Tab entfernen.
- Optional (sauber): „Follower verloren“ in `new_followers`-Tab als eigene Sektion verschieben (separat benannt), damit Bedeutung klar bleibt.
- Info-Text im Unfollow-Bereich sprachlich auf outgoing unfollows präzisieren.

B. Unfollow-Feedback im UI korrigieren
- `src/components/UnfollowCheckButton.tsx`:
  - „Unfollows erkannt“ nur aus `unfollows_found`.
  - `lost_followers` nicht mehr in rotem Entfolgt-Total addieren.
- `src/components/SpyStatusCard.tsx` + `src/pages/SpyDetail.tsx`:
  - Toast-Gesamtsummen nicht mehr mit `lost_followers` als „unfollow“ vermischen.

C. Backend-Logik klarziehen (`supabase/functions/unfollow-check/index.ts`)
- Follower-Diff intern weiter nutzbar halten (Baseline-Konsistenz), aber:
  - `lost` nicht mehr als „Unfollow“-Zahl in Response/Tracking zählen.
  - `total_unfollows_detected` nur outgoing unfollows erhöhen.
  - `unfollow_checks.unfollows_found` nur outgoing unfollows.
- Optional kompatibel: `lost_followers` Feld weiterhin senden, aber semantisch getrennt (nicht als unfollow).

D. Diego-Daten bereinigen (Migration)
- Für Profil Diego die 11 `follower_events(event_type='lost')` löschen, damit die Seite sofort sauber ist.
- Falls nötig: zugehörigen `unfollow_checks`-Eintrag korrigieren oder entfernen, damit Historie nicht misleading bleibt.

4) Validierung nach Umsetzung
- SQL-Check:
  - `follow_events` unfollow-count für Diego > sollte 0 oder realer Wert sein.
  - `follower_events lost` für Diego nach Cleanup = 0.
- UI-Check auf `/profile/53a7...`:
  - Entfolgt-Tab zeigt nur outgoing unfollows.
  - Kein „Follower verloren“ mehr unter Entfolgt.
- Manueller Unfollow-Check:
  - Ergebnis trennt klar „entfolgt“ vs. sonstige Aktivität.

5) Dateien
- `src/pages/ProfileDetail.tsx`
- `src/components/UnfollowCheckButton.tsx`
- `src/components/SpyStatusCard.tsx`
- `src/pages/SpyDetail.tsx`
- `supabase/functions/unfollow-check/index.ts`
- `supabase/migrations/<neu>.sql`
