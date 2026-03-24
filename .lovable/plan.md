

# Fix: Unfollow-Check schlägt bei Accounts mit wenigen Followings fehl

## Problem
`agent.stickk` folgt nur **1 Person**. Die HikerAPI gibt **0 Followings** zurück (404 oder leere Response). Der `PARTIAL_FETCH`-Guard berechnet `0 < 1 * 0.7 = 0.7` → true → Error 422 wird zurückgegeben. Der Scan bricht ab und das Frontend zeigt "Etwas ist schiefgelaufen".

Das passiert bei **jedem Account mit wenigen Followings** (unter ~5).

## Fix

### Datei: `supabase/functions/unfollow-check/index.ts`

**1. PARTIAL_FETCH Guard anpassen** (Zeile ~236):
- Guard nur ab `expectedCount >= 10` aktivieren (bei 0-9 Followings ist 0 ein valides API-Ergebnis)
- Oder: Threshold auf `expectedCount * 0.5` senken UND Mindestdifferenz von 5 erfordern

```
// Vorher:
if (expectedCount > 0 && allFollowings.length < expectedCount * 0.7)

// Nachher:  
if (expectedCount >= 10 && allFollowings.length < expectedCount * 0.7)
```

**2. fetchAllFollowings: 404 besser behandeln** (Zeile ~87):
- Bei 404 nicht sofort `break` → stattdessen leeres Array zurückgeben ist OK, aber der Guard muss das erlauben

### Datei: `src/components/UnfollowCheckButton.tsx`

**3. Frontend: 422 Error besser abfangen**:
- Bei `res.error` den Response-Body parsen und `PARTIAL_FETCH`, `FOLLOWING_LIMIT`, etc. als bekannte Fehler mit spezifischen Meldungen anzeigen statt generischem "Etwas ist schiefgelaufen"
- Aktuell wirft `supabase.functions.invoke` bei non-2xx einen generischen Error

Deployment der Edge Function nötig nach dem Fix.

