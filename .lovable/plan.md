
Ziel: Die Logik wieder exakt auf dein gewünschtes Verhalten bringen:
1) Bubbles unten = nur „wem gefolgt“ (Männer/Frauen) der letzten 7 Tage.
2) „Neue Follower“/„Folgt neu“ = nur echte neue Events aus dem Scanfenster, keine Backfill-/Altbestände als „neu“.

Kurzbefund aus den Daten (damit klar ist, warum 80 vs 1 passiert):
- `saif_nassiri` wurde am **2026-03-10** hinzugefügt.
- `follow_events` (neu gefolgt, non-initial): **1**
- `follower_events` (new followers, non-initial): **87**
- Ursache: Follower-Erkennung markiert bei Scanfenster-/Reihenfolge-Verschiebung alte, bisher nicht gesehene Accounts als „gained“.

Umsetzungsplan

1) Event-Erkennung in Edge Functions härten (Hauptfix)
- Dateien:
  - `supabase/functions/smart-scan/index.ts`
  - `supabase/functions/trigger-scan/index.ts`
  - `supabase/functions/unfollow-check/index.ts`
- Änderung:
  - Für „new_followers“ und „new_follows“ Events wird ein **Delta-Gate** eingeführt:
    - maximal so viele „new“-Events schreiben wie der echte Count-Zuwachs laut Profilzähler erlaubt.
    - Beispiel: `actualFollowerCount - lastFollowerCount = 1` ⇒ maximal 1 neues Follower-Event.
  - Unbekannte Accounts darüber hinaus werden nur in Baseline-Tabellen (`profile_followers`/`profile_followings`) nachgezogen, **ohne** sie als „neu“ zu zählen.
  - Bestehende Treffer bekommen `last_seen_at` Updates (stabilere Bestätigung).
- Ergebnis:
  - Keine künstlichen 80+ „neuen“ Follower mehr durch Reihenfolge-/Page-Drift.

2) UI-Filter + klare Trennung der Bedeutung
- Dateien:
  - `src/pages/ProfileDetail.tsx`
  - `src/components/SpyFindings.tsx`
- Änderung:
  - `newFollowerEventsList` zeigt nur valide neue Events (keine Backfill/initialen Altfunde).
  - Followback-Rate in `SpyFindings` zählt nur echte neue gained-Events (nicht Initial/Backfill), damit Kennzahlen nicht verfälscht werden.
- Ergebnis:
  - Tab-Zahlen und Insights passen zur Realität statt zu „nachträglich gefundenen“ Altkonten.

3) Texte korrigieren (Missverständnis beseitigen)
- Dateien:
  - `src/i18n/locales/de.json`
  - `src/i18n/locales/en.json`
  - `src/i18n/locales/ar.json`
- Änderung:
  - Weekly-Bubbles explizit formulieren als: **„Neu gefolgte Accounts (7 Tage)“**.
  - Zusatzhinweis bei Weekly/Tab:
    - Bubbles = nur „folgt neu“ (following-Richtung)
    - „Neue Follower“ separat.
  - Unfollow-Hinweistext korrigieren (nicht fälschlich „vollautomatisch jede Stunde geprüft“ für den Reveal-Check).
- Ergebnis:
  - Kein semantisches Durcheinander mehr zwischen „neu gefolgt“ und „neue Follower“.

4) Daten-Reparatur für bereits verfälschte Events (jetzt bereinigen)
- Datei:
  - neue Migration in `supabase/migrations/...sql`
- Änderung:
  - Bestehende offensichtlich verfälschte „gained“-Events für die betroffenen Profile (saif/tim/lisa) werden in Backfill/Initial umklassifiziert (oder aus „neu“-Sicht neutralisiert), damit die aktuellen Listen sofort sauber sind.
  - Wichtig: Historie bleibt technisch nachvollziehbar, aber nicht mehr als „neu passiert“ dargestellt.
- Ergebnis:
  - Sofort plausible Werte nach Deploy, nicht erst „ab nächstem Scan“.

Technische Details (präzise)
- Delta-Gate Logik:
  - `allowedNewFollowers = max(actualFollowerCount - previousKnownFollowerCount, 0)`
  - `allowedNewFollows = max(actualFollowingCount - previousKnownFollowingCount, 0)`
  - Nur die ersten `allowed...` Kandidaten aus dem aktuellen Scanfenster werden als echte Events gespeichert.
- Backfill-Handling:
  - Kandidaten über Limit werden als Baseline-Nachzug behandelt (kein echtes „new“ Event).
- Betroffene Stellen:
  - `syncNewFollowers(...)` und `syncNewFollows(...)` in Trigger/Smart Scan
  - New-Follower-Insert-Teil in `unfollow-check` (parallel scan branch)
- Weekly-Bubbles:
  - Bleiben absichtlich auf `follow_events` (direction=`following`, `is_initial=false`, letzte 7 Tage), also genau deine gewünschte Semantik.

Akzeptanzkriterien nach Umsetzung
1) Bei `saif_nassiri` erscheinen keine unrealistischen Sprünge mehr im „Neue Follower“-Tab.
2) Weekly-Bubbles zeigen weiterhin nur „wem gefolgt wurde“ (M/F, 7 Tage).
3) „Neue Follower“ und „Folgt neu“ sind klar getrennt und textlich eindeutig.
4) Bestehende falsche Alt-Events verfälschen die UI nicht mehr.
5) Nach 1–2 Scanzyklen bleiben Counts stabil/plausibel statt explosionsartig.
