
# CRUSHH App funktionsfaehig machen

Die Datenbank-Tabellen und Auth sind eingerichtet, aber die App nutzt noch Mock-Daten. Hier ist der Plan, um alles mit echten Supabase-Daten zu verbinden.

## Was wird gemacht

### 1. React Hooks fuer Supabase-Daten erstellen
Neue Datei `src/hooks/useTrackedProfiles.ts` mit TanStack Query:
- **useTrackedProfiles()** -- Laedt alle tracked_profiles des eingeloggten Users
- **useFollowEvents()** -- Laedt alle follow_events fuer die Profile des Users
- **useAddTrackedProfile()** -- Fuegt ein neues Profil hinzu (mit Plan-Limit-Pruefung)
- **useDeleteTrackedProfile()** -- Entfernt ein Profil

### 2. Dashboard mit echten Daten verbinden
`src/pages/Dashboard.tsx` anpassen:
- Mock-Imports entfernen, stattdessen die neuen Hooks nutzen
- Stats (Anzahl Profile, Follows, Unfollows) aus echten Daten berechnen
- Loading-States und leere Zustaende anzeigen ("Noch keine Profile? Fang an zu stalken!")

### 3. AddProfileModal mit Supabase verbinden
`src/components/AddProfileModal.tsx` anpassen:
- Bei Submit den `useAddTrackedProfile` Mutation-Hook aufrufen
- Username in die `tracked_profiles` Tabelle einfuegen
- Fehlerbehandlung wenn Plan-Limit erreicht (RLS blockiert Insert)
- Toast-Benachrichtigung bei Erfolg/Fehler

### 4. ProfileCard und EventFeedItem anpassen
- `ProfileCard` und `EventFeedItem` auf die Supabase-Datentypen umstellen (aus `types.ts` statt aus `mockData.ts`)
- Felder mappen: z.B. `display_name` statt `fullName`, `avatar_url` statt `profilePicUrl`

### 5. Profildetail-Seite verbinden
`src/pages/ProfileDetail.tsx` anpassen:
- Profil per ID aus Supabase laden
- Events fuer dieses Profil laden
- Chart-Daten aus echten Events aggregieren

### 6. Settings mit echtem Plan anzeigen
`src/pages/Settings.tsx` anpassen:
- Aktuellen Plan des Users aus der `profiles` + `subscription_plans` Tabelle laden
- Echten Plan-Namen und Limits anzeigen

---

## Technische Details

### Datentypen-Mapping
```text
Mock-Feld              -> Supabase-Spalte
-----------------------------------------------
profile.fullName       -> tracked_profiles.display_name
profile.profilePicUrl  -> tracked_profiles.avatar_url
profile.followingCount -> tracked_profiles.following_count
profile.followerCount  -> tracked_profiles.follower_count
profile.isPublic       -> (hardcoded true, kein DB-Feld)
profile.isActive       -> tracked_profiles.is_active
event.profileUsername  -> tracked_profiles.username (via JOIN)
event.targetUsername   -> follow_events.target_username
event.detectedAt      -> follow_events.detected_at
```

### Hook-Struktur (TanStack Query)
- `useQuery` fuer Lese-Operationen mit automatischem Caching
- `useMutation` fuer Schreib-Operationen mit `onSuccess` Cache-Invalidierung
- Alle Queries nutzen `user.id` als Key-Dependency

### Fehlerbehandlung
- Plan-Limit erreicht: Freundliche Meldung + Link zur Pricing-Seite
- Netzwerk-Fehler: Toast mit Retry-Option
- Leere Zustaende: Huebsche Empty-States mit Emojis passend zum App-Style
