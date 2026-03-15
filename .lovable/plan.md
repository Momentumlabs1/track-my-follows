

# Plan: Private-Profil-Erkennung VOR dem Hinzufügen

## Problem
Aktuell wird das Profil zuerst zur DB hinzugefügt, dann der Scan gestartet, und erst dann kommt die Meldung "privat". Der Nutzer durchläuft die komplette Analyzing-Animation umsonst.

## Lösung
Einen leichtgewichtigen Privacy-Check direkt in `AddProfile.tsx` einbauen — **bevor** das Profil in die DB eingefügt wird.

## Änderungen

### 1. `AddProfile.tsx` — Username-Validierung vor Insert
Im `handleSubmit` vor `addProfile.mutate()`:
1. HikerAPI `userInfo` abrufen via einer neuen Edge Function `check-username`
2. Falls `is_private === true` → Fehlermeldung direkt anzeigen, kein DB-Insert
3. Falls Profil nicht existiert (404) → "Profil nicht gefunden" anzeigen
4. Falls öffentlich → weiter wie bisher mit `addProfile.mutate()`

### 2. Neue Edge Function `check-username/index.ts`
Leichtgewichtige Funktion die nur `userInfo` von HikerAPI abruft:
- Input: `{ username: string }`
- Prüft via `https://api.hikerapi.com/v1/user/by/username?username=...`
- Gibt zurück: `{ exists: boolean, is_private: boolean, pk: string, avatar_url, full_name, follower_count, following_count }`
- Benötigt Auth (Bearer Token)
- Keine DB-Schreiboperationen

### 3. `AddProfile.tsx` — Angepasster Flow
```
handleSubmit:
  1. setLoading(true)
  2. fetch check-username → { exists, is_private, ... }
  3. if (!exists) → setError("Profil nicht gefunden")
  4. if (is_private) → setError("Dieses Profil ist privat...")
  5. if (ok) → addProfile.mutate(username) → navigate to analyzing
```

### 4. `AnalyzingProfile.tsx` — Private-Error auch dort abfangen
Falls `trigger-scan` trotzdem `profile_private` zurückgibt (Race-Condition), den Fehler erkennen und dem Nutzer anzeigen statt zur Profilseite zu navigieren.

Prüfen ob `res.data?.results?.[0]?.error === "profile_private"` und dann:
- Toast mit Fehlermeldung
- Navigate zurück zum Dashboard
- Profil ggf. löschen oder als privat markiert lassen

### 5. Lokalisierung
Neue Keys in `de.json`, `en.json`, `ar.json`:
- `errors.profile_private`: "Dieses Profil ist privat und kann nicht getrackt werden 🔒"
- `errors.profile_not_found`: "Dieses Instagram-Profil existiert nicht"
- `add_profile.checking`: "Prüfe Profil..."

### 6. `supabase/config.toml`
```toml
[functions.check-username]
verify_jwt = false
```

## Dateien
- `supabase/functions/check-username/index.ts` (neu)
- `supabase/config.toml` (neuer Eintrag)
- `src/pages/AddProfile.tsx` (Pre-Check einbauen)
- `src/pages/AnalyzingProfile.tsx` (Private-Fallback)
- `src/i18n/locales/de.json`, `en.json`, `ar.json` (neue Keys)

