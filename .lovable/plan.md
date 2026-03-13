
Ziel: „New followers“ darf nur echte neue Events zählen. Initial-/Backfill-Daten dürfen nicht mehr als „neu“ wirken.

Was aktuell falsch läuft (bestätigt):
- In `ProfileDetail.tsx` wird für die Tabs ein Fallback genutzt:
  - `displayFollowerEvents = newFollowerEventsList.length > 0 ? newFollowerEventsList : initialFollowerEventsList`
  - Tab-Badge nutzt `displayFollowerEvents.length`
- Ergebnis bei `saif_nassiri`: `new_followers=0`, `initial_followers=136` → Badge zeigt trotzdem 136.
- Deshalb sieht es so aus, als wären 136 neue Follower gekommen, obwohl es nur „beim Start erkannt“ ist.

Zusätzlicher technischer Bug (separat, aber wichtig):
- In `supabase/functions/trigger-scan/index.ts` wird `follower_count` falsch mit `actualFollowingCount` gesetzt (Vertipper). Das kann Stats verfälschen.

Umsetzungsplan

1) Tab-Logik in `ProfileDetail.tsx` strikt trennen
- `new_follows` Badge = nur `newFollowEvents.length`
- `new_followers` Badge = nur `newFollowerEventsList.length`
- Kein Badge-Fallback mehr auf Initial-Events.
- Primärliste in beiden Tabs zeigt nur echte neue Events (`is_initial=false`).

2) Initial-/Backfill-Events klar als separaten Bereich darstellen
- Unterhalb der Primärliste eigener Abschnitt:
  - „Beim ersten Scan vorhanden (nicht als neu gezählt)“
- Dieser Abschnitt zeigt `initialFollowEvents` / `initialFollowerEventsList`.
- Initial-Einträge ohne New-Dot (`isRead: true`) und mit Label `initial_scan_label`.
- Damit bleiben die Daten sichtbar, aber semantisch sauber getrennt.

3) Texte schärfen (i18n: `de/en/ar`)
- Schlüssel für Abschnittstitel ergänzen/ändern:
  - „Beim ersten Scan vorhanden (nicht als neu gezählt)“
- Optional Empty-State präziser:
  - „Noch keine neuen Follower erkannt“ bleibt, aber ohne Vermischung mit Initialdaten.

4) Trigger-Scan Count-Bug korrigieren
- Datei: `supabase/functions/trigger-scan/index.ts`
- Fix:
  - `follower_count: actualFollowerCount` (statt `actualFollowingCount`)
- Verhindert falsche Header-Counts/Delta-Anzeigen nach Scans.

Betroffene Dateien
- `src/pages/ProfileDetail.tsx`
- `src/i18n/locales/de.json`
- `src/i18n/locales/en.json`
- `src/i18n/locales/ar.json`
- `supabase/functions/trigger-scan/index.ts`

Akzeptanzkriterien
- Bei `saif_nassiri` zeigt Tab „New followers“ Badge **0** (nicht 136).
- Die 136 Einträge erscheinen nur im separaten „Beim ersten Scan vorhanden“-Abschnitt.
- Wenn ein echter neuer Follower reinkommt, steigt Badge von 0 auf 1.
- Weekly-Bubbles unten bleiben unverändert korrekt (nur „neu gefolgt“ letzte 7 Tage).
- Follower-/Following-Header-Counts bleiben nach `trigger-scan` konsistent.
