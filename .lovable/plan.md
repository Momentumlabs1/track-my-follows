

## Analyse der Probleme

### 1. Gender-Verteilung zeigt falsche Zahlen (50/50)
**Ursache**: `create-baseline` hat die Followings nicht korrekt in die DB geschrieben, aber `tracked_profiles.gender_female_count=85, gender_male_count=85` gesetzt (in-memory Counts). Der Fallback in `ProfileDetail.tsx` (Zeile 143) nutzt diese falschen Werte. Das eigentliche Problem ist Backend-seitig — die DB hat nur 48 von 262 Followings. Der Code-Fix für `create-baseline` (DB-Count statt Memory-Count) wurde bereits gemacht, muss aber deployed werden und Tim's Baseline muss neu getriggert werden.

**Was jetzt noch fehlt**: Die Gender-Bar soll die Verteilung aus ALLEN `profile_followings` zeigen. Sobald `create-baseline` korrekt deployed ist und für Tim neu läuft, werden alle 262 Accounts in die DB geschrieben und die Counts stimmen. Kein weiterer Frontend-Code-Fix nötig — der Fallback-Mechanismus funktioniert korrekt, er bekommt nur aktuell falsche Daten.

### 2. Weekly Gender Cards zeigen Initial-Daten als "neue Accounts"
**Problem**: `WeeklyGenderCards.tsx` Zeile 83-84: Wenn keine echten neuen Follows existieren (`realFollows.length === 0`), werden Initial-Events als Fallback angezeigt. Das ist falsch — die Kacheln sollen "Diese Woche neu gefolgt" zeigen, also NUR echte neue Follows. Wenn es keine gibt: 0 Frauen, 0 Männer.

## Änderungen

### `src/components/WeeklyGenderCards.tsx`
- Zeile 76-84: Den Fallback auf Initial-Events komplett entfernen
- Nur `realFollows` verwenden, kein Fallback auf `initialFollows`
- `isInitialData` entfernen (wird nicht mehr gebraucht)
- Wenn keine echten Events: Cards zeigen einfach 0/0

### Backend: `create-baseline` deployen + Tim's Baseline resetten
- Die bereits geänderte `create-baseline` Edge Function deployen
- Tim's `baseline_complete` auf `false` zurücksetzen
- `create-baseline` neu triggern via Service-Role → alle 262 Followings werden korrekt in die DB geschrieben → Gender-Bar zeigt dann korrekte Verteilung

