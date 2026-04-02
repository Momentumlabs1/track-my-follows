

## Finaler Scan-Architektur-Audit + Fix

### Bestaetigter Bug

`performBasicScan` in `smart-scan/index.ts` (Zeile 542-631) holt **nur Following page 1**, aber **nicht Followers page 1**. Deshalb werden bei Nicht-Spy-Profilen neue Follower im Auto-Scan nie erkannt — sie tauchen erst bei einem manuellen Scan (`trigger-scan`) auf, weil der beide Listen holt.

### Gesamte Scan-Architektur (IST-Zustand)

```text
┌─────────────────────────────────────────────────────────────────────┐
│ CRON: smart-scan (jede Stunde, max 50 Profile pro Run)             │
│                                                                     │
│  Fuer jedes aktive Profil (sortiert nach last_scanned_at ASC):     │
│                                                                     │
│  ┌─ has_spy = true + Pro? ──────────────────────────────────────┐  │
│  │  SPY-SCAN (55min Cooldown)                                    │  │
│  │  1. gql/user/info/by/id         → Counts + Avatar            │  │
│  │  2. gql/user/following/chunk    → Following page 1 (200)     │  │
│  │  3. gql/user/followers/chunk    → Followers page 1 (200)     │  │
│  │  + syncNewFollows + syncNewFollowers                          │  │
│  │  + Unfollow-Hint (Count-Differenz, kein Listenvergleich)     │  │
│  │  + Avatar-Refresh (Following + Followers)                     │  │
│  │  + Follower-Baseline (bis 5 Pages) falls noch keine da       │  │
│  │  = 3 API-Calls pro Stunde                                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ Sonst (Basic) ──────────────────────────────────────────────┐  │
│  │  BASIC-SCAN (1x pro UTC-Tag)                                  │  │
│  │  1. gql/user/info/by/id         → Counts + Avatar            │  │
│  │  2. gql/user/following/chunk    → Following page 1 (200)     │  │
│  │  ❌ Followers page 1 FEHLT                                    │  │
│  │  + syncNewFollows (nur Following)                             │  │
│  │  + Avatar-Refresh (nur Following)                             │  │
│  │  = 2 API-Calls pro Tag                                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  + Baseline-Recovery (alle 24h falls baseline_complete=false)      │
│  + Gesamtlaufzeit-Limit: 45 Sekunden                              │
│  + Globales Budget: MAX_DAILY_API_CALLS (2000)                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ MANUELL: trigger-scan (Frontend Refresh-Button / Push-Scan)        │
│                                                                     │
│  1. v1/user/by/username            → nur wenn >24h seit Scan      │
│  2. gql/user/following/chunk       → Following page 1 (200)       │
│  3. gql/user/followers/chunk       → Followers page 1 (200)       │
│  + syncNewFollows + syncNewFollowers                                │
│  + Avatar-Refresh (Following + Followers)                           │
│  = 2-3 API-Calls pro Scan                                          │
│                                                                     │
│  Budget (nur bei scanType="push"):                                  │
│  - 4 Push-Scans/Tag (Reset 00:00 UTC)                              │
│  - Pro Max: unlimited                                               │
│  - Normaler Refresh ohne scanType: kein Budget-Verbrauch           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ MANUELL: unfollow-check (Pro only)                                  │
│                                                                     │
│  1. gql/user/info/by/id            → frischer Following-Count     │
│     (Fallback: v1/user/by/username)                                │
│  2. gql/user/following/chunk       → ALLE Seiten (Pagination)     │
│     (Fallback: v1/user/following/chunk bei Stale/Cursor-Loop)      │
│  + Voller DB-Vergleich (profile_followings vs API)                 │
│  + Unfollow-Events + neue Follows schreiben                        │
│  + Baseline-Auto-Repair falls Coverage < Schwelle                  │
│  = 2 + N API-Calls (N = ceil(followings/200))                     │
│                                                                     │
│  Limits:                                                            │
│  - Max 1500 Followings                                              │
│  - Backend: 2 Scans/Tag | Frontend: zeigt 1 Scan/Tag ⚠️           │
│  - Pro Max: unlimited                                               │
│  - Partial-Fetch Guard (< 50% = Abbruch + Retry)                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ EINMALIG: create-baseline (beim Hinzufuegen eines Profils)          │
│                                                                     │
│  1. v1/user/by/username            → IG-ID + Counts + Avatar      │
│  2. gql/user/following/chunk       → Seite fuer Seite              │
│     - Free: nur page 1                                              │
│     - Pro: alle Seiten (max 100 API-Calls, max 60 Pages)          │
│     - >10K Followings: nur page 1                                  │
│     (Fallback: v1 bei Cursor-Loop/Stale)                           │
│  + Alles in profile_followings speichern                            │
│  + Gender-Counts berechnen                                          │
│  + baseline_complete = true setzen                                  │
│  = 2-60+ API-Calls (einmalig)                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Sicherheitsmechanismen

```text
apiGuard.ts:
  - acquireScanLock:   atomares UPDATE mit 5min Timeout
  - releaseScanLock:   immer im finally-Block
  - checkDailyBudget:  globales Tageslimit (Secret: 2000)
  - trackedApiFetch:   15s Timeout, 429 = skip, Fire-and-forget Logging
  - api_call_log:      jeder Call wird geloggt (Kosten: $0.001/Call)

smart-scan:
  - CRON_SECRET Header-Pruefung
  - Max 45s Gesamtlaufzeit, dann Abbruch
  - Max 50 Profile pro Run
  - 55min Cooldown fuer Spy, 1x/UTC-Tag fuer Basic

trigger-scan:
  - JWT Auth + Ownership Check
  - Push-Budget nur bei scanType="push"
  - Free User: nur Initial-Scan erlaubt

unfollow-check:
  - JWT Auth + Pro Check
  - 1500 Following Limit
  - Partial-Fetch Guard (50%/30% Schwelle)
  - Budget-Refund bei Fehler/Lock
```

### API-Kosten pro Nutzer/Tag (Normalfall)

```text
1 Spy + 4 Basic Profile (AKTUELL):
  Spy:   24 Runs × 3 Calls = 72 Calls
  Basic: 4 Profile × 2 Calls = 8 Calls
  Gesamt: ~80 Calls/Tag = $0.08/Tag = ~$2.40/Monat

1 Spy + 4 Basic Profile (NACH FIX):
  Spy:   24 Runs × 3 Calls = 72 Calls
  Basic: 4 Profile × 3 Calls = 12 Calls
  Gesamt: ~84 Calls/Tag = $0.084/Tag = ~$2.52/Monat
  Differenz: +4 Calls/Tag (+$0.12/Monat)
```

### Bekannte Inkonsistenz: Unfollow-Limit

- **Backend** (`unfollow-check`, Zeile 254): `unfollow_scans_today ?? 2` → Default 2
- **Frontend** (`SpyStatusCard.tsx`, Zeile 84): `unfollowScansToday ?? 1` und zeigt `max: 1`
- **Reset im trigger-scan** (Zeile 382): setzt auf `unfollow_scans_today: 1`

Das heisst: Backend erlaubt 2, aber `trigger-scan` resettet auf 1, und Frontend zeigt 1. Effektiv hat der User also nur 1 Unfollow-Scan/Tag.

### Fix: Followers page 1 in Basic-Scan einbauen

**Datei:** `supabase/functions/smart-scan/index.ts`

In `performBasicScan` (nach Zeile 618, nach `refreshFollowingAvatars`):

1. `fetchPage1("followers", igUserId, hikerApiKey, profileId)` aufrufen
2. `syncNewFollowers()` aufrufen (existiert bereits im File)
3. `refreshFollowerAvatars()` aufrufen (existiert bereits im File)
4. Return-Objekt: `new_followers: newFollowerCount` statt `new_followers: 0`

Alle Funktionen sind schon im selben File definiert — es werden ca. 12 Zeilen Code hinzugefuegt.

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/smart-scan/index.ts` | Followers page 1 + sync in `performBasicScan` |

Keine weiteren Dateien, keine DB-Aenderungen, kein Frontend-Change noetig.

