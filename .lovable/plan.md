

## Fix: Unfollow-Check Pagination frisst 60 statt 2-3 API Calls

### Problem
`fetchAllFollowings` im `unfollow-check` paginiert bis zu 60 Seiten, obwohl `timwger` nur 267 Followings hat (= 2 Seiten). Die HikerAPI gibt endlos Cursors zurueck, der Loop hat keinen Early-Exit basierend auf erwarteter Datenmenge.

Ergebnis: 1 Unfollow-Scan = 60 API Calls statt 3 (Info + 2 Pages). Das ist 20x zu teuer.

### Loesung
Zwei Fixes in `supabase/functions/unfollow-check/index.ts`:

1. **Early-Exit in `fetchAllFollowings`**: Wenn `allUsers.length >= expectedCount` (die frische following_count), sofort abbrechen. Buffer von +10% fuer Sicherheit.

2. **`expectedCount` als Parameter uebergeben**: Die Funktion bekommt die frische following_count und nutzt sie als Stop-Bedingung.

### Code-Aenderung

In `fetchAllFollowings`:
- Neuer Parameter `expectedCount: number`
- Nach jedem Page-Fetch: `if (expectedCount > 0 && allUsers.length >= expectedCount * 1.1) break;`
- Logging wenn Early-Exit greift

Am Aufruf-Ort:
- `fetchAllFollowings(supabase, igUserId, hikerApiKey, profileId, freshFollowingCount)` statt ohne expectedCount

### Ergebnis
- `timwger` (267 Followings): 1 Info + 2 Pages = **3 API Calls** statt 60
- `saif_nassiri` (1084 Followings): 1 Info + 6 Pages = **7 API Calls** statt potentiell 60

### Datei

| Datei | Aenderung |
|---|---|
| `supabase/functions/unfollow-check/index.ts` | Early-Exit in `fetchAllFollowings` basierend auf `expectedCount` |

