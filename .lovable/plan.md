

## Analyse

### Problem 1: "Gender-Analyse läuft im Hintergrund..." dreht ewig
Der Indikator zeigt sich wenn `baseline_complete === false`. Die `create-baseline` Function wird nach dem initialen Scan aufgerufen und iteriert durch alle Followings (bis 10.000). Bei großen Accounts kann sie an Edge Function Timeouts (~150s) scheitern oder die API-Calls schlagen fehl — dann bleibt `baseline_complete` auf `false` und der Spinner dreht für immer.

**Fix:** Den Spinner smarter machen — nach gewisser Zeit (z.B. 10 Min seit `initial_scan_done`) den Spinner verstecken und stattdessen "Gender-Daten konnten nicht geladen werden" zeigen. Oder: wenn `initial_scan_done = true` UND Gender-Daten bereits vorhanden sind (`gender_sample_size > 0`), den Spinner nicht mehr zeigen.

### Problem 2: Private Accounts
Aktuell gibt es KEINEN Check ob das getrackte Profil selbst privat ist. Die HikerAPI liefert `is_private` in der User-Info zurück, aber der Code ignoriert das. Bei privaten Accounts kommen leere Following/Follower-Listen zurück, was zu leeren Ergebnissen führt ohne Erklärung.

**Lösung:**
- Neues Feld `is_private` auf `tracked_profiles` Tabelle
- Edge Functions checken `userInfo.is_private` bei jedem Scan und speichern den Status
- Wenn privat: Scan überspringen, Status "frozen" anzeigen
- Wenn vorher öffentlich und jetzt privat: Bestehende Daten behalten, "Tracking eingefroren" anzeigen
- Wenn privat und noch nie gescannt: "Dieses Profil ist privat und kann nicht überwacht werden"

---

## Plan

### 1) DB: `is_private` Spalte hinzufügen
SQL Migration: `ALTER TABLE tracked_profiles ADD COLUMN is_private boolean DEFAULT false;`
Types in `types.ts` aktualisieren.

### 2) Edge Functions: Private-Check einbauen

**`trigger-scan/index.ts`** (Zeile ~285):
- Nach `userInfo` fetch: `userInfo.is_private` prüfen
- Wenn privat UND noch nie gescannt (`!initial_scan_done`): Error zurückgeben "Profil ist privat"
- Wenn privat UND vorher öffentlich (`initial_scan_done = true`): `is_private = true` setzen, Scan überspringen, "frozen" Status
- Wenn NICHT privat aber `is_private` war `true`: zurücksetzen auf `false` (Account wurde wieder öffentlich)

**`smart-scan/index.ts`** (in `performSpyScan` + `performBasicScan`):
- Gleiche Logik: `userInfo.is_private` checken, wenn privat → Skip + `is_private = true` updaten

**`create-baseline/index.ts`**:
- Nach `userInfo` fetch: wenn privat → `is_private = true` setzen, baseline überspringen

### 3) Frontend: Private-Status anzeigen

**`ProfileDetail.tsx`**:
- Wenn `profile.is_private === true` UND `initial_scan_done`: Banner "🔒 Dieses Profil ist jetzt privat — Tracking eingefroren. Bestehende Daten bleiben erhalten."
- Wenn `profile.is_private === true` UND NICHT `initial_scan_done`: Banner "🔒 Dieses Profil ist privat und kann nicht überwacht werden."
- Scan-Button deaktivieren wenn privat

**`ProfileCard.tsx`**:
- Kleines 🔒-Badge auf der Karte wenn privat

### 4) Gender-Spinner Fix

**`ProfileDetail.tsx`** (Zeile 372-380):
- Bedingung ändern: Spinner nur zeigen wenn `!baseline_complete` UND `gender_sample_size === 0` (oder null)
- Wenn `gender_sample_size > 0` aber `!baseline_complete`: Daten trotzdem anzeigen (sind ja vorhanden, nur ggf. unvollständig)
- Alternativ: Timeout-basiert — wenn `initial_scan_done` seit >10 Min: Spinner durch "Analyse fehlgeschlagen, bitte erneut scannen" ersetzen

### 5) i18n Keys

```
"private_frozen": "🔒 Dieses Profil ist jetzt privat – Tracking eingefroren",
"private_frozen_subtitle": "Bestehende Daten bleiben erhalten. Sobald das Profil wieder öffentlich ist, wird das Tracking fortgesetzt.",
"private_cannot_track": "🔒 Dieses Profil ist privat und kann nicht überwacht werden.",
"gender_analysis_failed": "Gender-Analyse konnte nicht abgeschlossen werden"
```

### Dateien

| Datei | Aktion |
|-------|--------|
| `src/pages/ProfileDetail.tsx` | Private-Banner + Gender-Spinner Fix |
| `src/components/ProfileCard.tsx` | 🔒 Badge bei privat |
| `supabase/functions/trigger-scan/index.ts` | Private-Check nach userInfo |
| `supabase/functions/smart-scan/index.ts` | Private-Check in performSpyScan + performBasicScan |
| `supabase/functions/create-baseline/index.ts` | Private-Check, Skip wenn privat |
| `src/integrations/supabase/types.ts` | `is_private` Feld hinzufügen |
| `src/i18n/locales/de.json` | Neue Keys |
| `src/i18n/locales/en.json` | Neue Keys |

