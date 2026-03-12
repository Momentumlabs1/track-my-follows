
Zuerst die direkte Antwort auf dein „warum nur 48“ (für aktuelles Profil `timwger`, ID `6dcdb516-2439-4c30-b141-c1f267de341a`):

- `tracked_profiles.following_count` = **262** (Instagram Gesamtzahl)
- `profile_followings` in DB = **48**
- Gender daraus = **17 Frauen / 17 Männer / 14 Unbekannt**
- Das ist exakt der Grund für 50/50: **17 vs 17 aus nur 48 Datensätzen**, nicht aus 262.

Warum technisch nur 48 drin sind:
1. `trigger-scan` schreibt beim Start nur **Seite 1** (bei dir 48 Accounts) in `profile_followings` (by design).
2. `create-baseline` sollte danach alle Seiten nachziehen, tut es aber nicht korrekt:
   - Log zeigt: `240 API, 48 in DB`
   - Gleichzeitig: in-memory `F85/M85/U70` = genau `5 x (17/17/14)` → starkes Indiz, dass dieselben 48 mehrfach gelesen wurden.
3. Zusätzlich ist in `create-baseline` ein hartes Limit `page < 5` eingebaut. Selbst bei korrekter Pagination wäre das für 262 mit 48er Seiten nicht vollständig.

## Umsetzungsplan (Fix, damit wirklich alle 262 analysiert werden)

1) `create-baseline` Pagination robust machen
- Für **Full Baseline** auf denselben stabilen v1-Paging-Ansatz wechseln (wie in `unfollow-check`).
- Cursor-Schutz einbauen:
  - Abbruch, wenn `nextMaxId` sich nicht ändert
  - Abbruch bei leeren Seiten
- Nicht mehr blind `page < 5` als Vollständigkeitskriterium verwenden.

2) Dedupe vor DB-Sync
- Während des Ladens `seenIds` (following_user_id) führen.
- Nur unique Accounts weiterverarbeiten.
- Logging erweitern: `rawLoaded`, `uniqueLoaded`, `updated`, `inserted`.

3) `baseline_complete` korrekt setzen
- `baseline_complete = true` nur wenn:
  - kein API-Limit/Ratelimit,
  - keine Cursor-Anomalie,
  - und alle erwartbaren Seiten durchlaufen wurden.
- Sonst `baseline_complete = false`, damit Recovery in `smart-scan` sauber nachzieht.

4) Daten-Recovery für Tim
- `baseline_complete=false` setzen (für aktuelle Profil-ID 6dcd...).
- `create-baseline` neu triggern.
- Danach Soll-Zustand:
  - `profile_followings` nahe **262** (oder exakt 262, wenn API vollständig liefert)
  - Gender-Verteilung auf dieser Gesamtbasis (nicht 48).

5) Verifikation (hart, messbar)
- SQL-Check nach Lauf:
  - Gesamt rows in `profile_followings` für Profil
  - female/male/unknown counts
  - Vergleich mit `tracked_profiles.gender_*` und `gender_sample_size`
- UI-Check:
  - Gender-Bar muss dieselben DB-Zahlen zeigen.
  - „Neue Accounts“-Kacheln bleiben 0/0, solange keine echten neuen Events da sind.

## Erwartetes Ergebnis nach Fix
- Nicht mehr „17/17 aus 48“, sondern Gender auf Basis aller erfassten Followings.
- Wenn API wirklich alle 262 liefert: vollständige, logisch nachvollziehbare Verteilung.
