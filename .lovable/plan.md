

# Plan: Chronologische Reihenfolge in der UI klarer machen

## Problem
Der Bereich "Beim ersten Scan vorhanden" mit dem Label "Bestehend" vermittelt den Eindruck, das seien zufällige bestehende Accounts. In Wirklichkeit sind das die zuletzt gefolgten/neuesten Follower in chronologischer Reihenfolge (neueste oben), wie sie von der API kommen.

## Änderungen

### 1. Überschrift des Bereichs ändern
Statt "Beim ersten Scan vorhanden" → "Zuletzt gefolgt (beim ersten Scan)" bzw. "Neueste Follower (beim ersten Scan)"

### 2. Label pro Eintrag ändern
Statt "Bestehend" → "Vor Tracking" (kürzer, neutraler, impliziert Zeitachse)

### 3. Dateien

**`src/i18n/locales/de.json`**:
- `existing_at_first_scan`: "Beim ersten Scan vorhanden" → "Zuletzt gefolgt (vor Tracking)"
- `initial_scan_label`: "Bestehend" → "Vor Tracking"

**`src/i18n/locales/en.json`**:
- `existing_at_first_scan`: "Present at first scan" → "Most recent (before tracking)"
- `initial_scan_label`: "Existing" → "Before tracking"

**`src/i18n/locales/ar.json`**:
- Gleiche Keys analog übersetzen

### 4. Kontexthinweis unter der Überschrift (optional, empfohlen)
In `src/pages/ProfileDetail.tsx` unter der Section-Header-Zeile (Zeile 449 und 469) einen kleinen Hinweistext einfügen:
```
<p className="text-muted-foreground px-1 mb-2" style={{ fontSize: '0.6875rem' }}>
  {t("initial_scan_hint", "Chronologisch sortiert – neueste oben")}
</p>
```
Und den Key `initial_scan_hint` in allen 3 Locale-Dateien ergänzen.

