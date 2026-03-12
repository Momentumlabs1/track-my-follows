

## Plan: Automatische Baseline-Recovery in smart-scan

### Problem

`create-baseline` wird aktuell **fire-and-forget vom Frontend** aufgerufen (in `AnalyzingProfile.tsx`, Zeile 60-69). Das ist unzuverlässig:
- User navigiert weg, Request wird vom Browser abgebrochen
- Session-Token kann ablaufen
- Netzwerkfehler bleiben unbemerkt

Ergebnis: Profile wie Tim bleiben mit `baseline_complete: false` und `gender_sample_size: 0` stecken. Der `trigger-scan` lädt nur Seite 1 (~200 Accounts), die restlichen Seiten werden nie nachgeladen.

### Loesung

**`smart-scan`** bekommt eine Baseline-Recovery-Logik. Bei jedem Scan-Durchlauf prüft es: Wenn ein Profil `initial_scan_done = true` UND `baseline_complete = false` hat, wird `create-baseline` **server-seitig** aufgerufen (Service-Role, kein User-Token noetig).

### Aenderungen

**1. `supabase/functions/smart-scan/index.ts`**
- Nach dem erfolgreichen Scan eines Profils (sowohl Spy als auch Basic): Prüfe ob `baseline_complete === false`
- Falls ja: Rufe `create-baseline` direkt per `fetch()` auf (gleicher Supabase-URL, Service-Role-Key als Auth)
- Fire-and-forget server-seitig (nicht await-en, damit smart-scan nicht blockiert wird)
- Log-Eintrag fuer Nachvollziehbarkeit

**2. `supabase/functions/create-baseline/index.ts`**
- Erweitere Auth-Logik: Akzeptiere auch **Service-Role-Key** als Authorization (nicht nur User-Token)
- Wenn Service-Role-Key verwendet wird, ueberspringt die User-Ownership-Pruefung (das Profil wird direkt per profileId geladen)
- Das ermoeglicht server-seitige Aufrufe von smart-scan ohne User-Session

**3. `src/pages/AnalyzingProfile.tsx`** (optional, Cleanup)
- Den fire-and-forget `create-baseline` Aufruf im Frontend entfernen oder beibehalten als "Best-Effort first try"
- Empfehlung: Beibehalten als schnellen Erstversuch, smart-scan dient als Fallback-Retry

### Ablauf nach Implementierung

```text
User fuegt Profil hinzu
  → trigger-scan (Seite 1, ~200 Accounts)
  → Frontend: create-baseline fire-and-forget (1. Versuch)
     ├─ Erfolgreich → baseline_complete = true ✓
     └─ Fehlgeschlagen → baseline_complete bleibt false
        → Naechster smart-scan (1h/24h spaeter)
           └─ Erkennt baseline_complete = false
           └─ Ruft create-baseline server-seitig auf (Retry)
           └─ Wiederholt bei jedem Scan bis Erfolg
```

### Kein DB-Change noetig

Alles passiert in Edge-Function-Logik. Bestehende Spalten `baseline_complete` und `initial_scan_done` werden genutzt.

