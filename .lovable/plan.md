
Zustand jetzt, mit Beweis:

1. Query-Ergebnis für `diego_gut1`
```sql
SELECT id, user_id, username, instagram_user_id, has_spy, last_scanned_at, is_active
FROM tracked_profiles
WHERE username = 'diego_gut1'
  AND is_active = true
ORDER BY last_scanned_at ASC NULLS FIRST;
```

Ergebnis:
```text
id=6baccbc9-c845-4281-b13f-85b0930656d0
user_id=1ea4654a-41b4-4b62-96ab-2e705b781813
username=diego_gut1
instagram_user_id=28746603337
has_spy=false
last_scanned_at=2026-04-02 00:00:19.276+00

id=e32ee187-4b6b-4381-a9ad-f0823e486191
user_id=8ffe8fd7-779f-4335-90a4-3d520ca3131e
username=diego_gut1
instagram_user_id=28746603337
has_spy=false
last_scanned_at=2026-04-05 10:15:44.062+00
```

Zusatzbeweis:
```sql
SELECT instagram_user_id, username, COUNT(*) AS active_rows
FROM tracked_profiles
WHERE is_active = true AND instagram_user_id = '28746603337'
GROUP BY instagram_user_id, username;
```

Ergebnis:
```text
instagram_user_id=28746603337
username=diego_gut1
active_rows=2
```

2. Warum `diego_gut1` 24x statt 1x gescannt wird
Es sind aktuell zwei echte Probleme, nicht nur eins:

A) Akuter Hauptfehler: `performBasicScan()` crasht vor dem Update von `last_scanned_at`
Beweis im Code:
```ts
// supabase/functions/smart-scan/index.ts
42-46:  async function refreshFollowerAvatars(supabase, profileId, users)
623-625:
if (followerUsers !== null && followerUsers.length > 0) {
  newFollowerCount = await syncNewFollowers(supabaseClient, profileId, followerUsers);
  await refreshFollowerAvatars(supabaseClient, followerUsers);
}
628-635:
await supabaseClient.from("tracked_profiles").update({
  ...
  last_scanned_at: new Date().toISOString(),
```

Der Aufruf auf Zeile 625 ist falsch: Es fehlt `profileId`. Dadurch bekommt `refreshFollowerAvatars` als `profileId` das Array `followerUsers` und `users` wird `undefined`. Das führt beim `for (const u of users)` sehr wahrscheinlich zu einem Laufzeitfehler, bevor Zeile 628-635 erreicht wird. Folge: `last_scanned_at` wird für diese Row nicht aktualisiert. Dann scannt der Cron dieselbe Row in der nächsten Stunde erneut. Genau das erklärt 24 Info + 24 Following + 24 Follower Calls für dieselbe Profile-Row.

B) Architektureller Kostenfehler: Daily-Check ist nur pro Row, nicht pro IG-Account
Beweis im Code:
```ts
// supabase/functions/smart-scan/index.ts 718-728
const lastScan = profile.last_scanned_at ? new Date(profile.last_scanned_at as string) : null;
if (lastScan) {
  const today = new Date().toISOString().split("T")[0];
  const lastScanDate = lastScan.toISOString().split("T")[0];
  if (lastScanDate === today) {
    results.push({ username: profile.username, scan_type: "basic", skipped: true });
    continue;
  }
}
const res = await performBasicScan(supabaseClient, profile, hikerApiKey);
```

Das prüft ausschließlich `profile.last_scanned_at` der aktuellen Row. Bei mehreren aktiven Rows mit derselben `instagram_user_id` kann jede Row separat durchlaufen. Es gibt aktuell keine Deduplizierung nach `instagram_user_id` oder `username`.

3. Warum das im bisherigen Fix-Plan nicht ausreichend drin war
Der bisherige Fix-Plan hatte nur den Crash-Fix im Blick. Das ist nötig, aber nicht ausreichend. Er behebt nur:
```text
gleiche Row wird stündlich erneut gescannt, weil last_scanned_at nie geschrieben wird
```
Er behebt NICHT:
```text
mehrere aktive Rows für denselben Instagram-Account werden unabhängig voneinander täglich gescannt
```
Der teure Teil wurde also bislang unvollständig geplant. Das ist der Gap.

4. Zusätzlicher Beweis aus API-Logs
```sql
SELECT profile_id, endpoint, COUNT(*) AS calls
FROM api_call_log
WHERE created_at >= '2026-04-04'::timestamptz
  AND created_at < '2026-04-05'::timestamptz
  AND profile_id IN (
    '6baccbc9-c845-4281-b13f-85b0930656d0',
    'e32ee187-4b6b-4381-a9ad-f0823e486191'
  )
GROUP BY profile_id, endpoint
ORDER BY profile_id, endpoint;
```

Ergebnis:
```text
profile_id=6baccbc9-c845-4281-b13f-85b0930656d0
24x https://api.hikerapi.com/gql/user/info/by/id?id=28746603337
24x https://api.hikerapi.com/gql/user/following/chunk?user_id=28746603337&count=200
24x https://api.hikerapi.com/gql/user/followers/chunk?user_id=28746603337&count=200
```

Das passt exakt zu deinem Vorwurf: 72 Calls/Tag für ein Non-Spy-Profil.

5. Maximale Lösung, die implementiert werden muss
Ich würde den Fix jetzt als 2 Pflichtteile planen, nicht nur 1:

Schritt 1 — Crash in `performBasicScan()` beheben
- Falschen Aufruf korrigieren:
```ts
await refreshFollowerAvatars(supabaseClient, profileId, followerUsers);
```
- Dadurch wird `last_scanned_at` wieder zuverlässig geschrieben.

Schritt 2 — Deduplizierung pro Instagram-Account im `smart-scan`
Ziel:
```text
Non-Spy-Basic-Scan darf nicht pro tracked_profiles-Row gated werden,
sondern pro Instagram-Account.
```

Geplanter Ansatz:
- Vor dem Loop eine In-Memory-Map/Set für bereits entschiedene Accounts aufbauen.
- Eindeutiger Schlüssel:
  - bevorzugt `instagram_user_id`
  - Fallback `username.toLowerCase()` wenn `instagram_user_id` noch fehlt
- Für Non-Spy:
  1. Wenn derselbe Account in diesem Run schon verarbeitet oder geskippt wurde → skip.
  2. Zusätzlich DB-weit prüfen, ob irgendeine aktive Row mit gleicher `instagram_user_id` heute schon `last_scanned_at` hat.
  3. Wenn ja → alle weiteren Rows dieses IG-Accounts skippen.
- Damit wird dedupliziert:
  - innerhalb desselben Cron-Runs
  - über mehrere User/Rows hinweg
  - auch dann, wenn mehrere Kunden denselben IG-Account tracken

Konkrete gewünschte Regel:
```text
Wenn ein Non-Spy-Instagram-Account heute bereits erfolgreich basic gescannt wurde,
egal über welche tracked_profiles-Row, dann darf keine weitere aktive Row
für denselben IG-Account heute erneut HikerAPI-Calls auslösen.
```

6. Was die Implementierung zusätzlich sauber lösen sollte
- Nur als „gescannt“ markieren, wenn `performBasicScan()` wirklich erfolgreich war.
- Optional: nach erfolgreichem deduplizierten Scan die Schwester-Rows desselben IG-Accounts ebenfalls auf denselben `last_scanned_at` ziehen, damit Fairness und Sortierung stabil bleiben.
- Wenn das nicht gewünscht ist, mindestens die Skip-Logik auf Account-Level erzwingen.

7. Beweis-Plan nach dem Fix
Nach Implementierung würde der Verifikationsnachweis so aussehen:

A) DB-Check für `diego_gut1`
```sql
SELECT id, user_id, username, instagram_user_id, has_spy, last_scanned_at
FROM tracked_profiles
WHERE username = 'diego_gut1'
  AND is_active = true;
```

B) API-Log-Check für einen Tag
```sql
SELECT endpoint, COUNT(*) AS calls
FROM api_call_log
WHERE created_at >= CURRENT_DATE
  AND created_at < CURRENT_DATE + interval '1 day'
  AND profile_id IN (
    SELECT id FROM tracked_profiles
    WHERE instagram_user_id = '28746603337'
      AND is_active = true
  )
GROUP BY endpoint
ORDER BY endpoint;
```

Erwartung nach Fix:
```text
1x info
1x following page 1
1x followers page 1
```
also 3 Calls/Tag für den Account, nicht 72.

C) Edge-Function-Logs
Aktuell liefern die Log-Tools keine `smart-scan`-Logs zurück. Deshalb würde der belastbare Beweis primär über `api_call_log` + gezielte neue Skip-/dedup-Logs im Function-Code erfolgen, sobald die Implementierung gemacht wird.

8. Betroffene Datei
- `supabase/functions/smart-scan/index.ts`

9. Priorität
Prio 1:
- Basic-Scan-Crash fixen

Prio 2:
- Account-weite Deduplizierung per `instagram_user_id` / Username-Fallback einbauen

Prio 3:
- Danach mit `api_call_log` beweisen, dass `diego_gut1` nur noch 3 Calls/Tag erzeugt

10. Kurzfazit
Ja: Das Multi-Row-Problem ist real und durch Query bewiesen.
Ja: Der aktuelle Daily-Check ist architektonisch unzureichend, weil er nur pro Row prüft.
Aber der unmittelbare 24x/Tag-Effekt bei derselben Row wird zusätzlich durch den noch vorhandenen `refreshFollowerAvatars`-Crash erklärt.
Der vollständige Fix muss beides enthalten. Nur den Avatar-Call zu reparieren reicht nicht.
<lov-actions>
<lov-suggestion message="Test the smart-scan flow end-to-end after implementation and verify in api_call_log that diego_gut1 only generates 3 calls per day total.">Verify that it works</lov-suggestion>
<lov-suggestion message="Implement the full smart-scan fix now: repair the refreshFollowerAvatars call and add non-spy deduplication by instagram_user_id with username fallback so duplicate tracked rows cannot trigger repeated daily scans.">Implement full smart-scan fix</lov-suggestion>
<lov-suggestion message="Add targeted smart-scan logging for account-level dedup decisions so we can see when duplicate rows are skipped and why in future audits.">Add dedup debug logs</lov-suggestion>
</lov-actions>
