
Ziel: **Unfollow-Scan sofort stabil machen**, damit kein 422/PARTIAL_FETCH mehr bei normalen Profilen entsteht und keine 60-Page-Schleifen zurückkommen.

## Was gerade schief läuft (Root Cause)
Der Fehler entsteht im Backend (`supabase/functions/unfollow-check/index.ts`) durch diese Kombi:
1) HikerAPI liefert teils Seiten mit nur Duplikaten + trotzdem weiterem Cursor.  
2) Unsere Logik bricht **zu früh** ab (`2 consecutive dupe pages`), obwohl erst z. B. 49/291 geladen wurden.  
3) Danach greift der Schutz `PARTIAL_FETCH (<50%)` korrekt und liefert 422.  
=> Ergebnis: Scan stoppt, obwohl du nur 1x geklickt hast.

Zusätzlich: `info/by/id` liefert bei dir teils 404, dadurch ist die erwartete Count-Referenz instabil.

## Umsetzungsplan (in deiner gewünschten Sofort-Priorität)
### 1) P0 Fix in `unfollow-check` (kritisch)
- Dupe-Exit umbauen: **nie mehr nur wegen 2 Dupe-Seiten abbrechen**.
- Cursor-Loop-Schutz robust machen (Set aller bereits gesehenen Cursor, nicht nur `prevMaxId`).
- Adaptive Seitenobergrenze statt starrer 60:
  - `maxPages = ceil(expectedCount/200) + Buffer` (mit Obergrenze 60).
- `expectedCount`-Quelle härten:
  - Erst `gql user info by id`;
  - bei Fail/404 Fallback auf `v1/user/by/username`.
- `PARTIAL_FETCH` nur mit **vertrauenswürdigem expectedCount** streng anwenden; sonst kontrolliert-relaxte Prüfung + klares Logging.

### 2) P1 Gleiche Stabilisierung in `create-baseline`
- Dieselbe Cursor-/Dupe-Strategie übernehmen, damit der gleiche Bug nicht an anderer Stelle wieder auftritt.

### 3) P2 UI-Fehlerpfad verbessern (`src/components/UnfollowCheckButton.tsx`)
- Auf nativen `fetch`-Flow für die Function wechseln (statt rein `invoke`), damit 422-JSON immer auslesbar ist.
- Nutzer sieht dann genaue Ursache (`PARTIAL_FETCH`, `FOLLOWING_LIMIT`, `LOCKED`) statt generischem Fehler.
- Progress bleibt, aber mit sauberem “Backend wartet / Retry läuft”-State.

### 4) P3 Regression-Absicherung (Edge-Function Tests)
- Tests für:
  - Dupe-Seiten mit wechselndem Cursor,
  - Cursor-Repeats,
  - expectedCount + early-exit,
  - PARTIAL_FETCH nur bei echten Unterläufen.
- Ziel: diese Regression kommt nicht nochmal.

## Technische Details (konkret)
Betroffene Dateien:
- `supabase/functions/unfollow-check/index.ts`
- `supabase/functions/create-baseline/index.ts`
- `src/components/UnfollowCheckButton.tsx`
- optional Testdatei unter `supabase/functions/unfollow-check/*_test.ts`

Erwartetes Ergebnis nach Fix:
- `timwger` (~267): typ. **2–4 Following-Pages**, nicht 60.
- Kein voreiliges Stoppen bei 49/291.
- 422 nur noch bei echten unvollständigen API-Lieferungen.

## Verifikation nach Umsetzung
1) Unfollow-Scan für dein Profil 1x triggern.  
2) Edge-Logs prüfen auf:
   - keine „2 consecutive dupe pages … stopping (49/291)“
   - stattdessen fortgesetzte Pagination bis realistische Vollständigkeit.
3) `api_call_log` prüfen: Calls liegen wieder im erwarteten Bereich (nicht 60).
4) End-to-End im UI: korrekte Fehlermeldung oder erfolgreiches Ergebnis statt „geht nd“.

