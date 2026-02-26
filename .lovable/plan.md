

## Plan: Unfollow-Check Timeout fix + besseres Loading-UX

### Problem
Die Edge Function braucht ~150 Sekunden (sequentiell Following + Follower scannen mit 800ms Sleep pro Page). Bei großen Accounts → 546 Timeout.

### 1. Edge Function optimieren (`supabase/functions/unfollow-check/index.ts`)
- **Sleep reduzieren**: 800ms → 300ms zwischen Pages, 500ms/1000ms Pausen zwischen Phasen entfernen
- **Parallel scannen**: Following + Follower gleichzeitig mit `Promise.all` statt nacheinander
- **DB-Batch**: Statt einzelne Inserts pro User, alle neuen Followings/Events als Arrays sammeln und am Ende batchen (Supabase `.insert([...])`)
- Geschätzte Zeitersparnis: ~50-60% (von ~150s auf ~60-70s)

### 2. UnfollowCheckButton UX überarbeiten (`src/components/UnfollowCheckButton.tsx`)
- **Mehrstufiger Loading-State** mit animiertem Fortschritt:
  - Phase 1: "🔍 Following-Liste wird gescannt..."
  - Phase 2: "🔍 Follower-Liste wird gescannt..."
  - Phase 3: "📊 Ergebnisse werden ausgewertet..."
- **Animierter SpyIcon** dreht sich während des Scans
- **Fortschrittsbalken** (indeterminate/pulsierend, da wir keine echte Progress haben)
- **Timeout-Handling**: Nach 180s automatisch Fehlermeldung statt endloses Warten
- **Bessere Ergebnis-Karten**: Mehr Details (lost followers separat anzeigen, neue Follower)

### 3. Translations (`de.json`, `en.json`)
- Neue Keys für Scan-Phasen und erweiterte Ergebnisse

### Betroffene Dateien
- `supabase/functions/unfollow-check/index.ts`
- `src/components/UnfollowCheckButton.tsx`
- `src/i18n/locales/de.json`
- `src/i18n/locales/en.json`

### Technische Details
- `Promise.all([fetchAll("following",...), fetchAll("followers",...)])` spart die gesamte Dauer des zweiten Scans
- Batch-Insert: `supabase.from("profile_followings").insert(newFollowingsArray)` statt N einzelne Calls
- Kein DB-Schema-Change nötig

