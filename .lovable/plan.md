
# Instagram-Scanner mit HikerAPI einrichten

## Schritt 1: API-Key als Secret speichern
Der HikerAPI-Key wird sicher als Supabase Secret gespeichert (`HIKER_API_KEY`), damit die Edge Function darauf zugreifen kann.

## Schritt 2: Edge Function `scan-profiles` erstellen
Eine neue Edge Function unter `supabase/functions/scan-profiles/index.ts`, die:

1. Alle aktiven `tracked_profiles` aus der Datenbank laedt
2. Fuer jedes Profil die **Following-Liste** ueber HikerAPI abruft (Endpoint: `https://api.hikerapi.com/v2/user/following`)
3. Die aktuelle Following-Liste mit der vorherigen vergleicht
4. Neue Follows als `follow`-Events und verschwundene als `unfollow`-Events in `follow_events` speichert
5. Die Profil-Metadaten (Avatar, Display Name, Follower/Following Count) in `tracked_profiles` aktualisiert
6. `last_scanned_at` auf den aktuellen Zeitpunkt setzt

### Ablauf der Edge Function

```text
Request kommt rein (manuell oder per Cron)
    |
    v
Alle aktiven tracked_profiles laden (via Service Role Key)
    |
    v
Fuer jedes Profil:
  1. HikerAPI aufrufen: User-Info + Following-Liste holen
  2. Profil-Metadaten updaten (avatar, display_name, counts)
  3. Vorherige Following-Liste aus DB laden (letzte follow_events)
  4. Vergleichen: Wer ist neu? Wer fehlt?
  5. Neue follow/unfollow Events in follow_events einfuegen
  6. last_scanned_at updaten
    |
    v
Response mit Zusammenfassung zurueckgeben
```

## Schritt 3: Following-Snapshot-Tabelle erstellen
Eine neue Tabelle `profile_followings` wird benoetigt, um die zuletzt bekannte Following-Liste zu speichern. Ohne diese Tabelle kann kein Vergleich stattfinden.

Spalten:
- `id` (uuid, PK)
- `tracked_profile_id` (uuid, FK -> tracked_profiles)
- `following_username` (text) -- der Username dem gefolgt wird
- `following_user_id` (text) -- die Instagram User-ID
- `following_avatar_url` (text, nullable)
- `following_display_name` (text, nullable)
- `first_seen_at` (timestamptz, default now())
- `last_seen_at` (timestamptz, default now())
- `is_current` (boolean, default true) -- false wenn unfollow erkannt

RLS: Service Role only (kein direkter Client-Zugriff noetig, nur die Edge Function greift darauf zu). RLS wird aktiviert aber keine Policies fuer anon/authenticated erstellt.

## Schritt 4: `supabase/config.toml` anpassen
```text
[functions.scan-profiles]
verify_jwt = false
```
JWT wird in der Function manuell geprueft (oder fuer Cron-Aufrufe per Authorization-Header mit dem Anon Key).

## Schritt 5: Frontend-Button zum manuellen Scannen
Im Dashboard einen "Jetzt scannen" Button hinzufuegen, der die Edge Function aufruft und danach die Events neu laedt.

## Schritt 6 (optional, spaeter): Cron-Job einrichten
Per `pg_cron` die Edge Function automatisch alle 30 Minuten aufrufen, damit die App auch ohne manuellen Klick scannt.

---

## Technische Details

### HikerAPI Endpoints die genutzt werden
- `GET https://api.hikerapi.com/v2/user/by/username?username=xyz` -- Profil-Info (ID, Avatar, Counts)
- `GET https://api.hikerapi.com/v2/user/following?user_id=xyz` -- Following-Liste (paginiert)

### Vergleichs-Logik
1. Aktuelle Followings von HikerAPI holen
2. `profile_followings` laden wo `tracked_profile_id = X` und `is_current = true`
3. Neue Followings (in API aber nicht in DB) -> `follow` Event erstellen + DB-Eintrag
4. Fehlende Followings (in DB aber nicht in API) -> `unfollow` Event erstellen + `is_current = false` setzen
5. Bestehende Followings -> `last_seen_at` updaten

### Service Role Key
Die Edge Function nutzt den `SUPABASE_SERVICE_ROLE_KEY` (bereits als Secret vorhanden), um RLS zu umgehen und Events direkt einzufuegen.
