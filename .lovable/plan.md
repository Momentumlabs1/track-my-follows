
Ziel: **Unfollow-Zahlen nachvollziehbar machen und die Erkennung so stabilisieren, dass fehlende Baseline-Daten keine “blinden Flecken” mehr erzeugen.**

## Was ich bereits verifiziert habe (dein aktueller Fall)
- Die Zahl `~X Entfolgungen erkannt` kommt aus **`tracked_profiles.pending_unfollow_hint`** (nur Schätzwert aus Smart-Scan-Deltas, kein Namensvergleich).
- Die echten Namen im Tab kommen aus **manuellem `unfollow-check`** via Vergleich:
  - DB-Baseline: `profile_followings (is_current=true)`
  - gegen aktuelle API-Liste
  - Ergebnis als `follow_events(event_type='unfollow')`
- Bei deinem Profil (`6a060c46-...`) war letzter manueller Check erfolgreich und hat **2 Unfollows** gespeichert (`shreya__yadavi`, `flipsefelix`).
- Gleichzeitig zeigt die DB: nur **271 bekannte Followings insgesamt** (269 current + 2 bereits entfolgt), während Live-Count ~287 war.  
  => **Es fehlen historisch Baseline-Einträge**, deshalb kann das System Entfolgungen für nie gespeicherte Accounts nicht nachträglich “erfinden”.

## Warum die Zahl für dich “keinen Sinn” macht
1) **Hint-Banner ist eine Schätzung**, keine exakte Namensliste.  
2) **Exakte Unfollow-Namen funktionieren nur für Accounts, die vorher in deiner gespeicherten Baseline vorhanden waren.**  
3) Wenn Baseline unvollständig war, fehlen später Unfollow-Treffer zwangsläufig.

## Umsetzungsplan (Fix)
1. **Transparenz im UI (sofort)**
   - Hint-Text klar als *Schätzwert* markieren (nicht exakter Nachweis).
   - Im Unfollow-Bereich zusätzlich anzeigen:  
     - Baseline-Abdeckung (z. B. `gespeichert 271 / live 287`)  
     - Hinweis, wenn Genauigkeit eingeschränkt ist.
   - Datei: `src/pages/ProfileDetail.tsx` (+ i18n-Keys in `src/i18n/locales/*.json`).

2. **Baseline-Qualitäts-Guard im `unfollow-check`**
   - Vor Vergleich Coverage berechnen: `db_current / freshFollowingCount`.
   - Wenn Coverage unter Schwellwert (z. B. 90%):
     - **nicht** normalen Unfollow-Vergleich als “final” ausgeben,
     - stattdessen fehlende Einträge als Baseline-Reparatur nachziehen,
     - klaren Response-Code zurückgeben (z. B. `BASELINE_INCOMPLETE_REPAIRED`),
     - Scan-Kontingent erstatten (weil kein vollwertiger Unfollow-Result).
   - Datei: `supabase/functions/unfollow-check/index.ts`.

3. **Root-Cause in `create-baseline` beheben**
   - `baseline_complete` nur auf `true`, wenn Baseline wirklich vollständig/vertrauenswürdig ist.
   - Bei API-Fehler/Partial nicht fälschlich als complete markieren.
   - Verhindert, dass ein Profil dauerhaft mit “kaputter” Baseline weiterläuft.
   - Datei: `supabase/functions/create-baseline/index.ts`.

4. **Hint-Logik absichern (`smart-scan`)**
   - `pending_unfollow_hint` nur erhöhen, wenn Baseline-Coverage ausreichend ist.
   - Bei schlechter Coverage: Hint unterdrücken + Log schreiben.
   - Datei: `supabase/functions/smart-scan/index.ts`.

5. **Gezielte Verifikation (dein konkreter Account)**
   - Baseline-Reparaturlauf auf `diego_gut1`.
   - Danach 1 manueller Unfollow-Check.
   - Prüfen:
     - Coverage nahe 100%
     - keine inkonsistenten Hint-Zahlen
     - Unfollow-Events decken Testfälle sauber ab.

## Technische Details
- Relevante Tabellen/Spalten:
  - `tracked_profiles.pending_unfollow_hint` (Schätzwert)
  - `profile_followings.is_current` (Baseline-Snapshot)
  - `follow_events(event_type='unfollow', direction='following')` (exakte Treffer)
- Relevante Stellen im Code:
  - Hint-Banner: `src/pages/ProfileDetail.tsx` (Unfollow-Tab)
  - Hint-Erzeugung: `supabase/functions/smart-scan/index.ts`
  - Exakter Check: `supabase/functions/unfollow-check/index.ts`
  - Baseline-Aufbau: `supabase/functions/create-baseline/index.ts`

Erwartetes Ergebnis nach Fix:
- Du siehst klar getrennt: **Schätzung vs. exakter Nachweis**.
- Keine falsche Sicherheit mehr bei unvollständiger Baseline.
- Nach Baseline-Reparatur werden zukünftige Entfolgungen deutlich vollständiger erkannt.
