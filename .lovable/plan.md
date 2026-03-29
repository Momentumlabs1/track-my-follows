
Ziel: Die Zahlen im Entfolgt-Bereich eindeutig und korrekt machen, damit kein „überfüllt/falsch“ Eindruck entsteht.

## Kurzdiagnose (bereits verifiziert)
- Der Account `diego_gut1` wird seit **25.03.** getrackt (passt).
- In der DB sind aktuell **4 echte Unfollow-Events** gespeichert:  
  `shreya__yadavi`, `flipsefelix`, `charlymazuel_`, `secretfreeattraction` (passt zu deinem Screenshot).
- Es gab 2 manuelle Checks (je **2 Unfollows**), daher:
  - Karte oben zeigt „2 Unfollows erkannt“ = **letzter Check**
  - Tab/Listen-Zahl zeigt „4“ = **gesamt seit Trackingstart**
- Das „+18 neue Aktivität“ kommt aus einem technischen Backfill-Fall im `unfollow-check` und wirkt dadurch wie echte neue Follows (ist irreführend).

## Umsetzungsplan

### 1) Backend korrigieren: Backfill strikt von echten neuen Follows trennen
**Datei:** `supabase/functions/unfollow-check/index.ts`
- Neue Kandidaten, die nur wegen Baseline-Lücken auftauchen, als **Backfill** behandeln (nicht als echte neue Aktivität).
- `new_follows_found` nur noch für verifizierbar echte neue Follows zählen.
- Response erweitern um z. B. `baseline_backfill_count`, damit UI korrekt unterscheiden kann.
- Ergebnis: Kein künstliches „+18 neue Aktivität“ mehr bei Baseline-Nachholung.

### 2) UI-Logik im Check-Widget klarstellen
**Datei:** `src/components/UnfollowCheckButton.tsx`
- Ergebnistext explizit als **„Letzter Check“** kennzeichnen.
- „+X neue Aktivität gefunden“ nur anzeigen, wenn es wirklich echte neue Follows sind (nicht Backfill).
- Wenn Backfill passiert ist: neutrale Meldung anzeigen („Baseline ergänzt, bitte erneut prüfen“).

### 3) Entfolgt-Tab semantisch sauber machen
**Datei:** `src/pages/ProfileDetail.tsx`
- Klare Trennung der Kennzahlen:
  - **Letzter Check** (aus letztem `unfollow_checks` Eintrag)
  - **Gesamt seit Trackingstart** (kumulative Event-Liste)
- Bestehende Liste als „Gesamt seit Trackingstart“ labeln, damit 2 vs 4 nicht mehr wie ein Fehler wirkt.

### 4) Texte/i18n angleichen
**Dateien:** `src/i18n/locales/de.json`, `en.json` (ggf. `ar.json`)
- Neue eindeutige Labels für:
  - „Letzter Check“
  - „Gesamt seit Trackingstart“
  - „Baseline ergänzt (kein echter neuer Follow-Alarm)“

### 5) Verifikation (konkret für Diego-Profil)
- 1 manuellen Unfollow-Check auslösen.
- Prüfen:
  - Oben: nur letzter Run
  - Liste/Tab: Gesamtzahl
  - Keine künstlich aufgeblähte „neue Aktivität“ bei Backfill
- DB-Kontrolle:
  - `unfollow_checks` letzter Eintrag plausibel
  - `follow_events` keine Massen-`is_initial=false` Inserts aus Backfill

## Erwartetes Ergebnis
- Keine widersprüchlichen Zahlen mehr.
- Keine „überfüllte“ Aktivitätsmeldung durch Baseline-Nachholung.
- Du siehst klar: Was war im letzten Check vs. was ist insgesamt seit 25.03 erkannt worden.
