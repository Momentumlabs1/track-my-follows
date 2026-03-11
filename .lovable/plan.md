

## Problem: Backend Gender-Erkennung nutzt nur ~150 Namen statt 1.677

### Analyse

Die DB-Daten zeigen das Problem klar:
- **diego_gut1**: 285 Followings, aber nur 50 erkannt (17.5%), 235 "unknown"
- Beispiele aus den "unknown"-Einträgen die erkannt werden MÜSSTEN:
  - "Viktor Egeric" → male, "Vicky Gutierrez" → female, "Benjamin Fowler" → male, "Joachim Schill" → male, "Steve" → male
  - "𝐊𝐚𝐢𝐬𝐢𝐧𝐡𝐨" → stilisierter Unicode, braucht NFKD-Normalisierung
  - "𝕰𝖚𝖌𝖊𝖓" → stilisiertes "Eugen", braucht NFKD-Normalisierung

**Ursache**: Das Frontend (`src/lib/genderDetection.ts`) hat 1.677 Namen + Unicode-Normalisierung + Nickname-Auflösung + Suffix-Heuristiken. Die Edge Functions (trigger-scan, smart-scan, create-baseline, unfollow-check) haben jeweils eine eigene **Minimalversion** mit nur ~150 Namen pro Geschlecht und KEINE Unicode-Normalisierung.

### Plan

#### 1. Shared Gender-Detection für Edge Functions erstellen
- Neue Datei: `supabase/functions/_shared/genderDetection.ts`
- Enthält die komplette 1.677-Namen-Liste aus `src/lib/genderDetection.ts`
- Enthält NFKD-Unicode-Normalisierung (für stilisierte Instagram-Namen)
- Enthält Nickname-Auflösung und Suffix-Heuristiken
- Export: `detectGender(fullName)` Funktion

#### 2. Alle 4 Edge Functions updaten
- `trigger-scan/index.ts`: Inline detectGender + FEMALE/MALE_NAMES entfernen, Import von shared
- `smart-scan/index.ts`: Inline detectGender + FEMALE/MALE_NAMES entfernen, Import von shared
- `create-baseline/index.ts`: Inline detectGender + FEMALE/MALE_NAMES entfernen, Import von shared
- `unfollow-check/index.ts`: Inline detectGender + FEMALE/MALE_NAMES entfernen, Import von shared

#### 3. Bestehende DB-Daten reparieren (Edge Function)
- Neue Edge Function: `retag-gender/index.ts`
- Lädt alle `profile_followings` mit `gender_tag = 'unknown'` und vorhandenem `following_display_name`
- Re-evaluiert mit der neuen detectGender-Logik
- Updated die Zeilen + die aggregierten Counts in `tracked_profiles`
- Einmal manuell auslösen, danach kann sie gelöscht werden

### Erwartetes Ergebnis
- Statt ~50/285 erkannt → geschätzt ~180-200/285 erkannt
- Unknown-Rate sinkt von 82% auf ca. 30-35%
- Gender-Bar zeigt endlich realistische Verteilung

### Betroffene Dateien
- `supabase/functions/_shared/genderDetection.ts` (NEU)
- `supabase/functions/trigger-scan/index.ts`
- `supabase/functions/smart-scan/index.ts`
- `supabase/functions/create-baseline/index.ts`
- `supabase/functions/unfollow-check/index.ts`
- `supabase/functions/retag-gender/index.ts` (NEU, einmalig)
- `supabase/config.toml` (neue Function registrieren)

